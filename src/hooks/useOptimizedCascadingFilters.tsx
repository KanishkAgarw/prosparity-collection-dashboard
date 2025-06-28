import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';
import { useQueryCache } from './useQueryCache';
import { normalizeEmiMonth, groupDatesByMonth } from '@/utils/dateUtils';

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

export const useOptimizedCascadingFilters = () => {
  const { user } = useAuth();
  const { getCachedData, setCachedData } = useQueryCache<CascadingFilterOptions>();
  
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

  // Cached EMI months fetch
  const fetchAllEmiMonths = useCallback(async () => {
    if (!user) return;

    const cacheKey = 'emi-months-all';
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('Using cached EMI months');
      setEmiMonthOptions(cached.emiMonths);
      if (cached.emiMonths.length > 0) {
        const latestMonth = cached.emiMonths[0];
        setDefaultEmiMonth(latestMonth);
        if (!selectedEmiMonth) {
          setSelectedEmiMonth(latestMonth);
        }
      }
      return;
    }

    try {
      console.log('Fetching EMI months - using collection table only for better performance');

      const { data: colDates } = await supabase
        .from('collection')
        .select('demand_date')
        .not('demand_date', 'is', null)
        .limit(1000); // Limit to prevent excessive data transfer

      const allDates: string[] = [];
      colDates?.forEach(item => {
        if (item.demand_date) allDates.push(item.demand_date);
      });

      const monthGroups = groupDatesByMonth(allDates);
      const sortedMonths = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));
      
      setEmiMonthOptions(sortedMonths);

      if (sortedMonths.length > 0) {
        const latestMonth = sortedMonths[0];
        setDefaultEmiMonth(latestMonth);
        
        if (!selectedEmiMonth) {
          setSelectedEmiMonth(latestMonth);
        }
      }

      // Cache for 10 minutes
      setCachedData(cacheKey, { emiMonths: sortedMonths }, 10 * 60 * 1000);
      console.log('Cached EMI months:', sortedMonths.length);
    } catch (error) {
      console.error('Error fetching EMI months:', error);
    }
  }, [user, selectedEmiMonth, getCachedData, setCachedData]);

  // Optimized filter options fetch with aggressive caching
  const fetchFilterOptions = useCallback(async () => {
    if (!user || !selectedEmiMonth) return;

    const cacheKey = `filter-options-${selectedEmiMonth}-${JSON.stringify(filters)}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      console.log('Using cached filter options');
      setAvailableOptions(cached);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching filter options with single optimized query');

      const monthStart = `${selectedEmiMonth}-01`;
      const monthEnd = `${selectedEmiMonth}-31`;

      // Single optimized query with joins
      const { data: combinedData } = await supabase
        .from('collection')
        .select(`
          team_lead,
          rm_name,
          collection_rm,
          repayment,
          applications!inner(
            branch_name,
            dealer_name,
            lender_name,
            vehicle_status
          )
        `)
        .gte('demand_date', monthStart)
        .lte('demand_date', monthEnd)
        .limit(5000); // Reasonable limit

      if (!combinedData) return;

      console.log(`Processing ${combinedData.length} combined records for filter options`);

      // Extract unique values efficiently
      const options: CascadingFilterOptions = {
        branches: [...new Set(combinedData.map(item => item.applications?.branch_name).filter(Boolean))].sort(),
        teamLeads: [...new Set(combinedData.map(item => item.team_lead).filter(Boolean))].sort(),
        rms: [...new Set(combinedData.map(item => item.rm_name).filter(Boolean))].sort(),
        collectionRms: [...new Set(combinedData.map(item => {
          const rm = item.collection_rm;
          if (!rm || rm === 'NA') return 'N/A';
          return rm;
        }).filter(Boolean))].sort(),
        dealers: [...new Set(combinedData.map(item => item.applications?.dealer_name).filter(Boolean))].sort(),
        lenders: [...new Set(combinedData.map(item => item.applications?.lender_name).filter(Boolean))].sort(),
        repayments: [...new Set(combinedData.map(item => item.repayment).filter(Boolean))].sort(),
        emiMonths: [selectedEmiMonth],
        lastMonthBounce: ['Not paid', 'Paid on time', '1-5 days late', '6-15 days late', '15+ days late'],
        ptpDateOptions: ['Overdue PTP', "Today's PTP", "Tomorrow's PTP", 'Future PTP', 'No PTP'],
        vehicleStatusOptions: ['Seized', 'Repo', 'Accident', 'None'],
        statuses: [] // Will be populated separately if needed
      };

      // Cache for 8 minutes
      setCachedData(cacheKey, options, 8 * 60 * 1000);
      setAvailableOptions(options);
      console.log('Filter options cached and set');

    } catch (error) {
      console.error('Error fetching cascading filter options:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedEmiMonth, filters, getCachedData, setCachedData]);

  // Rest of the hook remains the same but with memoized callbacks
  const handleFilterChange = useCallback((key: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: values
    }));
  }, []);

  const handleEmiMonthChange = useCallback((month: string) => {
    setSelectedEmiMonth(month);
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

  // Debounced filter options fetch
  useEffect(() => {
    if (user && selectedEmiMonth) {
      const timeout = setTimeout(() => {
        fetchFilterOptions();
      }, 200); // Small debounce

      return () => clearTimeout(timeout);
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
