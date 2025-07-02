import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';
import { formatEmiMonth } from '@/utils/formatters';
import { useFilterCache } from './useFilterCache';
import { normalizeEmiMonth, groupDatesByMonth } from '@/utils/dateUtils';
import { VEHICLE_STATUS_OPTIONS } from '@/constants/options';

interface CascadingFilterOptions {
  branches: string[];
  teamLeads: string[];
  rms: string[];
  dealers: string[];
  lenders: string[];
  statuses: string[];
  emiMonths: string[];
  repayments: string[];
  lastMonthBounce: string[];
  ptpDateOptions: string[];
  collectionRms: string[];
  vehicleStatusOptions: string[];
}

export const useCascadingFilters = () => {
  const { user } = useAuth();
  const { getCachedData, setCachedData } = useFilterCache<CascadingFilterOptions>('filter-options');
  
  const [filters, setFilters] = useState<FilterState>({
    branch: [],
    teamLead: [],
    rm: [],
    dealer: [],
    lender: [],
    status: [],
    emiMonth: [],
    repayment: [],
    lastMonthBounce: [],
    ptpDate: [],
    collectionRm: [],
    vehicleStatus: []
  });

  const [availableOptions, setAvailableOptions] = useState<CascadingFilterOptions>({
    branches: [],
    teamLeads: [],
    rms: [],
    dealers: [],
    lenders: [],
    statuses: [],
    emiMonths: [],
    repayments: [],
    lastMonthBounce: ['Not paid', 'Paid on time', '1-5 days late', '6-15 days late', '15+ days late'],
    ptpDateOptions: ['Overdue PTP', "Today's PTP", "Tomorrow's PTP", 'Future PTP', 'No PTP'],
    collectionRms: [],
    vehicleStatusOptions: VEHICLE_STATUS_OPTIONS.map(opt => opt.value)
  });

  const [selectedEmiMonth, setSelectedEmiMonth] = useState<string | null>(null);
  const [defaultEmiMonth, setDefaultEmiMonth] = useState<string | null>(null);
  const [emiMonthOptions, setEmiMonthOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all available EMI months from both tables (prioritize collection)
  const fetchAllEmiMonths = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Fetching all EMI months from database...');

      // PRIMARY: Get demand dates from collection table first
      const { data: colDates } = await supabase
        .from('collection')
        .select('demand_date')
        .not('demand_date', 'is', null);

      // SECONDARY: Get demand dates from applications table
      const { data: appDates } = await supabase
        .from('applications')
        .select('demand_date')
        .not('demand_date', 'is', null);

      console.log('Raw collection dates:', colDates?.slice(0, 10));
      console.log('Raw app dates:', appDates?.slice(0, 10));

      // Combine all dates and group by normalized month (prioritize collection data)
      const allDates: string[] = [];
      colDates?.forEach(item => {
        if (item.demand_date) allDates.push(item.demand_date);
      });
      appDates?.forEach(item => {
        if (item.demand_date) allDates.push(item.demand_date);
      });

      // Group dates by normalized month
      const monthGroups = groupDatesByMonth(allDates);
      console.log('Month groups:', monthGroups);

      // Sort normalized months in descending order (newest first)
      const sortedMonths = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));
      setEmiMonthOptions(sortedMonths);

      // Set default to latest month if no month is selected
      if (sortedMonths.length > 0) {
        const latestMonth = sortedMonths[0];
        setDefaultEmiMonth(latestMonth);
        
        if (!selectedEmiMonth) {
          console.log('Setting default EMI month to:', latestMonth);
          setSelectedEmiMonth(latestMonth);
        }
      }

      console.log('Available EMI months:', sortedMonths);
    } catch (error) {
      console.error('Error fetching EMI months:', error);
    }
  }, [user, selectedEmiMonth]);

  // Fetch cascading filter options based on current selections and selected EMI month
  const fetchFilterOptions = useCallback(async () => {
    if (!user || !selectedEmiMonth) return;

    setLoading(true);
    try {
      // Create cache key based on current filter state
      const cacheKey = `${selectedEmiMonth}-${JSON.stringify(filters)}`;
      const cachedOptions = getCachedData(cacheKey);
      
      if (cachedOptions) {
        console.log('Using cached filter options');
        setAvailableOptions(cachedOptions);
        setLoading(false);
        return;
      }

      console.log('Fetching cascading filter options for month:', selectedEmiMonth);

      // Use PostgreSQL date_trunc to filter by month
      const monthStart = `${selectedEmiMonth}-01`;
      const monthEnd = `${selectedEmiMonth}-31`;

      // PRIMARY: Build base query for collection with month filtering
      let collectionQuery = supabase
        .from('collection')
        .select('team_lead, rm_name, collection_rm, repayment, demand_date')
        .gte('demand_date', monthStart)
        .lte('demand_date', monthEnd);

      // SECONDARY: Build base query for applications with month filtering
      let applicationsQuery = supabase
        .from('applications')
        .select('branch_name, team_lead, rm_name, collection_rm, dealer_name, lender_name, demand_date, repayment, vehicle_status')
        .gte('demand_date', monthStart)
        .lte('demand_date', monthEnd);

      // Apply existing filters to constrain options
      if (filters.branch?.length > 0) {
        applicationsQuery = applicationsQuery.in('branch_name', filters.branch);
      }
      if (filters.teamLead?.length > 0) {
        applicationsQuery = applicationsQuery.in('team_lead', filters.teamLead);
        collectionQuery = collectionQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        applicationsQuery = applicationsQuery.in('rm_name', filters.rm);
        collectionQuery = collectionQuery.in('rm_name', filters.rm);
      }
      if (filters.collectionRm?.length > 0) {
        // Normalize collection RM values - treat N/A and NA as the same
        const normalizedCollectionRms = filters.collectionRm.map(rm => 
          rm === 'N/A' || rm === 'NA' ? 'N/A' : rm
        );
        applicationsQuery = applicationsQuery.or(
          `collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`
        );
        collectionQuery = collectionQuery.or(
          `collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`
        );
      }
      if (filters.dealer?.length > 0) {
        applicationsQuery = applicationsQuery.in('dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        applicationsQuery = applicationsQuery.in('lender_name', filters.lender);
      }
      if (filters.repayment?.length > 0) {
        applicationsQuery = applicationsQuery.in('repayment', filters.repayment);
        collectionQuery = collectionQuery.in('repayment', filters.repayment);
      }
      if (filters.vehicleStatus?.length > 0) {
        if (filters.vehicleStatus.includes('None')) {
          applicationsQuery = applicationsQuery.or(`vehicle_status.is.null,vehicle_status.in.(${filters.vehicleStatus.filter(v => v !== 'None').join(',')})`);
        } else {
          applicationsQuery = applicationsQuery.in('vehicle_status', filters.vehicleStatus);
        }
      }

      const [colResult, appResult] = await Promise.all([collectionQuery, applicationsQuery]);

      if (colResult.error) {
        console.error('Error fetching collection for filter options:', colResult.error);
        return;
      }

      if (appResult.error) {
        console.error('Error fetching applications for filter options:', appResult.error);
        return;
      }

      const collections = colResult.data || [];
      const apps = appResult.data || [];

      console.log(`Processing ${collections.length} collection records and ${apps.length} application records for filter options`);

      // Combine data from both sources (prioritize collection data)
      const allData = [...collections, ...apps];

      // Extract unique values for each filter with normalization
      const options: CascadingFilterOptions = {
        branches: [...new Set(apps.map(app => app.branch_name).filter(Boolean))].sort(),
        teamLeads: [...new Set(allData.map(item => item.team_lead).filter(Boolean))].sort(),
        rms: [...new Set(allData.map(item => item.rm_name).filter(Boolean))].sort(),
        collectionRms: [...new Set(allData.map(item => {
          // Normalize N/A and NA to the same value
          const rm = item.collection_rm;
          if (!rm || rm === 'NA') return 'N/A';
          return rm;
        }).filter(Boolean))].sort(),
        dealers: [...new Set(apps.map(app => app.dealer_name).filter(Boolean))].sort(),
        lenders: [...new Set(apps.map(app => app.lender_name).filter(Boolean))].sort(),
        emiMonths: [selectedEmiMonth], // Only show current selected month
        repayments: [...new Set(allData.map(item => item.repayment).filter(Boolean))].sort(),
        lastMonthBounce: ['Not paid', 'Paid on time', '1-5 days late', '6-15 days late', '15+ days late'],
        ptpDateOptions: ['Overdue PTP', "Today's PTP", "Tomorrow's PTP", 'Future PTP', 'No PTP'],
        vehicleStatusOptions: VEHICLE_STATUS_OPTIONS.map(opt => opt.value),
        statuses: []
      };

      // Get statuses from field_status table for the selected month
      const { data: statuses, error: statusError } = await supabase
        .from('field_status')
        .select('status')
        .gte('demand_date', monthStart)
        .lte('demand_date', monthEnd)
        .order('status');
      
      if (statusError) {
        console.error('Error fetching statuses:', statusError);
      } else {
        options.statuses = [...new Set(statuses?.map(s => s.status) || [])];
      }

      console.log('Cascading filter options prepared:', options);
      
      // Cache the options
      setCachedData(cacheKey, options);
      setAvailableOptions(options);

    } catch (error) {
      console.error('Error fetching cascading filter options:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedEmiMonth, filters, getCachedData, setCachedData]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, values: string[]) => {
    console.log('Filter change:', key, values);
    setFilters(prev => ({
      ...prev,
      [key]: values
    }));
  }, []);

  // Handle EMI month change
  const handleEmiMonthChange = useCallback((month: string) => {
    console.log('EMI month changed to:', month);
    setSelectedEmiMonth(month);
    // Clear other filters when EMI month changes to ensure fresh data
    setFilters({
      branch: [],
      teamLead: [],
      rm: [],
      dealer: [],
      lender: [],
      status: [],
      emiMonth: [],
      repayment: [],
      lastMonthBounce: [],
      ptpDate: [],
      collectionRm: [],
      vehicleStatus: []
    });
  }, []);

  // Clear all filters except EMI month
  const clearAllFilters = useCallback(() => {
    setFilters({
      branch: [],
      teamLead: [],
      rm: [],
      dealer: [],
      lender: [],
      status: [],
      emiMonth: [],
      repayment: [],
      lastMonthBounce: [],
      ptpDate: [],
      collectionRm: [],
      vehicleStatus: []
    });
  }, []);

  // Initialize EMI months on mount
  useEffect(() => {
    if (user) {
      fetchAllEmiMonths();
    }
  }, [user, fetchAllEmiMonths]);

  // Fetch options when EMI month or filters change
  useEffect(() => {
    if (user && selectedEmiMonth) {
      fetchFilterOptions();
    }
  }, [user, selectedEmiMonth, filters, fetchFilterOptions]);

  return {
    filters,
    availableOptions,
    handleFilterChange,
    clearAllFilters,
    selectedEmiMonth,
    handleEmiMonthChange,
    emiMonthOptions,
    defaultEmiMonth,
    loading
  };
};
