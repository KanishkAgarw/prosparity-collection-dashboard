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

// Removed MAX_RECORDS limit to support all applications

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
      console.log('🔍 DEBUG: Fetching applications for month:', selectedEmiMonth);
      console.log('🔍 DEBUG: Date range:', { start, end });
      console.log('🔍 DEBUG: Applied filters:', filters);

      // Create the main data query - we'll get ALL data first to properly handle status filtering
      let query = supabase
        .from('collection')
        .select(`
          *,
          applications!inner(*)
        `)
        .gte('demand_date', start)
        .lte('demand_date', end);

      // Apply basic server-side filters
      if (filters.teamLead?.length > 0) {
        query = query.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        query = query.in('rm_name', filters.rm);
      }
      if (filters.repayment?.length > 0) {
        query = query.in('repayment', filters.repayment);
      }
      if (filters.branch?.length > 0) {
        query = query.in('applications.branch_name', filters.branch);
      }
      if (filters.collectionRm?.length > 0) {
        query = query.in('collection_rm', filters.collectionRm);
      }
      if (filters.dealer?.length > 0) {
        query = query.in('applications.dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        query = query.in('applications.lender_name', filters.lender);
      }
      if (filters.lastMonthBounce?.length > 0) {
        const numericValues = filters.lastMonthBounce.map(val => typeof val === 'string' ? parseInt(val, 10) : val);
        query = query.in('last_month_bounce', numericValues);
      }
      if (filters.vehicleStatus?.length > 0) {
        query = query.in('applications.vehicle_status', filters.vehicleStatus);
      }

      // Get all data first
      const { data: allData, error: queryError } = await query;
      
      if (queryError) {
        throw new Error(`Query failed: ${queryError.message}`);
      }

      if (!allData || allData.length === 0) {
        console.log('🔍 DEBUG: No data found from basic query');
        setApplications([]);
        setTotalCount(0);
        return;
      }

      console.log('🔍 DEBUG: Raw data from collection table:', allData.length, 'records');

      // Transform all data first
      let allTransformedApplications: Application[] = allData.map(record => {
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
          field_status: 'Unpaid', // Default status
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

      // Get status information for all applications
      const allAppIds = allTransformedApplications.map(app => app.applicant_id);
      const emiDate = monthToEmiDate(selectedEmiMonth);
      
      console.log('🔍 DEBUG: Calculated emiDate:', emiDate);
      console.log('🔍 DEBUG: Looking up field_status for', allAppIds.length, 'applications');

      const { data: statusRows, error: statusError } = await supabase
        .from('field_status')
        .select('application_id, status, created_at, demand_date')
        .in('application_id', allAppIds)
        .eq('demand_date', emiDate);

      if (statusError) {
        console.error('🔍 DEBUG: Error fetching field_status:', statusError);
        // Don't return here - continue with default statuses
      }

      console.log('🔍 DEBUG: Found', statusRows?.length || 0, 'field_status records');
      if (statusRows && statusRows.length > 0) {
        console.log('🔍 DEBUG: Sample field_status records:', statusRows.slice(0, 3));
      }

      // Build latest status map
      const latestStatusMap: Record<string, string> = {};
      statusRows?.forEach(row => {
        if (!latestStatusMap[row.application_id] || 
            new Date(row.created_at) > new Date(latestStatusMap[row.application_id + '_created_at'] || 0)) {
          latestStatusMap[row.application_id] = row.status;
          latestStatusMap[row.application_id + '_created_at'] = row.created_at;
        }
      });

      console.log('🔍 DEBUG: Built status map for', Object.keys(latestStatusMap).length, 'applications');

      // Apply status information to applications
      let applicationsWithStatus = allTransformedApplications.map(app => ({
        ...app,
        field_status: latestStatusMap[app.applicant_id] || 'Unpaid'
      }));

      console.log('🔍 DEBUG: Status distribution:', {
        total: applicationsWithStatus.length,
        unpaid: applicationsWithStatus.filter(app => app.field_status === 'Unpaid').length,
        partiallyPaid: applicationsWithStatus.filter(app => app.field_status === 'Partially Paid').length,
        paid: applicationsWithStatus.filter(app => app.field_status === 'Paid').length,
        other: applicationsWithStatus.filter(app => !['Unpaid', 'Partially Paid', 'Paid'].includes(app.field_status)).length
      });

      // Apply status filtering if specified
      if (filters.status?.length > 0) {
        console.log('🔍 DEBUG: Applying status filter:', filters.status);
        applicationsWithStatus = applicationsWithStatus.filter(app => {
          const matches = filters.status!.includes(app.field_status);
          return matches;
        });
        console.log('🔍 DEBUG: After status filtering:', applicationsWithStatus.length, 'applications remain');
      }

      // Apply search filter
      if (searchTerm?.trim()) {
        console.log('🔍 DEBUG: Applying search filter:', searchTerm);
        const searchLower = searchTerm.toLowerCase().trim();
        applicationsWithStatus = applicationsWithStatus.filter(app => {
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
        console.log('🔍 DEBUG: After search filtering:', applicationsWithStatus.length, 'applications remain');
      }

      // Sort applications
      applicationsWithStatus.sort((a, b) => {
        const nameA = (a.applicant_name || '').toLowerCase();
        const nameB = (b.applicant_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // Apply pagination
      const totalFilteredCount = applicationsWithStatus.length;
      const offset = (page - 1) * pageSize;
      let finalApplications = applicationsWithStatus.slice(offset, offset + pageSize);

      console.log('🔍 DEBUG: Final pagination:', {
        totalFiltered: totalFilteredCount,
        page,
        pageSize,
        offset,
        finalCount: finalApplications.length
      });

      setTotalCount(totalFilteredCount);

      // Apply PTP date filtering if specified (only to final applications)
      if (filters.ptpDate?.length > 0) {
        console.log('🔍 DEBUG: Applying PTP date filter:', filters.ptpDate);
        
        const appIds = finalApplications.map(app => app.applicant_id);
        const { startDate, endDate, includeNoDate } = resolvePTPDateFilter(filters.ptpDate);
        
        console.log('🔍 DEBUG: PTP filter resolved:', { startDate, endDate, includeNoDate });
        
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
          console.error('🔍 DEBUG: Error fetching PTP dates:', ptpError);
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

          // Add PTP dates to the applications
          finalApplications = finalApplications.map(app => ({
            ...app,
            ptp_date: ptpMap[app.applicant_id] || undefined
          }));
        }
      }

      setApplications(finalApplications);

      console.log('🔍 DEBUG: Final results:', {
        totalFiltered: totalFilteredCount,
        currentPage: page,
        pageSize,
        displayedResults: finalApplications.length,
        sampleApps: finalApplications.slice(0, 3).map(app => ({
          id: app.applicant_id,
          name: app.applicant_name,
          status: app.field_status
        }))
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
