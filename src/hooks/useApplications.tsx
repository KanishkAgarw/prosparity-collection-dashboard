
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

      // Fetch recent comments for ALL applications
      const allAppIds = allAppsData?.map(app => app.applicant_id) || [];
      
      let applicationsWithComments = appsData || [];
      let allApplicationsWithComments = allAppsData || [];
      
      if (allAppIds.length > 0) {
        console.log('=== FIXING USER MAPPING ISSUE ===');
        console.log('Fetching comments for application IDs count:', allAppIds.length);
        
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

        // Get ALL unique user IDs from comments
        const allUserIds = [...new Set(commentsData?.map(comment => comment.user_id) || [])];
        console.log('All unique user IDs from comments:', allUserIds);
        
        let userProfilesMap: Record<string, { full_name?: string; email?: string }> = {};
        
        if (allUserIds.length > 0) {
          console.log('=== CRITICAL: FETCHING USER PROFILES ===');
          console.log('Fetching profiles for user IDs:', allUserIds);
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', allUserIds);

          console.log('=== PROFILES FETCH RESULT ===');
          console.log('Profiles data returned:', profilesData);
          console.log('Profiles error:', profilesError);
          
          if (profilesError) {
            console.error('CRITICAL: Profiles fetch error:', profilesError);
          } else if (profilesData && profilesData.length > 0) {
            // FIXED: Create the profiles map correctly
            userProfilesMap = {};
            profilesData.forEach(profile => {
              userProfilesMap[profile.id] = { 
                full_name: profile.full_name, 
                email: profile.email 
              };
            });
            console.log('=== FIXED: Created user profiles map ===');
            console.log('User profiles map:', userProfilesMap);
            console.log('Sample mapping check for user b9349a7e-2a5b-4350-89b1-774ade89f418:', 
              userProfilesMap['b9349a7e-2a5b-4350-89b1-774ade89f418']);
          } else {
            console.log('No profiles data returned or empty array');
          }
        }

        // FIXED: Group comments by application with CORRECT user name resolution
        const commentsByApp = (commentsData || []).reduce((acc, comment) => {
          if (!acc[comment.application_id]) {
            acc[comment.application_id] = [];
          }
          if (acc[comment.application_id].length < 3) {
            const userProfile = userProfilesMap[comment.user_id];
            console.log(`=== FIXED USER NAME RESOLUTION ===`);
            console.log(`Comment user ID: ${comment.user_id}`);
            console.log(`User profile found:`, userProfile);
            
            // FIXED: Proper user name resolution logic
            let resolvedUserName = 'Unknown User';
            if (userProfile) {
              console.log(`Profile full_name: "${userProfile.full_name}"`);
              console.log(`Profile email: "${userProfile.email}"`);
              
              // FIXED: Better null/empty checking
              if (userProfile.full_name && 
                  String(userProfile.full_name).trim() !== '' && 
                  String(userProfile.full_name).toLowerCase() !== 'null') {
                resolvedUserName = String(userProfile.full_name).trim();
                console.log(`Using full_name: "${resolvedUserName}"`);
              } else if (userProfile.email && 
                        String(userProfile.email).trim() !== '' && 
                        String(userProfile.email).toLowerCase() !== 'null') {
                resolvedUserName = String(userProfile.email).trim();
                console.log(`Using email: "${resolvedUserName}"`);
              }
            } else {
              console.log(`No profile found for user ${comment.user_id}`);
            }
            
            console.log(`=== FINAL RESOLVED USER NAME: "${resolvedUserName}" ===`);
            
            acc[comment.application_id].push({
              content: comment.content,
              user_name: resolvedUserName
            });
          }
          return acc;
        }, {} as Record<string, Array<{content: string; user_name: string}>>);

        console.log('=== FINAL COMMENTS MAPPING ===');
        console.log('Comments by app (sample):', Object.keys(commentsByApp).slice(0, 3).reduce((acc, key) => {
          acc[key] = commentsByApp[key];
          return acc;
        }, {} as any));

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

      console.log('=== FINAL RESULT ===');
      console.log('Sample application with comments:', applicationsWithComments[0]);
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
