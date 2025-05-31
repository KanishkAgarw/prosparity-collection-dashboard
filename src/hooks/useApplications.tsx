import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';
import { DatabaseApplication } from '@/types/database';
import { fetchAndMapComments } from '@/utils/commentMapping';

interface UseApplicationsProps {
  page?: number;
  pageSize?: number;
}

export const useApplications = ({ page = 1, pageSize = 50 }: UseApplicationsProps = {}) => {
  const { user } = useAuth();
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

      console.log('=== DEBUGGING PTP DATES (FIXED) ===');
      appsData?.slice(0, 3).forEach(app => {
        console.log(`App: ${app.applicant_name} (${app.applicant_id})`);
        console.log(`PTP Date: ${app.ptp_date} (type: ${typeof app.ptp_date})`);
      });

      // Fetch recent comments for ALL applications
      const allAppIds = allAppsData?.map(app => app.applicant_id) || [];
      
      let applicationsWithComments: Application[] = appsData || [];
      let allApplicationsWithComments: Application[] = allAppsData || [];
      
      if (allAppIds.length > 0) {
        console.log('=== FETCHING COMMENTS (FIXED) ===');
        const commentsByApp = await fetchAndMapComments(allAppIds);

        // Add comments to both paginated and all applications, ensuring PTP date is preserved
        applicationsWithComments = (appsData as DatabaseApplication[]).map(app => ({
          ...app,
          ptp_date: app.ptp_date, // FIX: Explicitly preserve ptp_date
          recent_comments: commentsByApp[app.applicant_id] || []
        })) as Application[];

        allApplicationsWithComments = (allAppsData as DatabaseApplication[]).map(app => ({
          ...app,
          ptp_date: app.ptp_date, // FIX: Explicitly preserve ptp_date
          recent_comments: commentsByApp[app.applicant_id] || []
        })) as Application[];
      }

      console.log('=== ENHANCED APPLICATIONS WITH COMMENTS (FIXED) ===');
      const sampleApp = applicationsWithComments.find(app => app.recent_comments && app.recent_comments.length > 0);
      if (sampleApp) {
        console.log('Sample app with comments:', sampleApp);
        console.log('PTP Date preserved:', sampleApp.ptp_date);
        console.log('Comments with user names:', sampleApp.recent_comments);
      }
      
      setApplications(applicationsWithComments);
      setAllApplications(allApplicationsWithComments);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize]);

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
