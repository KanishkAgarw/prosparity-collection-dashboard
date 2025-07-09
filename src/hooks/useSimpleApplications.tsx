import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';
import { FilterState } from '@/types/filters';
import { getMonthDateRange, monthToEmiDate } from '@/utils/dateUtils';
import { resolvePTPDateFilter } from '@/utils/ptpDateUtils';

interface UseSimpleApplicationsProps {
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

// Removed MAX_RECORDS limit - using true server-side pagination

export const useSimpleApplications = ({
  filters,
  searchTerm,
  page,
  pageSize,
  selectedEmiMonth
}: UseSimpleApplicationsProps): ApplicationsResponse => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!user || !selectedEmiMonth) {
      console.log('Missing user or selectedEmiMonth');
      setApplications([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { start, end } = getMonthDateRange(selectedEmiMonth);
      console.log('Fetching applications for month:', selectedEmiMonth);

      // Build base query for filtering
      let baseQuery = supabase
        .from('collection')
        .select('*', { count: 'exact', head: false })
        .gte('demand_date', start)
        .lte('demand_date', end);

      // Apply basic server-side filters
      if (filters.teamLead?.length > 0) {
        baseQuery = baseQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        baseQuery = baseQuery.in('rm_name', filters.rm);
      }
      if (filters.repayment?.length > 0) {
        baseQuery = baseQuery.in('repayment', filters.repayment);
      }
      if (filters.collectionRm?.length > 0) {
        baseQuery = baseQuery.in('collection_rm', filters.collectionRm);
      }
      if (filters.lastMonthBounce?.length > 0) {
        const numericValues = filters.lastMonthBounce.map(val => typeof val === 'string' ? parseInt(val, 10) : val);
        baseQuery = baseQuery.in('last_month_bounce', numericValues);
      }

      // First, get the total count - use same structure as data query
      let countQuery = supabase
        .from('collection')
        .select(`
          *,
          applications!inner(*),
          field_status!left(status, created_at, demand_date)
        `, { count: 'exact', head: true })
        .gte('demand_date', start)
        .lte('demand_date', end);

      // Apply the same filters to count query
      if (filters.teamLead?.length > 0) {
        countQuery = countQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        countQuery = countQuery.in('rm_name', filters.rm);
      }
      if (filters.repayment?.length > 0) {
        countQuery = countQuery.in('repayment', filters.repayment);
      }
      if (filters.branch?.length > 0) {
        countQuery = countQuery.in('applications.branch_name', filters.branch);
      }
      if (filters.collectionRm?.length > 0) {
        countQuery = countQuery.in('collection_rm', filters.collectionRm);
      }
      if (filters.dealer?.length > 0) {
        countQuery = countQuery.in('applications.dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        countQuery = countQuery.in('applications.lender_name', filters.lender);
      }
      if (filters.lastMonthBounce?.length > 0) {
        const numericValues = filters.lastMonthBounce.map(val => typeof val === 'string' ? parseInt(val, 10) : val);
        countQuery = countQuery.in('last_month_bounce', numericValues);
      }
      if (filters.vehicleStatus?.length > 0) {
        countQuery = countQuery.in('applications.vehicle_status', filters.vehicleStatus);
      }

      // Apply status filtering at database level for count
      if (filters.status?.length > 0) {
        const emiDate = monthToEmiDate(selectedEmiMonth);
        countQuery = countQuery.or(`field_status.status.in.(${filters.status.join(',')}),field_status.is.null`);
        countQuery = countQuery.eq('field_status.demand_date', emiDate);
      }

      const { count: totalRecords, error: countError } = await countQuery;

      if (countError) {
        throw new Error(`Count query failed: ${countError.message}`);
      }

      // Now fetch the actual data with pagination and joins
      const offset = (page - 1) * pageSize;
      let dataQuery = supabase
        .from('collection')
        .select(`
          *,
          applications!inner(*),
          field_status!left(status, created_at, demand_date)
        `)
        .gte('demand_date', start)
        .lte('demand_date', end)
        .range(offset, offset + pageSize - 1)
        .order('applications.applicant_name', { ascending: true });

      // Apply the same filters to data query
      if (filters.teamLead?.length > 0) {
        dataQuery = dataQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        dataQuery = dataQuery.in('rm_name', filters.rm);
      }
      if (filters.repayment?.length > 0) {
        dataQuery = dataQuery.in('repayment', filters.repayment);
      }
      if (filters.branch?.length > 0) {
        dataQuery = dataQuery.in('applications.branch_name', filters.branch);
      }
      if (filters.collectionRm?.length > 0) {
        dataQuery = dataQuery.in('collection_rm', filters.collectionRm);
      }
      if (filters.dealer?.length > 0) {
        dataQuery = dataQuery.in('applications.dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        dataQuery = dataQuery.in('applications.lender_name', filters.lender);
      }
      if (filters.lastMonthBounce?.length > 0) {
        const numericValues = filters.lastMonthBounce.map(val => typeof val === 'string' ? parseInt(val, 10) : val);
        dataQuery = dataQuery.in('last_month_bounce', numericValues);
      }
      if (filters.vehicleStatus?.length > 0) {
        dataQuery = dataQuery.in('applications.vehicle_status', filters.vehicleStatus);
      }

      // Apply status filtering at database level for data - same as count query
      if (filters.status?.length > 0) {
        const emiDate = monthToEmiDate(selectedEmiMonth);
        dataQuery = dataQuery.or(`field_status.status.in.(${filters.status.join(',')}),field_status.is.null`);
        dataQuery = dataQuery.eq('field_status.demand_date', emiDate);
      }

      const { data, error: queryError } = await dataQuery;

      if (queryError) {
        throw new Error(`Query failed: ${queryError.message}`);
      }

      if (!data) {
        setApplications([]);
        setTotalCount(0);
        return;
      }

      // Transform data
      let transformedApplications: Application[] = data.map(record => {
        const app = record.applications;
        return {
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
          field_status: 'Unpaid',
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

      // Apply PTP date filtering if specified
      if (filters.ptpDate?.length > 0) {
        console.log('🔍 Applying PTP date filter:', filters.ptpDate);
        
        const appIds = transformedApplications.map(app => app.applicant_id);
        const { startDate, endDate, includeNoDate } = resolvePTPDateFilter(filters.ptpDate);
        
        console.log('PTP filter resolved:', { startDate, endDate, includeNoDate });
        
        // Fetch PTP dates for the applications
        let ptpQuery = supabase
          .from('ptp_dates')
          .select('application_id, ptp_date, created_at')
          .in('application_id', appIds)
          .order('application_id', { ascending: true })
          .order('created_at', { ascending: false });

        // Apply date range filter if specified
        if (startDate && endDate) {
          ptpQuery = ptpQuery.gte('ptp_date', startDate).lte('ptp_date', endDate);
        }

        const { data: ptpData, error: ptpError } = await ptpQuery;

        if (ptpError) {
          console.error('Error fetching PTP dates:', ptpError);
        } else {
          // Build a map of latest PTP date for each application
          const ptpMap: Record<string, string | null> = {};
          const processedApps = new Set<string>();
          
          ptpData?.forEach(ptp => {
            if (!processedApps.has(ptp.application_id)) {
              ptpMap[ptp.application_id] = ptp.ptp_date;
              processedApps.add(ptp.application_id);
            }
          });

          console.log('PTP data fetched:', Object.keys(ptpMap).length, 'applications with PTP dates');

          // Filter applications based on PTP criteria
          const originalCount = transformedApplications.length;
          transformedApplications = transformedApplications.filter(app => {
            const appPtpDate = ptpMap[app.applicant_id];
            
            if (includeNoDate && !appPtpDate) {
              return true; // Include applications with no PTP date
            }
            
            if (appPtpDate) {
              // Check if the PTP date falls within the specified range
              if (startDate && endDate) {
                const ptpDateStr = new Date(appPtpDate).toISOString().split('T')[0];
                return ptpDateStr >= startDate && ptpDateStr <= endDate;
              }
              return true; // If no date range specified, include all with PTP dates
            }
            
            return false; // Exclude applications without PTP dates (unless includeNoDate is true)
          });

          console.log('PTP filtering result:', originalCount, '->', transformedApplications.length, 'applications');

          // Add PTP dates to the applications
          transformedApplications = transformedApplications.map(app => ({
            ...app,
            ptp_date: ptpMap[app.applicant_id] || undefined
          }));
        }
      }

      // Apply client-side search filter
      if (searchTerm?.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
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
      }

      // Sort by applicant name
      transformedApplications.sort((a, b) => {
        const nameA = (a.applicant_name || '').toLowerCase();
        const nameB = (b.applicant_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // Server-side pagination is already applied - no need for client-side pagination
      // Set total count from the database query result
      let finalTotalCount = totalRecords || 0;

      // Status filtering is now done at database level, no need for client-side filtering

      setApplications(transformedApplications);
      setTotalCount(finalTotalCount);

      console.log('Applications loaded successfully:', {
        total: finalTotalCount,
        page,
        results: transformedApplications.length
      });

    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setApplications([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [user, selectedEmiMonth, filters, searchTerm, page, pageSize]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const totalPages = Math.ceil(totalCount / pageSize);

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
