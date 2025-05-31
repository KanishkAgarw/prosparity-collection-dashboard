
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';

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
      
      // Get total count with optimized query
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });

      setTotalCount(count || 0);

      // Fetch ALL applications for filters with optimized select
      const { data: allAppsData, error: allAppsError } = await supabase
        .from('applications')
        .select(`
          id, applicant_id, applicant_name, applicant_mobile, 
          branch_name, team_lead, rm_name, dealer_name, lender_name,
          status, demand_date, emi_amount, ptp_date, 
          last_month_bounce, repayment
        `)
        .order('applicant_name', { ascending: true });

      if (allAppsError) {
        console.error('Error fetching all applications:', allAppsError);
        return;
      }

      // Get paginated applications with comments
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

      const appIds = appsData?.map(app => app.applicant_id) || [];
      
      let applicationsWithComments = appsData || [];
      
      // Only fetch comments for paginated applications to improve performance
      if (appIds.length > 0) {
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('application_id, content, created_at, user_id')
          .in('application_id', appIds)
          .order('created_at', { ascending: false })
          .limit(150); // Limit to recent comments

        if (commentsError) {
          console.error('Error fetching comments:', commentsError);
        }

        // Get user profiles for comment authors
        const userIds = [...new Set(commentsData?.map(comment => comment.user_id) || [])];
        let profilesMap: Record<string, { full_name?: string; email?: string }> = {};
        
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);

          if (!profilesError && profilesData) {
            profilesMap = profilesData.reduce((acc, profile) => {
              acc[profile.id] = { full_name: profile.full_name, email: profile.email };
              return acc;
            }, {} as Record<string, { full_name?: string; email?: string }>);
          }
        }

        // Group comments by application
        const commentsByApp = (commentsData || []).reduce((acc, comment) => {
          if (!acc[comment.application_id]) {
            acc[comment.application_id] = [];
          }
          if (acc[comment.application_id].length < 3) {
            const profile = profilesMap[comment.user_id];
            const userName = profile?.full_name || profile?.email || 'Unknown User';
            acc[comment.application_id].push({
              content: comment.content,
              user_name: userName
            });
          }
          return acc;
        }, {} as Record<string, Array<{content: string; user_name: string}>>);

        applicationsWithComments = appsData.map(app => ({
          ...app,
          recent_comments: commentsByApp[app.applicant_id] || []
        }));
      }

      setApplications(applicationsWithComments);
      setAllApplications(allAppsData || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize]);

  // Memoize expensive calculations
  const memoizedTotalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  return {
    applications,
    allApplications,
    totalCount,
    totalPages: memoizedTotalPages,
    currentPage: page,
    loading,
    refetch: fetchApplications
  };
};
