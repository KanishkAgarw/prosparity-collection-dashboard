
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';

interface UseApplicationsProps {
  page?: number;
  pageSize?: number;
}

// Define the database application type without recent_comments
interface DatabaseApplication {
  id: string;
  applicant_id: string;
  applicant_name: string;
  branch_name: string;
  team_lead: string;
  rm_name: string;
  dealer_name: string;
  lender_name: string;
  status: string;
  emi_amount: number;
  principle_due: number;
  interest_due: number;
  ptp_date?: string;
  paid_date?: string;
  demand_date?: string;
  rm_comments?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  applicant_mobile?: string;
  applicant_address?: string;
  house_ownership?: string;
  co_applicant_name?: string;
  co_applicant_mobile?: string;
  co_applicant_address?: string;
  guarantor_name?: string;
  guarantor_mobile?: string;
  guarantor_address?: string;
  reference_name?: string;
  reference_mobile?: string;
  reference_address?: string;
  fi_location?: string;
  repayment?: string;
  last_month_bounce?: number;
  applicant_calling_status?: string;
  co_applicant_calling_status?: string;
  guarantor_calling_status?: string;
  reference_calling_status?: string;
  latest_calling_status?: string;
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
      
      let applicationsWithComments: Application[] = appsData || [];
      let allApplicationsWithComments: Application[] = allAppsData || [];
      
      if (allAppIds.length > 0) {
        console.log('=== ENHANCED USER MAPPING FIX DEBUG ===');
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
          console.log('Fetched comments count:', commentsData?.length || 0);
        }

        // Get ALL unique user IDs from comments
        const allUserIds = [...new Set(commentsData?.map(comment => comment.user_id) || [])];
        console.log('=== ENHANCED USER PROFILES FETCH ===');
        console.log('All unique user IDs:', allUserIds);
        
        let userProfilesMap: Record<string, { full_name?: string; email?: string }> = {};
        
        if (allUserIds.length > 0) {
          console.log('=== FETCHING ALL USER PROFILES ===');
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', allUserIds);

          console.log('=== ENHANCED PROFILES FETCH RESULT ===');
          console.log('Profiles data:', profilesData);
          console.log('Profiles error:', profilesError);
          
          if (profilesError) {
            console.error('CRITICAL: Profiles fetch error:', profilesError);
          } else if (profilesData && profilesData.length > 0) {
            // Create the profiles map with enhanced validation
            profilesData.forEach(profile => {
              userProfilesMap[profile.id] = { 
                full_name: profile.full_name, 
                email: profile.email 
              };
              console.log(`✓ Enhanced mapping: ${profile.id} -> name: "${profile.full_name}", email: "${profile.email}"`);
            });
            
            console.log('=== ENHANCED USER PROFILES MAP ===');
            console.log('Complete enhanced mapping:', userProfilesMap);
          } else {
            console.log('No profiles data returned');
          }
        }

        // Group comments by application with SUPER ENHANCED user name resolution
        const commentsByApp = (commentsData || []).reduce((acc, comment) => {
          if (!acc[comment.application_id]) {
            acc[comment.application_id] = [];
          }
          if (acc[comment.application_id].length < 3) {
            const userProfile = userProfilesMap[comment.user_id];
            
            console.log(`=== SUPER ENHANCED COMMENT USER RESOLUTION ===`);
            console.log(`Comment App ID: ${comment.application_id}`);
            console.log(`User ID: ${comment.user_id}`);
            console.log(`Profile found:`, userProfile);
            
            // SUPER ENHANCED user name resolution with multiple fallback strategies
            let resolvedUserName = 'Unknown User';
            
            if (userProfile) {
              // Strategy 1: Check full_name with comprehensive validation
              if (userProfile.full_name && 
                  typeof userProfile.full_name === 'string' &&
                  userProfile.full_name.trim() !== '' && 
                  userProfile.full_name.toLowerCase() !== 'null' &&
                  userProfile.full_name !== 'null' &&
                  userProfile.full_name !== null &&
                  userProfile.full_name !== undefined) {
                resolvedUserName = userProfile.full_name.trim();
                console.log(`✓✓ SUPER SUCCESS - Using full_name: "${resolvedUserName}"`);
              } 
              // Strategy 2: Fallback to email with comprehensive validation
              else if (userProfile.email && 
                       typeof userProfile.email === 'string' &&
                       userProfile.email.trim() !== '' && 
                       userProfile.email.toLowerCase() !== 'null' &&
                       userProfile.email !== 'null' &&
                       userProfile.email !== null &&
                       userProfile.email !== undefined) {
                resolvedUserName = userProfile.email.trim();
                console.log(`✓✓ SUPER SUCCESS - Using email: "${resolvedUserName}"`);
              } else {
                console.log(`✗✗ SUPER FAIL - No valid name or email found for user ${comment.user_id}`);
                console.log(`✗✗ Full name was: "${userProfile.full_name}" (type: ${typeof userProfile.full_name})`);
                console.log(`✗✗ Email was: "${userProfile.email}" (type: ${typeof userProfile.email})`);
              }
            } else {
              console.log(`✗✗ SUPER FAIL - No profile found for user ${comment.user_id}`);
            }
            
            console.log(`✓✓ SUPER FINAL USER NAME: "${resolvedUserName}"`);
            
            acc[comment.application_id].push({
              content: comment.content,
              user_name: resolvedUserName
            });
          }
          return acc;
        }, {} as Record<string, Array<{content: string; user_name: string}>>);

        console.log('=== SUPER ENHANCED FINAL COMMENTS MAPPING SAMPLE ===');
        Object.keys(commentsByApp).slice(0, 3).forEach(appId => {
          console.log(`App ${appId}:`, commentsByApp[appId]);
        });

        // Add comments to both paginated and all applications, properly typing the result
        applicationsWithComments = (appsData as DatabaseApplication[]).map(app => ({
          ...app,
          recent_comments: commentsByApp[app.applicant_id] || []
        })) as Application[];

        allApplicationsWithComments = (allAppsData as DatabaseApplication[]).map(app => ({
          ...app,
          recent_comments: commentsByApp[app.applicant_id] || []
        })) as Application[];
      }

      console.log('=== SUPER ENHANCED APPLICATIONS WITH COMMENTS ===');
      console.log('Sample app with comments:', applicationsWithComments.find(app => app.recent_comments && app.recent_comments.length > 0));
      
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
