
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';
import { formatEmiMonth } from '@/utils/formatters';
import { useFilterCache } from './useFilterCache';

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

// Utility function to normalize EMI month format
const normalizeEmiMonth = (emiMonth: string): string => {
  if (!emiMonth) return '';
  
  // Check if it's an Excel serial number (numeric string)
  const numericValue = parseFloat(emiMonth);
  if (!isNaN(numericValue) && numericValue > 25000 && numericValue < 100000) {
    // Excel serial date conversion
    const excelEpoch = new Date(1900, 0, 1);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const date = new Date(excelEpoch.getTime() + (numericValue - 2) * millisecondsPerDay);
    return date.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
  }
  
  // If it's already in YYYY-MM format, return as is
  if (emiMonth.match(/^\d{4}-\d{2}$/)) {
    return emiMonth;
  }
  
  // If it's in YYYY-MM-DD format, extract YYYY-MM
  if (emiMonth.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return emiMonth.substring(0, 7);
  }
  
  return emiMonth;
};

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
    vehicleStatusOptions: ['Seized', 'Repo', 'Accident', 'None']
  });

  const [selectedEmiMonth, setSelectedEmiMonth] = useState<string | null>(null);
  const [defaultEmiMonth, setDefaultEmiMonth] = useState<string | null>(null);
  const [emiMonthOptions, setEmiMonthOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all available EMI months from both tables
  const fetchAllEmiMonths = useCallback(async () => {
    if (!user) return;

    try {
      // Get demand dates from applications table
      const { data: appDates } = await supabase
        .from('applications')
        .select('demand_date')
        .not('demand_date', 'is', null);

      // Get demand dates from collection table
      const { data: colDates } = await supabase
        .from('collection')
        .select('demand_date')
        .not('demand_date', 'is', null);

      // Combine and normalize all dates
      const allDates = new Set<string>();
      
      appDates?.forEach(item => {
        if (item.demand_date) {
          const normalized = normalizeEmiMonth(item.demand_date);
          if (normalized) allDates.add(normalized);
        }
      });

      colDates?.forEach(item => {
        if (item.demand_date) {
          const normalized = normalizeEmiMonth(item.demand_date);
          if (normalized) allDates.add(normalized);
        }
      });

      // Sort dates in descending order (newest first)
      const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));
      setEmiMonthOptions(sortedDates);

      // Set default to latest month if no month is selected
      if (sortedDates.length > 0) {
        const latestMonth = sortedDates[0];
        setDefaultEmiMonth(latestMonth);
        
        if (!selectedEmiMonth) {
          setSelectedEmiMonth(latestMonth);
        }
      }

      console.log('Available EMI months:', sortedDates);
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

      const normalizedMonth = normalizeEmiMonth(selectedEmiMonth);

      // Build base query for applications with current filter constraints
      let baseQuery = supabase
        .from('applications')
        .select('branch_name, team_lead, rm_name, collection_rm, dealer_name, lender_name, demand_date, repayment, vehicle_status')
        .eq('demand_date', normalizedMonth);

      // Build base query for collection with current filter constraints
      let collectionQuery = supabase
        .from('collection')
        .select('team_lead, rm_name, collection_rm, repayment, demand_date')
        .eq('demand_date', normalizedMonth);

      // Apply existing filters to constrain options
      if (filters.branch?.length > 0) {
        baseQuery = baseQuery.in('branch_name', filters.branch);
      }
      if (filters.teamLead?.length > 0) {
        baseQuery = baseQuery.in('team_lead', filters.teamLead);
        collectionQuery = collectionQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        baseQuery = baseQuery.in('rm_name', filters.rm);
        collectionQuery = collectionQuery.in('rm_name', filters.rm);
      }
      if (filters.collectionRm?.length > 0) {
        // Normalize collection RM values - treat N/A and NA as the same
        const normalizedCollectionRms = filters.collectionRm.map(rm => 
          rm === 'N/A' || rm === 'NA' ? 'N/A' : rm
        );
        baseQuery = baseQuery.or(
          `collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`
        );
        collectionQuery = collectionQuery.or(
          `collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`
        );
      }
      if (filters.dealer?.length > 0) {
        baseQuery = baseQuery.in('dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        baseQuery = baseQuery.in('lender_name', filters.lender);
      }
      if (filters.repayment?.length > 0) {
        baseQuery = baseQuery.in('repayment', filters.repayment);
        collectionQuery = collectionQuery.in('repayment', filters.repayment);
      }
      if (filters.vehicleStatus?.length > 0) {
        if (filters.vehicleStatus.includes('None')) {
          baseQuery = baseQuery.or(`vehicle_status.is.null,vehicle_status.in.(${filters.vehicleStatus.filter(v => v !== 'None').join(',')})`);
        } else {
          baseQuery = baseQuery.in('vehicle_status', filters.vehicleStatus);
        }
      }

      const [appResult, colResult] = await Promise.all([baseQuery, collectionQuery]);

      if (appResult.error) {
        console.error('Error fetching applications for filter options:', appResult.error);
        return;
      }

      if (colResult.error) {
        console.error('Error fetching collection for filter options:', colResult.error);
        return;
      }

      const apps = appResult.data || [];
      const collections = colResult.data || [];

      console.log(`Processing ${apps.length} applications and ${collections.length} collection records for filter options`);

      // Combine data from both sources
      const allData = [...apps, ...collections];

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
        vehicleStatusOptions: ['Seized', 'Repo', 'Accident', 'None'],
        statuses: []
      };

      // Get statuses from field_status table for the selected month
      const { data: statuses, error: statusError } = await supabase
        .from('field_status')
        .select('status')
        .eq('demand_date', normalizedMonth)
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
