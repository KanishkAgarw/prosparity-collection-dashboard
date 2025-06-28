
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';
import { FilterState } from '@/types/filters';

interface UseOptimizedApplicationsProps {
  filters: FilterState;
  searchTerm: string;
  page: number;
  pageSize: number;
}

interface OptimizedApplicationsResponse {
  applications: Application[];
  totalCount: number;
  filterOptions: {
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
  };
}

export const useOptimizedApplications = ({
  filters,
  searchTerm,
  page,
  pageSize
}: UseOptimizedApplicationsProps) => {
  const { user } = useAuth();
  const [data, setData] = useState<OptimizedApplicationsResponse>({
    applications: [],
    totalCount: 0,
    filterOptions: {
      branches: [],
      teamLeads: [],
      rms: [],
      dealers: [],
      lenders: [],
      statuses: [],
      emiMonths: [],
      repayments: [],
      lastMonthBounce: [],
      ptpDateOptions: [],
      collectionRms: [],
      vehicleStatusOptions: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build query with filters
  const buildQuery = useCallback(() => {
    let query = supabase
      .from('applications')
      .select(`
        *,
        field_status!left(status, demand_date),
        ptp_dates!left(ptp_date, demand_date),
        payment_dates!left(paid_date),
        contact_calling_status!left(contact_type, status, demand_date),
        comments!left(content, user_email, created_at, demand_date)
      `, { count: 'exact' });

    // Apply filters
    if (filters.branch?.length > 0) {
      query = query.in('branch_name', filters.branch);
    }
    if (filters.teamLead?.length > 0) {
      query = query.in('team_lead', filters.teamLead);
    }
    if (filters.rm?.length > 0) {
      query = query.in('rm_name', filters.rm);
    }
    if (filters.collectionRm?.length > 0) {
      query = query.in('collection_rm', filters.collectionRm);
    }
    if (filters.dealer?.length > 0) {
      query = query.in('dealer_name', filters.dealer);
    }
    if (filters.lender?.length > 0) {
      query = query.in('lender_name', filters.lender);
    }
    if (filters.emiMonth?.length > 0) {
      query = query.in('demand_date', filters.emiMonth);
    }
    if (filters.vehicleStatus?.length > 0) {
      if (filters.vehicleStatus.includes('None')) {
        query = query.or(`vehicle_status.is.null,vehicle_status.in.(${filters.vehicleStatus.filter(v => v !== 'None').join(',')})`);
      } else {
        query = query.in('vehicle_status', filters.vehicleStatus);
      }
    }

    // Apply search
    if (searchTerm.trim()) {
      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      query = query.or(`
        applicant_name.ilike.${searchPattern},
        applicant_id.ilike.${searchPattern},
        dealer_name.ilike.${searchPattern},
        lender_name.ilike.${searchPattern},
        rm_name.ilike.${searchPattern},
        collection_rm.ilike.${searchPattern},
        team_lead.ilike.${searchPattern}
      `);
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;
    query = query.range(startIndex, endIndex);

    // Apply ordering
    query = query.order('applicant_name', { ascending: true });

    return query;
  }, [filters, searchTerm, page, pageSize]);

  // Fetch filter options separately for better performance
  const fetchFilterOptions = useCallback(async () => {
    try {
      const { data: apps } = await supabase
        .from('applications')
        .select('branch_name, team_lead, rm_name, collection_rm, dealer_name, lender_name, demand_date, repayment, last_month_bounce, vehicle_status');

      if (!apps) return;

      const branches = [...new Set(apps.map(app => app.branch_name).filter(Boolean))].sort();
      const teamLeads = [...new Set(apps.map(app => app.team_lead).filter(Boolean))].sort();
      const rms = [...new Set(apps.map(app => app.rm_name).filter(Boolean))].sort();
      const collectionRms = [...new Set(apps.map(app => app.collection_rm).filter(Boolean))].sort();
      const dealers = [...new Set(apps.map(app => app.dealer_name).filter(Boolean))].sort();
      const lenders = [...new Set(apps.map(app => app.lender_name).filter(Boolean))].sort();
      const emiMonths = [...new Set(apps.map(app => app.demand_date).filter(Boolean))].sort();
      const repayments = [...new Set(apps.map(app => app.repayment).filter(Boolean))].sort();
      
      // Get statuses from field_status table
      const { data: statuses } = await supabase
        .from('field_status')
        .select('status')
        .order('status');
      
      const uniqueStatuses = [...new Set(statuses?.map(s => s.status) || [])];

      return {
        branches,
        teamLeads,
        rms,
        collectionRms,
        dealers,
        lenders,
        statuses: uniqueStatuses,
        emiMonths,
        repayments,
        lastMonthBounce: ['Not paid', 'Paid on time', '1-5 days late', '6-15 days late', '15+ days late'],
        ptpDateOptions: ['Overdue PTP', "Today's PTP", "Tomorrow's PTP", 'Future PTP', 'No PTP'],
        vehicleStatusOptions: ['Seized', 'Repo', 'Accident', 'None']
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return data.filterOptions;
    }
  }, [data.filterOptions]);

  // Main fetch function
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [applicationsResult, filterOptions] = await Promise.all([
        buildQuery(),
        fetchFilterOptions()
      ]);

      const { data: applications, error: appsError, count } = applicationsResult;

      if (appsError) {
        setError(appsError.message);
        return;
      }

      // Process applications to match expected format
      const processedApplications = applications?.map(app => ({
        ...app,
        field_status: app.field_status?.[0]?.status || 'Unpaid',
        ptp_date: app.ptp_dates?.[0]?.ptp_date,
        paid_date: app.payment_dates?.[0]?.paid_date,
        applicant_calling_status: app.contact_calling_status?.find(c => c.contact_type === 'applicant')?.status || 'Not Called',
        co_applicant_calling_status: app.contact_calling_status?.find(c => c.contact_type === 'co_applicant')?.status || 'Not Called',
        guarantor_calling_status: app.contact_calling_status?.find(c => c.contact_type === 'guarantor')?.status || 'Not Called',
        reference_calling_status: app.contact_calling_status?.find(c => c.contact_type === 'reference')?.status || 'Not Called',
        latest_calling_status: (() => {
          const statuses = app.contact_calling_status?.map(c => c.status) || [];
          const activeStatuses = statuses.filter(s => s !== 'Not Called');
          return activeStatuses.length > 0 ? activeStatuses[0] : 'No Calls';
        })(),
        recent_comments: app.comments?.slice(0, 3) || []
      })) || [];

      setData({
        applications: processedApplications,
        totalCount: count || 0,
        filterOptions: filterOptions || data.filterOptions
      });

    } catch (err) {
      console.error('Error fetching optimized applications:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, buildQuery, fetchFilterOptions, data.filterOptions]);

  // Debounced fetch for search
  const debouncedFetch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(fetchData, 300);
    };
  }, [fetchData]);

  useEffect(() => {
    if (searchTerm) {
      debouncedFetch();
    } else {
      fetchData();
    }
  }, [searchTerm, debouncedFetch, fetchData]);

  return {
    applications: data.applications,
    totalCount: data.totalCount,
    totalPages: Math.ceil(data.totalCount / pageSize),
    currentPage: page,
    filterOptions: data.filterOptions,
    loading,
    error,
    refetch: fetchData
  };
};
