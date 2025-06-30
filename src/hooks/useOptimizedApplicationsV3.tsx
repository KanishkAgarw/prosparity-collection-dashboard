
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

    try {
      // Step 1: Build the base query for applications with joins
      let baseQuery = supabase
        .from('collection')
        .select(`
          *,
          applications!inner(*)
        `)
        .gte('demand_date', start)
        .lte('demand_date', end);

      // Apply collection table filters
      if (filters.teamLead?.length > 0) {
        console.log('Applying team lead filter:', filters.teamLead);
        baseQuery = baseQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        console.log('Applying RM filter:', filters.rm);
        baseQuery = baseQuery.in('rm_name', filters.rm);
      }
      if (filters.collectionRm?.length > 0) {
        console.log('Applying collection RM filter:', filters.collectionRm);
        const normalizedCollectionRms = filters.collectionRm.map(rm => 
          rm === 'N/A' || rm === 'NA' ? 'N/A' : rm
        );
        baseQuery = baseQuery.or(`collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`);
      }
      if (filters.repayment?.length > 0) {
        console.log('Applying repayment filter:', filters.repayment);
        baseQuery = baseQuery.in('repayment', filters.repayment);
      }

      // Apply applications table filters
      if (filters.branch?.length > 0) {
        console.log('Applying branch filter:', filters.branch);
        baseQuery = baseQuery.in('applications.branch_name', filters.branch);
      }
      if (filters.dealer?.length > 0) {
        console.log('Applying dealer filter:', filters.dealer);
        baseQuery = baseQuery.in('applications.dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        console.log('Applying lender filter:', filters.lender);
        baseQuery = baseQuery.in('applications.lender_name', filters.lender);
      }

      // Step 2: Apply search if provided using PostgreSQL text search
      if (searchTerm.trim()) {
        const searchPattern = `%${searchTerm.trim()}%`;
        console.log('=== SEARCH IMPLEMENTATION ===');
        console.log('Search pattern:', searchPattern);
        console.log('Search term length:', searchTerm.trim().length);
        
        // Create search conditions for all searchable fields
        const searchConditions = [
          `applications.applicant_name.ilike.%${searchTerm.trim()}%`,
          `applications.applicant_id.ilike.%${searchTerm.trim()}%`,
          `applications.applicant_mobile.ilike.%${searchTerm.trim()}%`,
          `applications.dealer_name.ilike.%${searchTerm.trim()}%`,
          `applications.lender_name.ilike.%${searchTerm.trim()}%`,
          `applications.branch_name.ilike.%${searchTerm.trim()}%`,
          `rm_name.ilike.%${searchTerm.trim()}%`,
          `team_lead.ilike.%${searchTerm.trim()}%`,
          `collection_rm.ilike.%${searchTerm.trim()}%`
        ];
        
        console.log('Search conditions created:', searchConditions.length);
        console.log('Search conditions:', searchConditions);
        
        // Apply OR condition for search
        baseQuery = baseQuery.or(searchConditions.join(','));
        console.log('Search filter applied to query');
      }

      // Step 3: Get total count first using a separate simplified query
      console.log('=== GETTING TOTAL COUNT ===');
      
      let countQuery = supabase
        .from('collection')
        .select('application_id', { count: 'exact', head: true })
        .gte('demand_date', start)
        .lte('demand_date', end);

      // Apply the same filters to count query
      if (filters.teamLead?.length > 0) {
        countQuery = countQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        countQuery = countQuery.in('rm_name', filters.rm);
      }
      if (filters.collectionRm?.length > 0) {
        const normalizedCollectionRms = filters.collectionRm.map(rm => 
          rm === 'N/A' || rm === 'NA' ? 'N/A' : rm
        );
        countQuery = countQuery.or(`collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`);
      }
      if (filters.repayment?.length > 0) {
        countQuery = countQuery.in('repayment', filters.repayment);
      }

      // For filters that need applications join, we need to include the join in count
      const needsApplicationsJoin = (
        (filters.branch?.length > 0) || 
        (filters.dealer?.length > 0) || 
        (filters.lender?.length > 0) || 
        searchTerm.trim()
      );

      if (needsApplicationsJoin) {
        // Reset count query with join
        countQuery = supabase
          .from('collection')
          .select('application_id, applications!inner(*)', { count: 'exact', head: true })
          .gte('demand_date', start)
          .lte('demand_date', end);
        
        // Reapply collection filters
        if (filters.teamLead?.length > 0) {
          countQuery = countQuery.in('team_lead', filters.teamLead);
        }
        if (filters.rm?.length > 0) {
          countQuery = countQuery.in('rm_name', filters.rm);
        }
        if (filters.collectionRm?.length > 0) {
          const normalizedCollectionRms = filters.collectionRm.map(rm => 
            rm === 'N/A' || rm === 'NA' ? 'N/A' : rm
          );
          countQuery = countQuery.or(`collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`);
        }
        if (filters.repayment?.length > 0) {
          countQuery = countQuery.in('repayment', filters.repayment);
        }
        
        // Apply application filters to count
        if (filters.branch?.length > 0) {
          countQuery = countQuery.in('applications.branch_name', filters.branch);
        }
        if (filters.dealer?.length > 0) {
          countQuery = countQuery.in('applications.dealer_name', filters.dealer);
        }
        if (filters.lender?.length > 0) {
          countQuery = countQuery.in('applications.lender_name', filters.lender);
        }

        // Apply search to count query
        if (searchTerm.trim()) {
          console.log('Applying search to count query');
          const searchConditions = [
            `applications.applicant_name.ilike.%${searchTerm.trim()}%`,
            `applications.applicant_id.ilike.%${searchTerm.trim()}%`,
            `applications.applicant_mobile.ilike.%${searchTerm.trim()}%`,
            `applications.dealer_name.ilike.%${searchTerm.trim()}%`,
            `applications.lender_name.ilike.%${searchTerm.trim()}%`,
            `applications.branch_name.ilike.%${searchTerm.trim()}%`,
            `rm_name.ilike.%${searchTerm.trim()}%`,
            `team_lead.ilike.%${searchTerm.trim()}%`,
            `collection_rm.ilike.%${searchTerm.trim()}%`
          ];
          countQuery = countQuery.or(searchConditions.join(','));
        }
      }

      console.log('Executing count query...');
      const { count: totalCountResult, error: countError } = await countQuery;

      if (countError) {
        console.error('Count query error:', countError);
        throw countError;
      }

      console.log('Total filtered count:', totalCountResult);

      // Step 4: Get paginated and sorted results
      console.log('=== FETCHING PAGINATED DATA ===');
      console.log('Executing main data query...');
      
      const { data: allData, error: dataError } = await baseQuery;

      if (dataError) {
        console.error('Data query error:', dataError);
        throw dataError;
      }

      console.log(`Fetched ${allData?.length || 0} total filtered records`);

      if (searchTerm.trim()) {
        console.log('=== SEARCH RESULTS ===');
        console.log('Raw search results count:', allData?.length || 0);
        
        // Log some sample results for debugging
        if (allData && allData.length > 0) {
          console.log('Sample search results:');
          allData.slice(0, 3).forEach((record, index) => {
            const app = record.applications;
            console.log(`${index + 1}. ${app?.applicant_name} (ID: ${app?.applicant_id})`);
          });
        }
      }

      // Transform the joined data into Application format
      const transformedApplications: Application[] = (allData || []).map(record => {
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

      // Sort by applicant first name (case-insensitive) then by demand_date
      console.log('=== SORTING RESULTS ===');
      const sortedApplications = transformedApplications.sort((a, b) => {
        // Extract first name from full name
        const getFirstName = (fullName: string) => {
          const firstName = fullName.split(' ')[0];
          return firstName ? firstName.toLowerCase() : '';
        };
        
        const firstNameA = getFirstName(a.applicant_name);
        const firstNameB = getFirstName(b.applicant_name);
        
        console.log(`Comparing: "${firstNameA}" vs "${firstNameB}"`);
        
        const nameComparison = firstNameA.localeCompare(firstNameB);
        if (nameComparison !== 0) return nameComparison;
        
        // If first names are the same, sort by demand_date (newest first)
        return new Date(b.demand_date || '').getTime() - new Date(a.demand_date || '').getTime();
      });

      console.log('Sorted applications count:', sortedApplications.length);
      if (sortedApplications.length > 0) {
        console.log('First 3 sorted names:');
        sortedApplications.slice(0, 3).forEach((app, index) => {
          console.log(`${index + 1}. ${app.applicant_name}`);
        });
      }

      // Apply pagination after sorting
      const offset = (page - 1) * pageSize;
      const paginatedApplications = sortedApplications.slice(offset, offset + pageSize);

      console.log('=== PAGINATION ===');
      console.log(`Page: ${page}, PageSize: ${pageSize}, Offset: ${offset}`);
      console.log(`Paginated results: ${paginatedApplications.length}`);

      const result = {
        applications: paginatedApplications,
        totalCount: totalCountResult || 0,
        totalPages: Math.ceil((totalCountResult || 0) / pageSize),
        loading: false,
        refetch: async () => {}
      };

      // Cache the result for 2 minutes (shorter cache for search results)
      setCachedData(cacheKey, result, 2 * 60 * 1000);
      
      console.log('=== OPTIMIZED V3 FETCH COMPLETE ===');
      console.log(`Total: ${totalCountResult}, Page: ${page}, Results: ${paginatedApplications.length}`);
      
      return result;
    } catch (error) {
      console.error('Error in fetchApplicationsCore:', error);
      throw error;
    }
  }, [user, selectedEmiMonth, filters, searchTerm, page, pageSize, cacheKey, getCachedData, setCachedData]);

  // Use debounced API call
  const { data: apiResult, loading: apiLoading, call: debouncedFetch } = useDebouncedAPI(fetchApplicationsCore, 300);

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
