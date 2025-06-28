
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';
import { formatEmiMonth } from '@/utils/formatters';

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

  const [defaultEmiMonth, setDefaultEmiMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Extract selected EMI Month for context-aware filtering
  const selectedEmiMonth = useMemo(() => {
    if (filters.emiMonth.length === 1) {
      return filters.emiMonth[0];
    }
    return defaultEmiMonth;
  }, [filters.emiMonth, defaultEmiMonth]);

  // Fetch latest EMI month from database
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
        if (filters.emiMonth.length === 0) {
          setFilters(prev => ({
            ...prev,
            emiMonth: [latestMonth]
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching latest EMI month:', error);
    }
  }, [user, filters.emiMonth.length]);

  // Fetch cascading filter options based on current selections
  const fetchFilterOptions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Fetching cascading filter options...');

      // Build base query with current filter constraints
      let baseQuery = supabase
        .from('applications')
        .select('branch_name, team_lead, rm_name, collection_rm, dealer_name, lender_name, demand_date, repayment, vehicle_status');

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
      if (filters.emiMonth?.length > 0) {
        baseQuery = baseQuery.in('demand_date', filters.emiMonth);
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
        emiMonths: [...new Set(apps.map(app => app.demand_date).filter(Boolean))].sort().reverse(),
        repayments: [...new Set(apps.map(app => app.repayment).filter(Boolean))].sort(),
        lastMonthBounce: ['Not paid', 'Paid on time', '1-5 days late', '6-15 days late', '15+ days late'],
        ptpDateOptions: ['Overdue PTP', "Today's PTP", "Tomorrow's PTP", 'Future PTP', 'No PTP'],
        vehicleStatusOptions: ['Seized', 'Repo', 'Accident', 'None'],
        statuses: []
      };

      // Get statuses from field_status table
      const { data: statuses, error: statusError } = await supabase
        .from('field_status')
        .select('status')
        .order('status');
      
      if (statusError) {
        console.error('Error fetching statuses:', statusError);
      } else {
        options.statuses = [...new Set(statuses?.map(s => s.status) || [])];
      }

      console.log('Cascading filter options prepared:', options);
      setAvailableOptions(options);

    } catch (error) {
      console.error('Error fetching cascading filter options:', error);
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, values: string[]) => {
    console.log('Filter change:', key, values);
    setFilters(prev => ({
      ...prev,
      [key]: values
    }));
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({
      branch: [],
      teamLead: [],
      rm: [],
      dealer: [],
      lender: [],
      status: [],
      emiMonth: defaultEmiMonth ? [defaultEmiMonth] : [],
      repayment: [],
      lastMonthBounce: [],
      ptpDate: [],
      collectionRm: [],
      vehicleStatus: []
    });
  }, [defaultEmiMonth]);

  // Initialize on mount
  useEffect(() => {
    if (user) {
      fetchLatestEmiMonth();
    }
  }, [user, fetchLatestEmiMonth]);

  // Fetch options when filters change
  useEffect(() => {
    if (user) {
      fetchFilterOptions();
    }
  }, [user, filters, fetchFilterOptions]);

  return {
    filters,
    availableOptions,
    handleFilterChange,
    clearAllFilters,
    selectedEmiMonth,
    defaultEmiMonth,
    loading
  };
};
