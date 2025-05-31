
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/database';

export const fetchUserProfiles = async (userIds: string[]): Promise<Record<string, UserProfile>> => {
  if (userIds.length === 0) return {};

  console.log('=== FETCHING ALL USER PROFILES ===');
  
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  console.log('=== ENHANCED PROFILES FETCH RESULT ===');
  console.log('Profiles data:', profilesData);
  console.log('Profiles error:', profilesError);
  
  const userProfilesMap: Record<string, UserProfile> = {};
  
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

  return userProfilesMap;
};

export const resolveUserName = (userId: string, userProfile: UserProfile | undefined): string => {
  console.log(`=== SUPER ENHANCED COMMENT USER RESOLUTION ===`);
  console.log(`User ID: ${userId}`);
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
      console.log(`✗✗ SUPER FAIL - No valid name or email found for user ${userId}`);
      console.log(`✗✗ Full name was: "${userProfile.full_name}" (type: ${typeof userProfile.full_name})`);
      console.log(`✗✗ Email was: "${userProfile.email}" (type: ${typeof userProfile.email})`);
    }
  } else {
    console.log(`✗✗ SUPER FAIL - No profile found for user ${userId}`);
  }
  
  console.log(`✓✓ SUPER FINAL USER NAME: "${resolvedUserName}"`);
  return resolvedUserName;
};
