
import { supabase } from '@/integrations/supabase/client';
import { CommentData, UserProfile } from '@/types/database';
import { fetchUserProfiles, resolveUserName } from './userProfileMapping';

export const fetchAndMapComments = async (applicationIds: string[]) => {
  if (applicationIds.length === 0) return {};

  console.log('=== FETCHING AND MAPPING COMMENTS (FIXED V3) ===');
  console.log('Fetching comments for application IDs count:', applicationIds.length);
  
  // Get comments for ALL applications
  const { data: commentsData, error: commentsError } = await supabase
    .from('comments')
    .select('application_id, content, created_at, user_id')
    .in('application_id', applicationIds)
    .order('created_at', { ascending: false });

  if (commentsError) {
    console.error('Error fetching comments:', commentsError);
    return {};
  }

  console.log('Fetched comments count:', commentsData?.length || 0);

  // Get ALL unique user IDs from comments
  const allUserIds = [...new Set(commentsData?.map(comment => comment.user_id) || [])];
  console.log('=== USER PROFILES FETCH (FIXED V3) ===');
  console.log('All unique user IDs:', allUserIds);
  
  // Fetch user profiles using the centralized function
  const userProfilesMap = await fetchUserProfiles(allUserIds);

  console.log('=== USER PROFILES MAP (FIXED V3) ===');
  console.log('Complete mapping:', userProfilesMap);

  // Group comments by application with FIXED user name resolution
  const commentsByApp = (commentsData || []).reduce((acc, comment) => {
    if (!acc[comment.application_id]) {
      acc[comment.application_id] = [];
    }
    if (acc[comment.application_id].length < 3) {
      const userProfile = userProfilesMap[comment.user_id];
      
      console.log(`=== COMMENT MAPPING (FIXED V3) ===`);
      console.log(`Comment App ID: ${comment.application_id}, User ID: ${comment.user_id}`);
      console.log(`Found profile for user:`, userProfile);
      
      // Use the centralized user name resolution function
      const resolvedUserName = resolveUserName(comment.user_id, userProfile);
      
      console.log(`✓ FINAL RESOLVED NAME (FIXED V3): "${resolvedUserName}"`);
      
      acc[comment.application_id].push({
        content: comment.content,
        user_name: resolvedUserName
      });
    }
    return acc;
  }, {} as Record<string, Array<{content: string; user_name: string}>>);

  console.log('=== FINAL COMMENTS MAPPING (FIXED V3) ===');
  Object.keys(commentsByApp).slice(0, 5).forEach(appId => {
    console.log(`App ${appId}:`, commentsByApp[appId]);
  });

  return commentsByApp;
};
