
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';
import { FilterState } from '@/types/filters';

interface UseOptimizedApplicationsV2Props {
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

// Cache for filter options and application pages
const filterOptionsCache = {
  data: null as any,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutes
};

const applicationPagesCache = new Map<string, {
  data: Application[];
  totalCount: number;
  timestamp: number;
  ttl: number;
}>();

export const useOptimizedApplicationsV2 = ({
  filters,
  searchTerm,
  page,
  pageSize
}: UseOptimizedApplicationsV2Props) => {
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

  // Generate cache key for current query
  const cacheKey = useMemo(() => {
    return JSON.stringify({ filters, searchTerm, page, pageSize });
  }, [filters, searchTerm, page, pageSize]);

  // Build optimized query with single JOIN
  const buildOptimizedQuery = useCallback(() => {
    console.log('Building query with filters:', filters);
    
    let baseQuery = supabase
      .from('applications')
      .select(`
        *,
        field_status!left(status, created_at),
        ptp_dates!left(ptp_date, created_at),
        payment_dates!left(paid_date),
        contact_calling_status!left(contact_type, status),
        comments!left(content, user_email, created_at)
      `, { count: 'exact' });

    // Apply filters
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

    // Apply search
    if (searchTerm.trim()) {
      const pattern = `%${searchTerm.toLowerCase()}%`;
      baseQuery = baseQuery.or(`
        applicant_name.ilike.${pattern},
        applicant_id.ilike.${pattern},
        dealer_name.ilike.${pattern},
        lender_name.ilike.${pattern},
        rm_name.ilike.${pattern},
        collection_rm.ilike.${pattern},
        team_lead.ilike.${pattern}
      `);
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;
    baseQuery = baseQuery.range(startIndex, endIndex);

    // Apply ordering
    baseQuery = baseQuery.order('applicant_name', { ascending: true });

    return baseQuery;
  }, [filters, searchTerm, page, pageSize]);

  // Process joined data efficiently
  const processJoinedData = useCallback((rawData: any[]): Application[] => {
    return rawData.map(app => {
      // Get latest field status
      const latestFieldStatus = app.field_status?.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      // Get latest PTP date
      const latestPtpDate = app.ptp_dates?.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      // Process contact calling statuses
      const contacts = app.contact_calling_status || [];
      const applicantCalling = contacts.find((c: any) => c.contact_type === 'applicant');
      const coApplicantCalling = contacts.find((c: any) => c.contact_type === 'co_applicant');
      const guarantorCalling = contacts.find((c: any) => c.contact_type === 'guarantor');
      const referenceCalling = contacts.find((c: any) => c.contact_type === 'reference');

      // Process recent comments
      const recentComments = (app.comments || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
        .map((c: any) => ({
          content: c.content,
          user_name: c.user_email || 'Unknown'
        }));

      return {
        ...app,
        field_status: latestFieldStatus?.status || 'Unpaid',
        ptp_date: latestPtpDate?.ptp_date,
        paid_date: app.payment_dates?.[0]?.paid_date,
        applicant_calling_status: applicantCalling?.status || 'Not Called',
        co_applicant_calling_status: coApplicantCalling?.status || 'Not Called',
        guarantor_calling_status: guarantorCalling?.status || 'Not Called',
        reference_calling_status: referenceCalling?.status || 'Not Called',
        latest_calling_status: contacts.find((c: any) => c.status !== 'Not Called')?.status || 'No Calls',
        recent_comments: recentComments
      };
    });
  }, []);

  // Fetch filter options with caching
  const fetchFilterOptions = useCallback(async () => {
    const now = Date.now();
    
    // Check cache first
    if (filterOptionsCache.data && (now - filterOptionsCache.timestamp) < filterOptionsCache.ttl) {
      console.log('Using cached filter options');
      return filterOptionsCache.data;
    }

    console.log('Fetching fresh filter options');
    try {
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('branch_name, team_lead, rm_name, collection_rm, dealer_name, lender_name, demand_date, repayment, vehicle_status');

      if (appsError) {
        console.error('Error fetching applications for filter options:', appsError);
        return null;
      }

      if (!apps) {
        console.warn('No applications found for filter options');
        return null;
      }

      console.log(`Fetched ${apps.length} applications for filter options`);

      const options = {
        branches: [...new Set(apps.map(app => app.branch_name).filter(Boolean))].sort(),
        teamLeads: [...new Set(apps.map(app => app.team_lead).filter(Boolean))].sort(),
        rms: [...new Set(apps.map(app => app.rm_name).filter(Boolean))].sort(),
        collectionRms: [...new Set(apps.map(app => app.collection_rm).filter(Boolean))].sort(),
        dealers: [...new Set(apps.map(app => app.dealer_name).filter(Boolean))].sort(),
        lenders: [...new Set(apps.map(app => app.lender_name).filter(Boolean))].sort(),
        emiMonths: [...new Set(apps.map(app => app.demand_date).filter(Boolean))].sort(),
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

      console.log('Filter options prepared:', options);

      // Cache the options
      filterOptionsCache.data = options;
      filterOptionsCache.timestamp = now;

      return options;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return null;
    }
  }, []);

  // Main fetch function with caching
  const fetchData = useCallback(async () => {
    if (!user) {
      console.log('No user, skipping fetch');
      return;
    }
    
    console.log('Fetching data with cache key:', cacheKey);
    
    // Check cache first
    const cachedPage = applicationPagesCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedPage && (now - cachedPage.timestamp) < cachedPage.ttl) {
      console.log('Using cached applications data');
      setData(prev => ({
        ...prev,
        applications: cachedPage.data,
        totalCount: cachedPage.totalCount
      }));
      setLoading(false);
      return;
    }

    console.log('Fetching fresh applications data');
    setLoading(true);
    setError(null);
    
    try {
      const [applicationsResult, filterOptions] = await Promise.all([
        buildOptimizedQuery(),
        fetchFilterOptions()
      ]);

      const { data: rawApplications, error: appsError, count } = applicationsResult;

      if (appsError) {
        console.error('Error fetching applications:', appsError);
        setError(appsError.message);
        return;
      }

      console.log(`Fetched ${rawApplications?.length || 0} applications, total count: ${count}`);

      const processedApplications = processJoinedData(rawApplications || []);

      // Cache the page
      applicationPagesCache.set(cacheKey, {
        data: processedApplications,
        totalCount: count || 0,
        timestamp: now,
        ttl: 2 * 60 * 1000 // 2 minutes for application data
      });

      // Clean old cache entries
      if (applicationPagesCache.size > 10) {
        const entries = Array.from(applicationPagesCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (let i = 0; i < 5; i++) {
          applicationPagesCache.delete(entries[i][0]);
        }
      }

      setData(prev => ({
        applications: processedApplications,
        totalCount: count || 0,
        filterOptions: filterOptions || prev.filterOptions
      }));

    } catch (err) {
      console.error('Error fetching optimized applications:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user, buildOptimizedQuery, fetchFilterOptions, processJoinedData, cacheKey]);

  // Debounced fetch for search
  const debouncedFetch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(fetchData, 300);
    };
  }, [fetchData]);

  // Initial load and filter options fetch
  useEffect(() => {
    console.log('Initial useEffect triggered, user:', !!user);
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Handle search with debouncing
  useEffect(() => {
    if (searchTerm) {
      console.log('Search term changed, debouncing fetch');
      debouncedFetch();
    } else {
      console.log('No search term, fetching immediately');
      fetchData();
    }
  }, [searchTerm, debouncedFetch, fetchData]);

  // Clear cache when filters change significantly
  useEffect(() => {
    const filterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
    if (filterCount === 0) {
      console.log('No filters applied, clearing cache');
      applicationPagesCache.clear();
    }
  }, [filters]);

  console.log('Hook state:', { 
    applicationsCount: data.applications.length, 
    totalCount: data.totalCount, 
    loading, 
    error 
  });

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
