
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
      console.log('❌ Missing user or selectedEmiMonth:', { user: !!user, selectedEmiMonth });
      return { applications: [], totalCount: 0, totalPages: 0, loading: false, refetch: async () => {} };
    }

    console.log('=== OPTIMIZED V3 FETCH START ===');
    console.log('Selected EMI Month:', selectedEmiMonth);
    console.log('Search term:', searchTerm);
    console.log('Cache key:', cacheKey);

    // Check cache first (but skip cache for search operations to ensure fresh results)
    if (!searchTerm.trim()) {
      const cachedResult = getCachedData(cacheKey);
      if (cachedResult) {
        console.log('✅ Using cached data, skipping API call');
        return cachedResult;
      }
    }

    const { start, end } = getMonthDateRange(selectedEmiMonth);
    console.log('📅 Date range for month', selectedEmiMonth, ':', start, 'to', end);

    try {
      console.log('=== STEP 1: FETCHING MAIN DATA ===');
      
      let dataQuery = supabase
        .from('collection')
        .select(`
          *,
          applications!inner(*)
        `)
        .gte('demand_date', start)
        .lte('demand_date', end);

      // Apply collection table filters to data query
      if (filters.teamLead?.length > 0) {
        console.log('🔍 Applying team lead filter:', filters.teamLead);
        dataQuery = dataQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        console.log('🔍 Applying RM filter:', filters.rm);
        dataQuery = dataQuery.in('rm_name', filters.rm);
      }
      if (filters.collectionRm?.length > 0) {
        console.log('🔍 Applying collection RM filter:', filters.collectionRm);
        const normalizedCollectionRms = filters.collectionRm.map(rm => 
          rm === 'N/A' || rm === 'NA' ? null : rm
        );
        if (normalizedCollectionRms.includes(null)) {
          const nonNullRms = normalizedCollectionRms.filter(rm => rm !== null);
          if (nonNullRms.length > 0) {
            dataQuery = dataQuery.or(`collection_rm.in.(${nonNullRms.join(',')}),collection_rm.is.null`);
          } else {
            dataQuery = dataQuery.is('collection_rm', null);
          }
        } else {
          dataQuery = dataQuery.in('collection_rm', normalizedCollectionRms);
        }
      }
      if (filters.repayment?.length > 0) {
        console.log('🔍 Applying repayment filter:', filters.repayment);
        dataQuery = dataQuery.in('repayment', filters.repayment);
      }

      // Apply applications table filters
      if (filters.branch?.length > 0) {
        console.log('🔍 Applying branch filter:', filters.branch);
        dataQuery = dataQuery.in('applications.branch_name', filters.branch);
      }
      if (filters.dealer?.length > 0) {
        console.log('🔍 Applying dealer filter:', filters.dealer);
        dataQuery = dataQuery.in('applications.dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        console.log('🔍 Applying lender filter:', filters.lender);
        dataQuery = dataQuery.in('applications.lender_name', filters.lender);
      }

      console.log('📤 Executing main data query for month:', selectedEmiMonth);
      const { data: allData, error: dataError } = await dataQuery;

      if (dataError) {
        console.error('❌ Data query error:', dataError);
        throw dataError;
      }

      console.log(`✅ Fetched ${allData?.length || 0} total records from database`);

      // Transform data first
      let transformedApplications: Application[] = (allData || []).map(record => {
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

      console.log(`🔄 Transformed ${transformedApplications.length} applications`);

      // Apply search filtering if provided
      if (searchTerm.trim()) {
        console.log('=== STEP 2: APPLYING SEARCH FILTER ===');
        const searchLower = searchTerm.trim().toLowerCase();
        console.log('🔍 Searching for:', `"${searchLower}"`);
        
        const beforeSearchCount = transformedApplications.length;
        
        transformedApplications = transformedApplications.filter(app => {
          const searchableFields = [
            app.applicant_name?.toLowerCase() || '',
            app.applicant_id?.toLowerCase() || '',
            app.applicant_mobile?.toLowerCase() || '',
            app.dealer_name?.toLowerCase() || '',
            app.lender_name?.toLowerCase() || '',
            app.branch_name?.toLowerCase() || '',
            app.rm_name?.toLowerCase() || '',
            app.team_lead?.toLowerCase() || '',
            app.collection_rm?.toLowerCase() || ''
          ];

          const matches = searchableFields.some(field => field.includes(searchLower));
          
          if (matches) {
            console.log(`✅ MATCH: ${app.applicant_name} (ID: ${app.applicant_id})`);
          }
          
          return matches;
        });

        console.log(`🔍 Search results: ${transformedApplications.length} from ${beforeSearchCount} total`);
        
        if (transformedApplications.length === 0) {
          console.log('❌ NO SEARCH RESULTS FOUND');
          console.log('Sample names available:', transformedApplications.slice(0, 5).map(app => app.applicant_name));
        }
      }

      // Sort by applicant first name (case-insensitive) then by demand_date
      console.log('=== STEP 3: SORTING RESULTS ===');
      const sortedApplications = transformedApplications.sort((a, b) => {
        const getFirstName = (fullName: string = '') => {
          const firstName = fullName.split(' ')[0];
          return firstName ? firstName.toLowerCase() : '';
        };
        
        const firstNameA = getFirstName(a.applicant_name);
        const firstNameB = getFirstName(b.applicant_name);
        
        const nameComparison = firstNameA.localeCompare(firstNameB);
        if (nameComparison !== 0) return nameComparison;
        
        return new Date(b.demand_date || '').getTime() - new Date(a.demand_date || '').getTime();
      });

      console.log(`📋 Final sorted applications: ${sortedApplications.length}`);
      if (sortedApplications.length > 0) {
        console.log('👥 First 3 names after sorting:', sortedApplications.slice(0, 3).map(app => app.applicant_name));
      }

      // Apply pagination after sorting
      const offset = (page - 1) * pageSize;
      const paginatedApplications = sortedApplications.slice(offset, offset + pageSize);

      console.log('=== STEP 4: PAGINATION ===');
      console.log(`📄 Page: ${page}, Size: ${pageSize}, Offset: ${offset}`);
      console.log(`📋 Paginated results: ${paginatedApplications.length}`);

      // Use the actual filtered count as total count (this is important for search)
      const finalTotalCount = sortedApplications.length;

      const result = {
        applications: paginatedApplications,
        totalCount: finalTotalCount,
        totalPages: Math.ceil(finalTotalCount / pageSize),
        loading: false,
        refetch: async () => {}
      };

      // Only cache non-search results to avoid stale search data
      if (!searchTerm.trim()) {
        setCachedData(cacheKey, result, 2 * 60 * 1000);
        console.log('💾 Result cached');
      } else {
        console.log('🚫 Search result not cached (to ensure fresh data)');
      }
      
      console.log('=== OPTIMIZED V3 FETCH COMPLETE ===');
      console.log(`📊 Final: Total: ${finalTotalCount}, Page: ${page}, Results: ${paginatedApplications.length}`);
      
      return result;
    } catch (error) {
      console.error('❌ Error in fetchApplicationsCore:', error);
      throw error;
    }
  }, [user, selectedEmiMonth, filters, searchTerm, page, pageSize, cacheKey, getCachedData, setCachedData]);

  // Use debounced API call
  const { data: apiResult, loading: apiLoading, call: debouncedFetch } = useDebouncedAPI(fetchApplicationsCore, 300);

  // Update local state when API result changes
  useEffect(() => {
    if (apiResult) {
      console.log('📊 Updating local state with API result:', {
        applications: apiResult.applications.length,
        totalCount: apiResult.totalCount
      });
      setApplications(apiResult.applications);
      setTotalCount(apiResult.totalCount);
    }
  }, [apiResult]);

  // Trigger debounced fetch when dependencies change
  useEffect(() => {
    console.log('🔄 Dependencies changed, triggering fetch...');
    console.log('Dependencies:', {
      selectedEmiMonth,
      searchTerm: `"${searchTerm}"`,
      page,
      hasUser: !!user
    });
    
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
    console.log('🔄 Refetch called - invalidating cache');
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
