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

const MAX_RECORDS = 1000; // Safety limit to prevent URL length issues

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

  const fetchApplications = useCallback(async () => {
    if (!user || !selectedEmiMonth) {
      console.log('Missing user or selectedEmiMonth');
      setApplications([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);

    try {
      const { start, end } = getMonthDateRange(selectedEmiMonth);
      const emiDate = monthToEmiDate(selectedEmiMonth);
      console.log('Fetching applications for month:', selectedEmiMonth);

      // Simple, direct query with basic joins
      let query = supabase
        .from('collection')
        .select(`
          *,
          applications!inner(*)
        `)
        .gte('demand_date', start)
        .lte('demand_date', end)
        .limit(MAX_RECORDS);

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
        const bounceValues = filters.lastMonthBounce.map(category => {
          switch (category) {
            case 'Not paid': return 0;
            case 'Paid on time': return 1;
            case '1-5 days late': return 2;
            case '6-15 days late': return 3;
            case '15+ days late': return 4;
            default: return 0;
          }
        });
        query = query.in('last_month_bounce', bounceValues);
      }
      if (filters.vehicleStatus?.length > 0) {
        query = query.in('applications.vehicle_status', filters.vehicleStatus);
      }

      const { data, error: queryError } = await query;

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

      const appIds = transformedApplications.map(app => app.applicant_id);

      // Fetch latest field status for each application
      console.log('Fetching latest field status for applications...');
      const { data: statusRows, error: statusError } = await supabase
        .from('field_status')
        .select('application_id, status, demand_date, created_at')
        .in('application_id', appIds)
        .eq('demand_date', emiDate)
        .order('created_at', { ascending: false });

      if (!statusError && statusRows) {
        const latestStatusMap: Record<string, string> = {};
        statusRows.forEach(row => {
          if (!latestStatusMap[row.application_id]) {
            latestStatusMap[row.application_id] = row.status;
          }
        });

        // Update applications with field status
        transformedApplications = transformedApplications.map(app => ({
          ...app,
          field_status: latestStatusMap[app.applicant_id] || app.lms_status || 'Unpaid'
        }));
        
        console.log('Field status updated for applications');
      }

      // Always fetch PTP dates for all applications
      console.log('Fetching PTP dates for all applications...');
      const { data: ptpData, error: ptpError } = await supabase
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .in('application_id', appIds)
        .order('application_id', { ascending: true })
        .order('created_at', { ascending: false });

      if (!ptpError && ptpData) {
        const ptpMap: Record<string, string | null> = {};
        const processedApps = new Set<string>();
        
        ptpData.forEach(ptp => {
          if (!processedApps.has(ptp.application_id)) {
            ptpMap[ptp.application_id] = ptp.ptp_date;
            processedApps.add(ptp.application_id);
          }
        });

        // Update applications with PTP dates
        transformedApplications = transformedApplications.map(app => ({
          ...app,
          ptp_date: ptpMap[app.applicant_id] || undefined
        }));
        
        console.log('PTP dates updated for applications');
      }

      // Fetch latest calling status for each application
      console.log('Fetching calling status for applications...');
      const { data: callingData, error: callingError } = await supabase
        .from('contact_calling_status')
        .select('application_id, contact_type, status, created_at')
        .in('application_id', appIds)
        .order('created_at', { ascending: false });

      if (!callingError && callingData) {
        const contactStatusesMap: Record<string, any> = {};
        
        callingData.forEach(status => {
          if (!contactStatusesMap[status.application_id]) {
            contactStatusesMap[status.application_id] = {};
          }
          
          const contactType = status.contact_type.toLowerCase();
          if (!contactStatusesMap[status.application_id][contactType]) {
            contactStatusesMap[status.application_id][contactType] = status.status;
            
            // Set latest calling status to the most recent status overall
            if (!contactStatusesMap[status.application_id].latest) {
              contactStatusesMap[status.application_id].latest = status.status;
            }
          }
        });

        // Update applications with calling status
        transformedApplications = transformedApplications.map(app => {
          const contactStatuses = contactStatusesMap[app.applicant_id] || {};
          return {
            ...app,
            applicant_calling_status: contactStatuses.applicant || 'Not Called',
            co_applicant_calling_status: contactStatuses.co_applicant || 'Not Called',
            guarantor_calling_status: contactStatuses.guarantor || 'Not Called',
            reference_calling_status: contactStatuses.reference || 'Not Called',
            latest_calling_status: contactStatuses.latest || 'Not Called'
          };
        });
        
        console.log('Calling status updated for applications');
      }

      // Fetch recent comments (latest 2) for each application
      console.log('Fetching recent comments for applications...');
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          application_id,
          content,
          created_at,
          user_id,
          profiles!inner(full_name)
        `)
        .in('application_id', appIds)
        .order('created_at', { ascending: false });

      if (!commentsError && commentsData) {
        const commentsByApp: Record<string, any[]> = {};
        
        commentsData.forEach(comment => {
          if (!commentsByApp[comment.application_id]) {
            commentsByApp[comment.application_id] = [];
          }
          
          // Only keep latest 2 comments per application
          if (commentsByApp[comment.application_id].length < 2) {
            commentsByApp[comment.application_id].push({
              content: comment.content,
              user_name: comment.profiles?.full_name || 'Unknown User',
              created_at: comment.created_at
            });
          }
        });

        // Update applications with comments
        transformedApplications = transformedApplications.map(app => ({
          ...app,
          recent_comments: commentsByApp[app.applicant_id] || []
        }));
        
        console.log('Recent comments updated for applications');
      }

      // Apply PTP date filtering if specified
      if (filters.ptpDate?.length > 0) {
        console.log('🔍 Applying PTP date filter:', filters.ptpDate);
        
        const { startDate, endDate, includeNoDate } = resolvePTPDateFilter(filters.ptpDate);
        console.log('PTP filter resolved:', { startDate, endDate, includeNoDate });

        const originalCount = transformedApplications.length;
        transformedApplications = transformedApplications.filter(app => {
          const appPtpDate = app.ptp_date;
          
          if (includeNoDate && !appPtpDate) {
            return true;
          }
          
          if (appPtpDate) {
            if (startDate && endDate) {
              const ptpDateStr = new Date(appPtpDate).toISOString().split('T')[0];
              return ptpDateStr >= startDate && ptpDateStr <= endDate;
            }
            return true;
          }
          
          return false;
        });

        console.log('PTP filtering result:', originalCount, '->', transformedApplications.length, 'applications');
      }

      // Apply status filtering if specified
      if (filters.status?.length > 0) {
        console.log('🔍 Applying status filter:', filters.status);
        const originalCount = transformedApplications.length;
        
        transformedApplications = transformedApplications.filter(app => {
          const currentStatus = app.field_status || app.lms_status || 'Unpaid';
          return filters.status!.includes(currentStatus);
        });
        
        console.log('Status filtering result:', originalCount, '->', transformedApplications.length, 'applications');
      }

      // Apply client-side search filter
      if (searchTerm?.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        const originalCount = transformedApplications.length;
        
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
        
        console.log('Search filtering result:', originalCount, '->', transformedApplications.length, 'applications');
      }

      // Sort by applicant name
      transformedApplications.sort((a, b) => {
        const nameA = (a.applicant_name || '').toLowerCase();
        const nameB = (b.applicant_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // Set total count to filtered results (before pagination)
      const filteredCount = transformedApplications.length;
      setTotalCount(filteredCount);

      // Apply pagination LAST - return only the requested page
      const offset = (page - 1) * pageSize;
      const paginatedApplications = transformedApplications.slice(offset, offset + pageSize);

      setApplications(paginatedApplications);

      console.log('Applications loaded successfully:', {
        totalFiltered: filteredCount,
        page,
        pageSize,
        returned: paginatedApplications.length,
        totalPages: Math.ceil(filteredCount / pageSize)
      });

    } catch (err) {
      console.error('Error fetching applications:', err);
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
