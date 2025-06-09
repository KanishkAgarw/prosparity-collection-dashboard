
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/database';

export const fetchUserProfiles = async (userIds: string[]): Promise<Record<string, UserProfile>> => {
  if (userIds.length === 0) return {};

  console.log('=== FETCHING USER PROFILES (FIXED V3) ===');
  console.log('User IDs to fetch:', userIds);
  
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  console.log('=== PROFILES FETCH RESULT (FIXED V3) ===');
  console.log('Profiles data:', profilesData);
  console.log('Profiles error:', profilesError);
  
  const userProfilesMap: Record<string, UserProfile> = {};
  
  if (profilesError) {
    console.error('CRITICAL: Profiles fetch error:', profilesError);
    return userProfilesMap;
  }
  
  if (profilesData && profilesData.length > 0) {
    profilesData.forEach(profile => {
      userProfilesMap[profile.id] = { 
        full_name: profile.full_name, 
        email: profile.email 
      };
      console.log(`✓ FIXED V3 - Mapped profile: ${profile.id} -> name: "${profile.full_name}", email: "${profile.email}"`);
    });
    
    console.log('=== FIXED USER PROFILES MAP V3 ===');
    console.log('Complete mapping:', userProfilesMap);
  } else {
    console.log('No profiles data returned');
  }

  return userProfilesMap;
};

export const resolveUserName = (userId: string, userProfile: UserProfile | undefined): string => {
  console.log(`=== USER NAME RESOLUTION (FIXED V3) ===`);
  console.log(`User ID: ${userId}`);
  console.log(`Profile found:`, userProfile);
  
  if (userProfile) {
    // Strategy 1: Use full_name if it exists and is valid
    if (userProfile.full_name && 
        typeof userProfile.full_name === 'string' &&
        userProfile.full_name.trim() !== '' && 
        userProfile.full_name.toLowerCase() !== 'null' &&
        userProfile.full_name !== 'null' &&
        userProfile.full_name !== null) {
      const resolvedName = userProfile.full_name.trim();
      console.log(`✓ SUCCESS (FIXED V3) - Using full_name: "${resolvedName}"`);
      return resolvedName;
    }
    
    // Strategy 2: Use email if full_name is not available
    if (userProfile.email && 
        typeof userProfile.email === 'string' &&
        userProfile.email.trim() !== '' && 
        userProfile.email.toLowerCase() !== 'null' &&
        userProfile.email !== 'null' &&
        userProfile.email !== null) {
      // Extract name from email (part before @)
      const emailName = userProfile.email.split('@')[0];
      const resolvedName = emailName.replace(/[._-]/g, ' ').trim();
      console.log(`✓ SUCCESS (FIXED V3) - Using email-derived name: "${resolvedName}"`);
      return resolvedName;
    }
  }
  
  console.log(`✗ FAIL (FIXED V3) - No valid profile found for user ${userId}, returning 'Unknown User'`);
  return 'Unknown User';
};
