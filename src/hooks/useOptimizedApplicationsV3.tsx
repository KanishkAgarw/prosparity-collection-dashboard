
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';
import { FilterState } from '@/types/filters';
import { getMonthDateRange } from '@/utils/dateUtils';
import { useQueryCache } from './useQueryCache';
import { useDebouncedAPI } from './useDebouncedAPI';
import { categorizeLastMonthBounce, formatRepayment } from '@/utils/filterUtils';
import { categorizePtpDate } from '@/utils/ptpDateUtils';

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

    console.log('=== OPTIMIZED V3 FETCH WITH COMPREHENSIVE FILTERING ===');
    console.log('Selected EMI Month:', selectedEmiMonth);
    console.log('Search term:', searchTerm);
    console.log('Active filters:', filters);

    // Check cache first (but skip cache for search operations to ensure fresh results)
    if (!searchTerm.trim() && Object.values(filters).every(f => f.length === 0)) {
      const cachedResult = getCachedData(cacheKey);
      if (cachedResult) {
        console.log('✅ Using cached data, skipping API call');
        return cachedResult;
      }
    }

    const { start, end } = getMonthDateRange(selectedEmiMonth);
    console.log('📅 Date range for month', selectedEmiMonth, ':', start, 'to', end);

    try {
      console.log('=== STEP 1: BUILDING COMPREHENSIVE QUERY ===');
      
      // Build the base query from collection table with all necessary data
      let dataQuery = supabase
        .from('collection')
        .select(`
          *,
          applications!inner(*)
        `)
        .gte('demand_date', start)
        .lte('demand_date', end);

      console.log('=== STEP 2: APPLYING DATABASE-LEVEL FILTERS ===');

      // Apply collection table filters
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
      if (filters.vehicleStatus?.length > 0) {
        console.log('🔍 Applying vehicle status filter:', filters.vehicleStatus);
        if (filters.vehicleStatus.includes('None')) {
          const nonNoneStatuses = filters.vehicleStatus.filter(s => s !== 'None');
          if (nonNoneStatuses.length > 0) {
            dataQuery = dataQuery.or(`applications.vehicle_status.is.null,applications.vehicle_status.in.(${nonNoneStatuses.join(',')})`);
          } else {
            dataQuery = dataQuery.is('applications.vehicle_status', null);
          }
        } else {
          dataQuery = dataQuery.in('applications.vehicle_status', filters.vehicleStatus);
        }
      }

      console.log('📤 Executing comprehensive query for month:', selectedEmiMonth);
      const { data: allData, error: dataError } = await dataQuery;

      if (dataError) {
        console.error('❌ Data query error:', dataError);
        throw dataError;
      }

      console.log(`✅ Fetched ${allData?.length || 0} total records from database`);

      // Now fetch related data for each application
      const applicationIds = allData?.map(record => record.application_id) || [];
      
      // Fetch field status data
      const { data: fieldStatusData } = await supabase
        .from('field_status')
        .select('*')
        .in('application_id', applicationIds)
        .gte('created_at', start)
        .lte('created_at', end + ' 23:59:59');

      // Fetch PTP dates data
      const { data: ptpDatesData } = await supabase
        .from('ptp_dates')
        .select('*')
        .in('application_id', applicationIds)
        .gte('created_at', start)
        .lte('created_at', end + ' 23:59:59');

      // Fetch calling status data
      const { data: callingStatusData } = await supabase
        .from('contact_calling_status')
        .select('*')
        .in('application_id', applicationIds)
        .gte('created_at', start)
        .lte('created_at', end + ' 23:59:59');

      console.log('📊 Related data fetched:', {
        fieldStatus: fieldStatusData?.length || 0,
        ptpDates: ptpDatesData?.length || 0,
        callingStatus: callingStatusData?.length || 0
      });

      // Transform and post-process data
      let transformedApplications: Application[] = (allData || []).map(record => {
        const app = record.applications;
        
        // Get the latest field status for this application
        const latestFieldStatus = fieldStatusData?.filter(fs => fs.application_id === record.application_id)
          ?.reduce((latest: any, current: any) => {
            if (!latest || new Date(current.created_at) > new Date(latest.created_at)) {
              return current;
            }
            return latest;
          }, null);

        // Get the latest PTP date for this application
        const latestPtpDate = ptpDatesData?.filter(ptp => ptp.application_id === record.application_id)
          ?.reduce((latest: any, current: any) => {
            if (!latest || new Date(current.created_at) > new Date(latest.created_at)) {
              return current;
            }
            return latest;
          }, null);

        // Get the latest calling status for this application
        const latestCallingStatus = callingStatusData?.filter(cs => cs.application_id === record.application_id)
          ?.reduce((latest: any, current: any) => {
            if (!latest || new Date(current.created_at) > new Date(latest.created_at)) {
              return current;
            }
            return latest;
          }, null);

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
          field_status: latestFieldStatus?.status || 'Unpaid',
          ptp_date: latestPtpDate?.ptp_date || null,
          latest_calling_status: latestCallingStatus?.status || 'Not Called',

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

      // Apply remaining filters that need client-side processing
      console.log('=== STEP 3: APPLYING CLIENT-SIDE FILTERS ===');
      
      if (filters.status?.length > 0) {
        console.log('🔍 Applying status filter:', filters.status);
        transformedApplications = transformedApplications.filter(app => 
          filters.status.includes(app.field_status || 'Unpaid')
        );
      }

      if (filters.callingStatus?.length > 0) {
        console.log('🔍 Applying calling status filter:', filters.callingStatus);
        transformedApplications = transformedApplications.filter(app => 
          filters.callingStatus.includes(app.latest_calling_status || 'Not Called')
        );
      }

      if (filters.lastMonthBounce?.length > 0) {
        console.log('🔍 Applying last month bounce filter:', filters.lastMonthBounce);
        transformedApplications = transformedApplications.filter(app => {
          const category = categorizeLastMonthBounce(app.last_month_bounce);
          return filters.lastMonthBounce.includes(category);
        });
      }

      if (filters.ptpDate?.length > 0) {
        console.log('🔍 Applying PTP date filter:', filters.ptpDate);
        transformedApplications = transformedApplications.filter(app => {
          const category = categorizePtpDate(app.ptp_date);
          return filters.ptpDate.some(filterValue => {
            // Direct category match
            if (filterValue === category) return true;
            
            // Convert display label to category
            const labelToCategoryMap: { [key: string]: string } = {
              "Overdue PTP": 'overdue',
              "Today's PTP": 'today',
              "Tomorrow's PTP": 'tomorrow',
              "Future PTP": 'future',
              "No PTP": 'no_date'
            };
            
            return labelToCategoryMap[filterValue] === category;
          });
        });
      }

      // Apply search filtering if provided
      if (searchTerm.trim()) {
        console.log('=== STEP 4: APPLYING SEARCH FILTER ===');
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

          return searchableFields.some(field => field.includes(searchLower));
        });

        console.log(`🔍 Search results: ${transformedApplications.length} from ${beforeSearchCount} total`);
      }

      // Sort by applicant first name (case-insensitive) then by demand_date
      console.log('=== STEP 5: SORTING RESULTS ===');
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

      // Apply pagination after sorting
      const offset = (page - 1) * pageSize;
      const paginatedApplications = sortedApplications.slice(offset, offset + pageSize);

      console.log('=== STEP 6: PAGINATION ===');
      console.log(`📄 Page: ${page}, Size: ${pageSize}, Offset: ${offset}`);
      console.log(`📋 Paginated results: ${paginatedApplications.length}`);

      const finalTotalCount = sortedApplications.length;

      const result = {
        applications: paginatedApplications,
        totalCount: finalTotalCount,
        totalPages: Math.ceil(finalTotalCount / pageSize),
        loading: false,
        refetch: async () => {}
      };

      // Only cache non-search results to avoid stale search data
      if (!searchTerm.trim() && Object.values(filters).every(f => f.length === 0)) {
        setCachedData(cacheKey, result, 2 * 60 * 1000);
        console.log('💾 Result cached');
      } else {
        console.log('🚫 Filtered/search result not cached (to ensure fresh data)');
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
    console.log('🔄 Dependencies changed, triggering comprehensive fetch...');
    console.log('Dependencies:', {
      selectedEmiMonth,
      searchTerm: `"${searchTerm}"`,
      page,
      hasUser: !!user,
      activeFilters: Object.entries(filters).filter(([, values]) => values.length > 0).map(([key, values]) => `${key}: ${values.length}`)
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
