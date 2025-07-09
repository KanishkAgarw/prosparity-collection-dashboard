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
      const emiDateForQuery = monthToEmiDate(selectedEmiMonth);
      console.log('Fetching applications for month:', selectedEmiMonth);

      // If status filter is applied, we need to handle it differently
      if (filters.status?.length > 0) {
        // Get all applications first with basic filters
        let allDataQuery = supabase
          .from('collection')
          .select(`
            *,
            applications!inner(*)
          `)
          .gte('demand_date', start)
          .lte('demand_date', end)
          .order('application_id', { ascending: true });

        // Apply basic server-side filters
        if (filters.teamLead?.length > 0) {
          allDataQuery = allDataQuery.in('team_lead', filters.teamLead);
        }
        if (filters.rm?.length > 0) {
          allDataQuery = allDataQuery.in('rm_name', filters.rm);
        }
        if (filters.repayment?.length > 0) {
          allDataQuery = allDataQuery.in('repayment', filters.repayment);
        }
        if (filters.collectionRm?.length > 0) {
          allDataQuery = allDataQuery.in('collection_rm', filters.collectionRm);
        }
        if (filters.lastMonthBounce?.length > 0) {
          const numericValues = filters.lastMonthBounce.map(val => typeof val === 'string' ? parseInt(val, 10) : val);
          allDataQuery = allDataQuery.in('last_month_bounce', numericValues);
        }
        if (filters.branch?.length > 0) {
          allDataQuery = allDataQuery.in('applications.branch_name', filters.branch);
        }
        if (filters.dealer?.length > 0) {
          allDataQuery = allDataQuery.in('applications.dealer_name', filters.dealer);
        }
        if (filters.lender?.length > 0) {
          allDataQuery = allDataQuery.in('applications.lender_name', filters.lender);
        }
        if (filters.vehicleStatus?.length > 0) {
          allDataQuery = allDataQuery.in('applications.vehicle_status', filters.vehicleStatus);
        }

        const { data: allData, error: allDataError } = await allDataQuery;

        if (allDataError) {
          throw new Error(`Query failed: ${allDataError.message}`);
        }

        if (!allData || allData.length === 0) {
          setApplications([]);
          setTotalCount(0);
          return;
        }

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

        // Get status for all applications
        const appIds = allTransformedApplications.map(app => app.applicant_id);
        const { data: statusRows, error: statusError } = await supabase
          .from('field_status')
          .select('application_id, status, demand_date, created_at')
          .in('application_id', appIds)
          .eq('demand_date', emiDateForQuery);

        if (!statusError && statusRows) {
          const latestStatusMap: Record<string, string> = {};
          statusRows.forEach(row => {
            if (!latestStatusMap[row.application_id] || new Date(row.created_at) > new Date(latestStatusMap[row.application_id + '_created_at'] || 0)) {
              latestStatusMap[row.application_id] = row.status;
              latestStatusMap[row.application_id + '_created_at'] = row.created_at;
            }
          });

          // Filter by status
          allTransformedApplications = allTransformedApplications.filter(app => {
            const status = latestStatusMap[app.applicant_id] || 'Unpaid';
            return filters.status!.includes(status);
          });

          // Set the field_status on the applications
          allTransformedApplications = allTransformedApplications.map(app => ({
            ...app,
            field_status: latestStatusMap[app.applicant_id] || 'Unpaid'
          }));
        }

        // Apply remaining filters (PTP dates, search)
        let filteredApplications = allTransformedApplications;

        // Apply PTP date filtering if specified
        if (filters.ptpDate?.length > 0) {
          console.log('🔍 Applying PTP date filter:', filters.ptpDate);
          
          const appIds = filteredApplications.map(app => app.applicant_id);
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
            const originalCount = filteredApplications.length;
            filteredApplications = filteredApplications.filter(app => {
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

            console.log('PTP filtering result:', originalCount, '->', filteredApplications.length, 'applications');

            // Add PTP dates to the applications
            filteredApplications = filteredApplications.map(app => ({
              ...app,
              ptp_date: ptpMap[app.applicant_id] || undefined
            }));
          }
        }

        // Apply client-side search filter
        if (searchTerm?.trim()) {
          const searchLower = searchTerm.toLowerCase().trim();
          filteredApplications = filteredApplications.filter(app => {
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
        filteredApplications.sort((a, b) => {
          const nameA = (a.applicant_name || '').toLowerCase();
          const nameB = (b.applicant_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });

        // Apply pagination after all filtering
        const totalFilteredCount = filteredApplications.length;
        const offset = (page - 1) * pageSize;
        const paginatedApplications = filteredApplications.slice(offset, offset + pageSize);

        setApplications(paginatedApplications);
        setTotalCount(totalFilteredCount);
        
        console.log('Applications loaded successfully with status filter:', {
          total: totalFilteredCount,
          page,
          results: paginatedApplications.length
        });

        return;
      }

      // Original logic for non-status filtered queries
      // First, get the total count
      const { count: totalRecords, error: countError } = await supabase
        .from('collection')
        .select('*', { count: 'exact', head: true })
        .gte('demand_date', start)
        .lte('demand_date', end);

      if (countError) {
        throw new Error(`Count query failed: ${countError.message}`);
      }

      // Now fetch the actual data with pagination and joins
      const offset = (page - 1) * pageSize;
      let dataQuery = supabase
        .from('collection')
        .select(`
          *,
          applications!inner(*)
        `)
        .gte('demand_date', start)
        .lte('demand_date', end)
        .range(offset, offset + pageSize - 1)
        .order('application_id', { ascending: true });

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

      setApplications(transformedApplications);
      setTotalCount(totalRecords || 0);

      console.log('Applications loaded successfully:', {
        total: totalRecords || 0,
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