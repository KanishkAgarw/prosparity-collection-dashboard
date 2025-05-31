
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/database';

export const fetchUserProfiles = async (userIds: string[]): Promise<Record<string, UserProfile>> => {
  if (userIds.length === 0) return {};

  console.log('=== FETCHING USER PROFILES ===');
  console.log('User IDs to fetch:', userIds);
  
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  console.log('=== PROFILES FETCH RESULT ===');
  console.log('Profiles data:', profilesData);
  console.log('Profiles error:', profilesError);
  
  const userProfilesMap: Record<string, UserProfile> = {};
  
  if (profilesError) {
    console.error('CRITICAL: Profiles fetch error:', profilesError);
  } else if (profilesData && profilesData.length > 0) {
    profilesData.forEach(profile => {
      userProfilesMap[profile.id] = { 
        full_name: profile.full_name, 
        email: profile.email 
      };
      console.log(`✓ Mapped profile: ${profile.id} -> name: "${profile.full_name}", email: "${profile.email}"`);
    });
    
    console.log('=== USER PROFILES MAP ===');
    console.log('Complete mapping:', userProfilesMap);
  } else {
    console.log('No profiles data returned');
  }

  return userProfilesMap;
};

export const resolveUserName = (userId: string, userProfile: UserProfile | undefined): string => {
  console.log(`=== USER NAME RESOLUTION ===`);
  console.log(`User ID: ${userId}`);
  console.log(`Profile found:`, userProfile);
  
  // Enhanced user name resolution with comprehensive validation
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
      console.log(`✓ SUCCESS - Using full_name: "${resolvedUserName}"`);
    } 
    // Strategy 2: Fallback to email with comprehensive validation
    else if (userProfile.email && 
             typeof userProfile.email === 'string' &&
             userProfile.email.trim() !== '' && 
             userProfile.email.toLowerCase() !== 'null' &&
             userProfile.email !== 'null' &&
             userProfile.email !== null &&
             userProfile.email !== undefined) {
      // Extract name from email (part before @)
      const emailName = userProfile.email.split('@')[0];
      resolvedUserName = emailName.replace(/[._]/g, ' ').trim();
      console.log(`✓ SUCCESS - Using email-derived name: "${resolvedUserName}"`);
    } else {
      console.log(`✗ FAIL - No valid name or email found for user ${userId}`);
      console.log(`✗ Full name was: "${userProfile.full_name}" (type: ${typeof userProfile.full_name})`);
      console.log(`✗ Email was: "${userProfile.email}" (type: ${typeof userProfile.email})`);
    }
  } else {
    console.log(`✗ FAIL - No profile found for user ${userId}`);
  }
  
  console.log(`✓ FINAL USER NAME: "${resolvedUserName}"`);
  return resolvedUserName;
};
