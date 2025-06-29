
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';
import { FilterState } from '@/types/filters';
import { getMonthDateRange } from '@/utils/dateUtils';
import { useQueryCache } from './useQueryCache';
import { useDebouncedAPI } from './useDebouncedAPI';

interface UseOptimizedApplicationsV3Props {
  filters: FilterState;
  searchTerm: string;
  page: number;
  pageSize: number;
  selectedEmiMonth?: string | null;
}

interface ApplicationsResponse {
  applications: Application[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

export const useOptimizedApplicationsV3 = ({
  filters,
  searchTerm,
  page,
  pageSize,
  selectedEmiMonth
}: UseOptimizedApplicationsV3Props): ApplicationsResponse => {
  const { user } = useAuth();
  const { getCachedData, setCachedData, invalidateCache } = useQueryCache<ApplicationsResponse>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Create cache key based on all parameters
  const cacheKey = useMemo(() => {
    return `applications-${selectedEmiMonth}-${JSON.stringify(filters)}-${searchTerm}-${page}-${pageSize}`;
  }, [selectedEmiMonth, filters, searchTerm, page, pageSize]);

  const fetchApplicationsCore = useCallback(async () => {
    if (!user || !selectedEmiMonth) {
      return { applications: [], totalCount: 0, totalPages: 0, loading: false, refetch: async () => {} };
    }

    console.log('=== OPTIMIZED V3 FETCH START ===');
    console.log('Cache key:', cacheKey);
    console.log('Search term:', searchTerm);

    // Check cache first
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      console.log('Using cached data, skipping API call');
      return cachedResult;
    }

    const { start, end } = getMonthDateRange(selectedEmiMonth);
    console.log('Date range:', start, 'to', end);

    // Use a single optimized query with joins instead of multiple batched queries
    let query = supabase
      .from('collection')
      .select(`
        *,
        applications!inner(*)
      `, { count: 'exact' })
      .gte('demand_date', start)
      .lte('demand_date', end);

    // Apply filters directly in the query
    if (filters.teamLead?.length > 0) {
      query = query.in('team_lead', filters.teamLead);
    }
    if (filters.rm?.length > 0) {
      query = query.in('rm_name', filters.rm);
    }
    if (filters.collectionRm?.length > 0) {
      const normalizedCollectionRms = filters.collectionRm.map(rm => 
        rm === 'N/A' || rm === 'NA' ? 'N/A' : rm
      );
      query = query.or(`collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`);
    }
    if (filters.repayment?.length > 0) {
      query = query.in('repayment', filters.repayment);
    }

    // Apply applications table filters
    if (filters.branch?.length > 0) {
      query = query.in('applications.branch_name', filters.branch);
    }
    if (filters.dealer?.length > 0) {
      query = query.in('applications.dealer_name', filters.dealer);
    }
    if (filters.lender?.length > 0) {
      query = query.in('applications.lender_name', filters.lender);
    }

    // Apply search with expanded scope and corrected table references
    if (searchTerm.trim()) {
      const normalizedSearchTerm = searchTerm.trim();
      console.log('Applying search for term:', normalizedSearchTerm);
      
      // Build comprehensive search across multiple fields with proper table references
      const searchConditions = [
        // Application-specific fields (from applications table)
        `applications.applicant_name.ilike.%${normalizedSearchTerm}%`,
        `applications.applicant_id.ilike.%${normalizedSearchTerm}%`,
        `applications.applicant_mobile.ilike.%${normalizedSearchTerm}%`,
        `applications.dealer_name.ilike.%${normalizedSearchTerm}%`,
        `applications.lender_name.ilike.%${normalizedSearchTerm}%`,
        `applications.branch_name.ilike.%${normalizedSearchTerm}%`,
        
        // Collection-specific fields (from collection table)
        `rm_name.ilike.%${normalizedSearchTerm}%`,
        `collection_rm.ilike.%${normalizedSearchTerm}%`,
        `team_lead.ilike.%${normalizedSearchTerm}%`
      ];
      
      query = query.or(searchConditions.join(','));
      console.log('Search conditions applied:', searchConditions.length, 'fields');
    }

    // Apply pagination at database level
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);
    query = query.order('demand_date', { ascending: false });

    console.log('Executing optimized single query with search...');
    const { data: collectionData, error, count } = await query;

    if (error) {
      console.error('Optimized query with search failed:', error);
      throw error;
    }

    console.log(`Fetched ${collectionData?.length || 0} records, total count: ${count}`);

    // Transform the joined data into Application format
    const transformedApplications: Application[] = (collectionData || []).map(record => {
      const app = record.applications;
      return {
        // Collection data (primary)
        id: record.application_id,
        applicant_id: record.application_id,
        demand_date: record.demand_date,
        emi_amount: record.emi_amount || 0,
        amount_collected: record.amount_collected || 0,
        lms_status: record.lms_status || 'Unpaid',
        collection_rm: record.collection_rm || 'N/A',
        team_lead: record.team_lead || '',
        rm_name: record.rm_name || '',
        repayment: record.repayment || '',
        last_month_bounce: record.last_month_bounce || 0,
        field_status: 'Unpaid', // Will be updated by field status hook

        // Application data (secondary)
        applicant_name: app?.applicant_name || 'Unknown',
        applicant_mobile: app?.applicant_mobile || '',
        applicant_address: app?.applicant_address || '',
        branch_name: app?.branch_name || '',
        dealer_name: app?.dealer_name || '',
        lender_name: app?.lender_name || '',
        principle_due: app?.principle_due || 0,
        interest_due: app?.interest_due || 0,
        loan_amount: app?.loan_amount || 0,
        vehicle_status: app?.vehicle_status,
        fi_location: app?.fi_location,
        house_ownership: app?.house_ownership,
        co_applicant_name: app?.co_applicant_name,
        co_applicant_mobile: app?.co_applicant_mobile,
        co_applicant_address: app?.co_applicant_address,
        guarantor_name: app?.guarantor_name,
        guarantor_mobile: app?.guarantor_mobile,
        guarantor_address: app?.guarantor_address,
        reference_name: app?.reference_name,
        reference_mobile: app?.reference_mobile,
        reference_address: app?.reference_address,
        disbursement_date: app?.disbursement_date,
        created_at: app?.created_at || new Date().toISOString(),
        updated_at: app?.updated_at || new Date().toISOString(),
        user_id: app?.user_id || user.id
      } as Application;
    });

    const result = {
      applications: transformedApplications,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      loading: false,
      refetch: async () => {}
    };

    // Cache the result for 3 minutes (shorter than filter cache)
    setCachedData(cacheKey, result, 3 * 60 * 1000);
    
    console.log('=== OPTIMIZED V3 FETCH COMPLETE ===');
    console.log('Search results:', transformedApplications.length, 'applications found');
    return result;
  }, [user, selectedEmiMonth, filters, searchTerm, page, pageSize, cacheKey, getCachedData, setCachedData]);

  // Use debounced API call with reduced debounce for faster search response
  const { data: apiResult, loading: apiLoading, call: debouncedFetch } = useDebouncedAPI(
    fetchApplicationsCore,
    200 // Reduced from 300ms to 200ms for faster search response
  );

  // Update local state when API result changes
  useEffect(() => {
    if (apiResult) {
      setApplications(apiResult.applications);
      setTotalCount(apiResult.totalCount);
    }
  }, [apiResult]);

  // Trigger debounced fetch when dependencies change
  useEffect(() => {
    setLoading(true);
    debouncedFetch();
  }, [debouncedFetch]);

  useEffect(() => {
    setLoading(apiLoading);
  }, [apiLoading]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  // Refetch function that invalidates cache
  const refetch = useCallback(async () => {
    console.log('Refetch called - invalidating cache');
    invalidateCache(selectedEmiMonth || 'applications');
    await debouncedFetch();
  }, [invalidateCache, selectedEmiMonth, debouncedFetch]);

  return {
    applications,
    totalCount,
    totalPages,
    loading,
    refetch
  };
};
