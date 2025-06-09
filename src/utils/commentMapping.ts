
import { supabase } from '@/integrations/supabase/client';
import { CommentData, UserProfile } from '@/types/database';

export const fetchAndMapComments = async (applicationIds: string[]) => {
  if (applicationIds.length === 0) return {};

  console.log('=== FETCHING AND MAPPING COMMENTS (FIXED V2) ===');
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
  console.log('=== USER PROFILES FETCH (FIXED V2) ===');
  console.log('All unique user IDs:', allUserIds);
  
  // Fetch user profiles
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', allUserIds);

  console.log('=== PROFILES FETCH RESULT (FIXED V2) ===');
  console.log('Profiles data:', profilesData);
  console.log('Profiles error:', profilesError);
  
  const userProfilesMap: Record<string, UserProfile> = {};
  
  if (profilesData && profilesData.length > 0) {
    profilesData.forEach(profile => {
      userProfilesMap[profile.id] = { 
        full_name: profile.full_name, 
        email: profile.email 
      };
      console.log(`✓ FIXED V2 - Mapped profile: ${profile.id} -> name: "${profile.full_name}", email: "${profile.email}"`);
    });
  }

  console.log('=== USER PROFILES MAP (FIXED V2) ===');
  console.log('Complete mapping:', userProfilesMap);

  // Group comments by application with FIXED user name resolution
  const commentsByApp = (commentsData || []).reduce((acc, comment) => {
    if (!acc[comment.application_id]) {
      acc[comment.application_id] = [];
    }
    if (acc[comment.application_id].length < 3) {
      const userProfile = userProfilesMap[comment.user_id];
      
      console.log(`=== COMMENT MAPPING (FIXED V2) ===`);
      console.log(`Comment App ID: ${comment.application_id}, User ID: ${comment.user_id}`);
      console.log(`Found profile for user:`, userProfile);
      
      // Enhanced user name resolution
      let resolvedUserName = 'Unknown User';
      
      if (userProfile) {
        // Strategy 1: Use full_name if it exists and is valid
        if (userProfile.full_name && 
            typeof userProfile.full_name === 'string' &&
            userProfile.full_name.trim() !== '' && 
            userProfile.full_name.toLowerCase() !== 'null' &&
            userProfile.full_name !== 'null' &&
            userProfile.full_name !== null) {
          resolvedUserName = userProfile.full_name.trim();
          console.log(`✓ SUCCESS (FIXED V2) - Using full_name: "${resolvedUserName}"`);
        }
        // Strategy 2: Use email if full_name is not available
        else if (userProfile.email && 
                 typeof userProfile.email === 'string' &&
                 userProfile.email.trim() !== '' && 
                 userProfile.email.toLowerCase() !== 'null' &&
                 userProfile.email !== 'null' &&
                 userProfile.email !== null) {
          // Extract name from email (part before @)
          const emailName = userProfile.email.split('@')[0];
          resolvedUserName = emailName.replace(/[._-]/g, ' ').trim();
          console.log(`✓ SUCCESS (FIXED V2) - Using email-derived name: "${resolvedUserName}"`);
        }
      }
      
      console.log(`✓ FINAL RESOLVED NAME (FIXED V2): "${resolvedUserName}"`);
      
      acc[comment.application_id].push({
        content: comment.content,
        user_name: resolvedUserName
      });
    }
    return acc;
  }, {} as Record<string, Array<{content: string; user_name: string}>>);

  console.log('=== FINAL COMMENTS MAPPING (FIXED V2) ===');
  Object.keys(commentsByApp).slice(0, 5).forEach(appId => {
    console.log(`App ${appId}:`, commentsByApp[appId]);
  });

  return commentsByApp;
};
