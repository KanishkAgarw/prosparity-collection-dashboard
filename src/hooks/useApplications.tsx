
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';
import { DatabaseApplication } from '@/types/database';
import { useFieldStatus } from '@/hooks/useFieldStatus';
import { usePtpDates } from '@/hooks/usePtpDates';
import { usePaymentDates } from '@/hooks/usePaymentDates';
import { useContactCallingStatus } from '@/hooks/useContactCallingStatus';
import { useComments } from '@/hooks/useComments';

interface UseApplicationsProps {
  page?: number;
  pageSize?: number;
}

export const useApplications = ({ page = 1, pageSize = 50 }: UseApplicationsProps = {}) => {
  const { user } = useAuth();
  const { fetchFieldStatus } = useFieldStatus();
  const { fetchPtpDates } = usePtpDates();
  const { fetchPaymentDates } = usePaymentDates();
  const { fetchContactStatuses } = useContactCallingStatus();
  const { fetchCommentsByApplications } = useComments();
  const [applications, setApplications] = useState<Application[]>([]);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log(`Fetching applications page ${page} (${pageSize} per page)`);
      
      // Get total count
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });

      setTotalCount(count || 0);

      // Fetch ALL applications for filters (sorted by applicant name)
      const { data: allAppsData, error: allAppsError } = await supabase
        .from('applications')
        .select('*')
        .order('applicant_name', { ascending: true });

      if (allAppsError) {
        console.error('Error fetching all applications:', allAppsError);
        return;
      }

      // Get paginated applications (sorted by applicant name)
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .order('applicant_name', { ascending: true })
        .range(from, to);

      if (appsError) {
        console.error('Error fetching applications:', appsError);
        return;
      }

      // Fetch related data for ALL applications
      const allAppIds = allAppsData?.map(app => app.applicant_id) || [];
      
      const [fieldStatusMap, ptpDatesMap, paymentDatesMap, contactStatusesMap, commentsByApp] = await Promise.all([
        fetchFieldStatus(allAppIds),
        fetchPtpDates(allAppIds),
        fetchPaymentDates(allAppIds),
        fetchContactStatuses(allAppIds),
        fetchCommentsByApplications(allAppIds)
      ]);

      // Enhance applications with related data
      const enhanceApplications = (apps: DatabaseApplication[]): Application[] => {
        return apps.map(app => {
          const contactStatuses = contactStatusesMap[app.applicant_id] || {};
          
          return {
            ...app,
            field_status: fieldStatusMap[app.applicant_id] || 'Unpaid',
            ptp_date: ptpDatesMap[app.applicant_id],
            paid_date: paymentDatesMap[app.applicant_id],
            applicant_calling_status: contactStatuses.applicant || 'Not Called',
            co_applicant_calling_status: contactStatuses.co_applicant || 'Not Called',
            guarantor_calling_status: contactStatuses.guarantor || 'Not Called',
            reference_calling_status: contactStatuses.reference || 'Not Called',
            latest_calling_status: contactStatuses.latest || 'No Calls',
            recent_comments: commentsByApp[app.applicant_id] || []
          } as Application;
        });
      };

      const applicationsWithData = enhanceApplications(appsData as DatabaseApplication[]);
      const allApplicationsWithData = enhanceApplications(allAppsData as DatabaseApplication[]);

      console.log('Enhanced applications with all related data');
      
      setApplications(applicationsWithData);
      setAllApplications(allApplicationsWithData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, fetchFieldStatus, fetchPtpDates, fetchPaymentDates, fetchContactStatuses, fetchCommentsByApplications]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  return {
    applications,
    allApplications,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
    loading,
    refetch: fetchApplications
  };
};
