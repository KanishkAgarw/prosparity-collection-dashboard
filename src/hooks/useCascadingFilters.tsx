
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
    emiMonth: [], // Will be managed by single EMI month selector
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
  const [loading, setLoading] = useState(false);

  // Fetch latest EMI month from database and set as default
  const fetchLatestEmiMonth = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('demand_date')
        .not('demand_date', 'is', null)
        .order('demand_date', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching latest EMI month:', error);
        return;
      }

      if (data && data.length > 0) {
        const latestMonth = data[0].demand_date;
        console.log('Latest EMI month found:', latestMonth);
        setDefaultEmiMonth(latestMonth);
        
        // Auto-select the latest month if no EMI month is currently selected
        if (!selectedEmiMonth) {
          setSelectedEmiMonth(latestMonth);
        }
      }
    } catch (error) {
      console.error('Error fetching latest EMI month:', error);
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

      // Build base query with current filter constraints and selected EMI month
      let baseQuery = supabase
        .from('applications')
        .select('branch_name, team_lead, rm_name, collection_rm, dealer_name, lender_name, demand_date, repayment, vehicle_status')
        .eq('demand_date', selectedEmiMonth); // Always filter by selected EMI month

      // Apply existing filters to constrain options
      if (filters.branch?.length > 0) {
        baseQuery = baseQuery.in('branch_name', filters.branch);
      }
      if (filters.teamLead?.length > 0) {
        baseQuery = baseQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        baseQuery = baseQuery.in('rm_name', filters.rm);
      }
      if (filters.collectionRm?.length > 0) {
        baseQuery = baseQuery.in('collection_rm', filters.collectionRm);
      }
      if (filters.dealer?.length > 0) {
        baseQuery = baseQuery.in('dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        baseQuery = baseQuery.in('lender_name', filters.lender);
      }
      if (filters.repayment?.length > 0) {
        baseQuery = baseQuery.in('repayment', filters.repayment);
      }
      if (filters.vehicleStatus?.length > 0) {
        if (filters.vehicleStatus.includes('None')) {
          baseQuery = baseQuery.or(`vehicle_status.is.null,vehicle_status.in.(${filters.vehicleStatus.filter(v => v !== 'None').join(',')})`);
        } else {
          baseQuery = baseQuery.in('vehicle_status', filters.vehicleStatus);
        }
      }

      const { data: apps, error: appsError } = await baseQuery;

      if (appsError) {
        console.error('Error fetching applications for filter options:', appsError);
        return;
      }

      if (!apps) {
        console.warn('No applications found for filter options');
        return;
      }

      console.log(`Processing ${apps.length} applications for filter options`);

      // Extract unique values for each filter
      const options: CascadingFilterOptions = {
        branches: [...new Set(apps.map(app => app.branch_name).filter(Boolean))].sort(),
        teamLeads: [...new Set(apps.map(app => app.team_lead).filter(Boolean))].sort(),
        rms: [...new Set(apps.map(app => app.rm_name).filter(Boolean))].sort(),
        collectionRms: [...new Set(apps.map(app => app.collection_rm).filter(Boolean))].sort(),
        dealers: [...new Set(apps.map(app => app.dealer_name).filter(Boolean))].sort(),
        lenders: [...new Set(apps.map(app => app.lender_name).filter(Boolean))].sort(),
        emiMonths: [selectedEmiMonth], // Only show current selected month
        repayments: [...new Set(apps.map(app => app.repayment).filter(Boolean))].sort(),
        lastMonthBounce: ['Not paid', 'Paid on time', '1-5 days late', '6-15 days late', '15+ days late'],
        ptpDateOptions: ['Overdue PTP', "Today's PTP", "Tomorrow's PTP", 'Future PTP', 'No PTP'],
        vehicleStatusOptions: ['Seized', 'Repo', 'Accident', 'None'],
        statuses: []
      };

      // Get statuses from field_status table for the selected month
      const { data: statuses, error: statusError } = await supabase
        .from('field_status')
        .select('status')
        .eq('demand_date', selectedEmiMonth)
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

  // Initialize on mount
  useEffect(() => {
    if (user && !defaultEmiMonth) {
      fetchLatestEmiMonth();
    }
  }, [user, defaultEmiMonth, fetchLatestEmiMonth]);

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
    defaultEmiMonth,
    loading
  };
};
