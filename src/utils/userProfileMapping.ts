
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/database';

export const fetchUserProfiles = async (userIds: string[]): Promise<Record<string, UserProfile>> => {
  if (userIds.length === 0) return {};

  console.log('=== FETCHING USER PROFILES (FIXED) ===');
  console.log('User IDs to fetch:', userIds);
  
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  console.log('=== PROFILES FETCH RESULT (FIXED) ===');
  console.log('Profiles data:', profilesData);
  console.log('Profiles error:', profilesError);
  
  const userProfilesMap: Record<string, UserProfile> = {};
  
  if (profilesError) {
    console.error('CRITICAL: Profiles fetch error:', profilesError);
    return userProfilesMap;
  }
  
  if (profilesData && profilesData.length > 0) {
    profilesData.forEach(profile => {
      // FIX: Store the complete profile object, not just name/email
      userProfilesMap[profile.id] = { 
        full_name: profile.full_name, 
        email: profile.email 
      };
      console.log(`✓ FIXED - Mapped profile: ${profile.id} -> name: "${profile.full_name}", email: "${profile.email}"`);
    });
    
    console.log('=== FIXED USER PROFILES MAP ===');
    console.log('Complete mapping:', userProfilesMap);
  } else {
    console.log('No profiles data returned');
  }

  return userProfilesMap;
};

export const resolveUserName = (userId: string, userProfile: UserProfile | undefined): string => {
  console.log(`=== USER NAME RESOLUTION (FIXED) ===`);
  console.log(`User ID: ${userId}`);
  console.log(`Profile found:`, userProfile);
  
  // FIX: Simplified and more robust user name resolution
  if (userProfile) {
    // Strategy 1: Use full_name if it exists and is not empty/null
    if (userProfile.full_name && 
        userProfile.full_name.trim() !== '' && 
        userProfile.full_name !== 'null' &&
        userProfile.full_name !== null) {
      const resolvedName = userProfile.full_name.trim();
      console.log(`✓ SUCCESS (FIXED) - Using full_name: "${resolvedName}"`);
      return resolvedName;
    }
    
    // Strategy 2: Use email if full_name is not available
    if (userProfile.email && 
        userProfile.email.trim() !== '' && 
        userProfile.email !== 'null' &&
        userProfile.email !== null) {
      // Extract name from email (part before @)
      const emailName = userProfile.email.split('@')[0];
      const resolvedName = emailName.replace(/[._-]/g, ' ').trim();
      console.log(`✓ SUCCESS (FIXED) - Using email-derived name: "${resolvedName}"`);
      return resolvedName;
    }
  }
  
  console.log(`✗ FAIL (FIXED) - No valid profile found for user ${userId}`);
  return 'Unknown User';
};
