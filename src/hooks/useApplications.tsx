
import { useState, useEffect, useCallback } from 'react';
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

      // Fetch recent comments for ALL applications, not just current page
      const allAppIds = allAppsData?.map(app => app.applicant_id) || [];
      
      let applicationsWithComments = appsData || [];
      let allApplicationsWithComments = allAppsData || [];
      
      if (allAppIds.length > 0) {
        console.log('=== COMMENTS DEBUG ===');
        console.log('Fetching comments for all application IDs:', allAppIds.length);
        
        // Get comments for ALL applications
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('application_id, content, created_at, user_id')
          .in('application_id', allAppIds)
          .order('created_at', { ascending: false });

        if (commentsError) {
          console.error('Error fetching comments:', commentsError);
        } else {
          console.log('Fetched comments data:', commentsData);
        }

        // Get ALL user IDs from comments to fetch their profiles
        const allUserIds = [...new Set(commentsData?.map(comment => comment.user_id) || [])];
        console.log('All unique user IDs from comments:', allUserIds);
        
        let profilesMap: Record<string, { full_name?: string; email?: string }> = {};
        
        if (allUserIds.length > 0) {
          console.log('Fetching profiles for user IDs:', allUserIds);
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', allUserIds);

          console.log('Fetched profiles data:', profilesData);
          
          if (profilesError) {
            console.error('Profiles fetch error:', profilesError);
          }

          if (profilesData && profilesData.length > 0) {
            profilesMap = profilesData.reduce((acc, profile) => {
              acc[profile.id] = { 
                full_name: profile.full_name, 
                email: profile.email 
              };
              return acc;
            }, {} as Record<string, { full_name?: string; email?: string }>);
            console.log('Created profiles map:', profilesMap);
          } else {
            console.log('No profiles data returned or empty array');
          }
        }

        // Group comments by application and get last 3 with user names
        const commentsByApp = (commentsData || []).reduce((acc, comment) => {
          if (!acc[comment.application_id]) {
            acc[comment.application_id] = [];
          }
          if (acc[comment.application_id].length < 3) {
            const profile = profilesMap[comment.user_id];
            console.log(`=== USER MAPPING DEBUG ===`);
            console.log(`Comment user ID: ${comment.user_id}`);
            console.log(`Profile found:`, profile);
            
            // Fixed user name resolution logic
            let userName = 'Unknown User';
            if (profile) {
              // Check full_name first (prioritize it)
              if (profile.full_name && profile.full_name.trim() && profile.full_name !== 'null' && profile.full_name !== null) {
                userName = profile.full_name.trim();
              } 
              // Fallback to email if full_name is not available
              else if (profile.email && profile.email.trim() && profile.email !== 'null' && profile.email !== null) {
                userName = profile.email.trim();
              }
            }
            
            console.log(`Final resolved user name: "${userName}"`);
            
            acc[comment.application_id].push({
              content: comment.content,
              user_name: userName
            });
          }
          return acc;
        }, {} as Record<string, Array<{content: string; user_name: string}>>);

        console.log('Final comments by app:', commentsByApp);

        // Add comments to both paginated and all applications
        applicationsWithComments = appsData.map(app => ({
          ...app,
          recent_comments: commentsByApp[app.applicant_id] || []
        }));

        allApplicationsWithComments = allAppsData.map(app => ({
          ...app,
          recent_comments: commentsByApp[app.applicant_id] || []
        }));
      }

      console.log('Final applications with comments (sample):', applicationsWithComments.slice(0, 2));
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
    allApplications, // For filter generation - now includes comments
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
    loading,
    refetch: fetchApplications
  };
};
