
import { supabase } from '@/integrations/supabase/client';
import { CommentData, UserProfile } from '@/types/database';
import { fetchUserProfiles, resolveUserName } from './userProfileMapping';

export const fetchAndMapComments = async (applicationIds: string[]) => {
  if (applicationIds.length === 0) return {};

  console.log('=== FETCHING AND MAPPING COMMENTS ===');
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
  console.log('=== USER PROFILES FETCH ===');
  console.log('All unique user IDs:', allUserIds);
  
  // Fetch user profiles with updated mapping
  const userProfilesMap = await fetchUserProfiles(allUserIds);

  // Group comments by application with enhanced user name resolution
  const commentsByApp = (commentsData || []).reduce((acc, comment) => {
    if (!acc[comment.application_id]) {
      acc[comment.application_id] = [];
    }
    if (acc[comment.application_id].length < 3) {
      const userProfile = userProfilesMap[comment.user_id];
      
      console.log(`Comment App ID: ${comment.application_id}, User ID: ${comment.user_id}`);
      const resolvedUserName = resolveUserName(comment.user_id, userProfile);
      
      acc[comment.application_id].push({
        content: comment.content,
        user_name: resolvedUserName
      });
    }
    return acc;
  }, {} as Record<string, Array<{content: string; user_name: string}>>);

  console.log('=== FINAL COMMENTS MAPPING SAMPLE ===');
  Object.keys(commentsByApp).slice(0, 3).forEach(appId => {
    console.log(`App ${appId}:`, commentsByApp[appId]);
  });

  return commentsByApp;
};
