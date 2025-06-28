
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
  selectedEmiMonth?: string | null;
}

interface ApplicationsResponse {
  applications: Application[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

export const useOptimizedApplicationsV2 = ({
  filters,
  searchTerm,
  page,
  pageSize,
  selectedEmiMonth
}: UseOptimizedApplicationsV2Props): ApplicationsResponse => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Memoize request cache key
  const cacheKey = useMemo(() => {
    return JSON.stringify({
      filters,
      searchTerm,
      page,
      pageSize,
      selectedEmiMonth
    });
  }, [filters, searchTerm, page, pageSize, selectedEmiMonth]);

  const fetchApplications = useCallback(async () => {
    if (!user || !selectedEmiMonth) {
      setApplications([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching applications with:', { 
        filters, 
        searchTerm, 
        page, 
        pageSize, 
        selectedEmiMonth 
      });

      // Build base query with EMI month filter
      let baseQuery = supabase
        .from('applications')
        .select('*')
        .eq('demand_date', selectedEmiMonth)
        .order('created_at', { ascending: false });

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

      // Apply search if provided
      if (searchTerm.trim()) {
        baseQuery = baseQuery.or(`applicant_name.ilike.%${searchTerm}%,applicant_id.ilike.%${searchTerm}%,applicant_mobile.ilike.%${searchTerm}%`);
      }

      // Get total count first
      const { count, error: countError } = await baseQuery.select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error getting count:', countError);
        throw countError;
      }

      const total = count || 0;
      setTotalCount(total);

      // Get paginated results
      const offset = (page - 1) * pageSize;
      const { data: apps, error: appsError } = await baseQuery
        .range(offset, offset + pageSize - 1);

      if (appsError) {
        console.error('Error fetching applications:', appsError);
        throw appsError;
      }

      console.log(`Fetched ${apps?.length || 0} applications (page ${page}/${Math.ceil(total / pageSize)})`);
      
      // Process applications and add derived fields
      const processedApps = (apps || []).map(app => ({
        ...app,
        id: app.id || app.applicant_id,
        field_status: 'Unpaid', // Will be populated by individual row components
      }));

      setApplications(processedApps);

    } catch (error) {
      console.error('Error in fetchApplications:', error);
      setApplications([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [user, selectedEmiMonth, filters, searchTerm, page, pageSize]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  // Refetch function for external use
  const refetch = useCallback(async () => {
    await fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    totalCount,
    totalPages,
    loading,
    refetch
  };
};
