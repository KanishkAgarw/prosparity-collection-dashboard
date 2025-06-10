
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export const useUserProfiles = () => {
  const { user } = useAuth();
  const [profilesCache, setProfilesCache] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchProfiles = useCallback(async (userIds: string[]) => {
    if (!user || userIds.length === 0) return [];

    // Filter out user IDs that are already cached
    const uncachedUserIds = userIds.filter(id => !profilesCache.has(id));
    
    if (uncachedUserIds.length === 0) {
      // Return cached profiles
      return userIds.map(id => profilesCache.get(id)).filter(Boolean) as UserProfile[];
    }

    setLoading(true);
    try {
      console.log('=== FETCHING USER PROFILES ===');
      console.log('Fetching profiles for user IDs:', uncachedUserIds);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', uncachedUserIds);

      if (error) {
        console.error('Error fetching user profiles:', error);
        return [];
      }

      console.log('Fetched profiles:', profiles);

      // Update cache with new profiles
      if (profiles && profiles.length > 0) {
        setProfilesCache(prevCache => {
          const newCache = new Map(prevCache);
          profiles.forEach(profile => {
            newCache.set(profile.id, profile);
            console.log(`✓ Cached profile: ${profile.id} -> name: "${profile.full_name}", email: "${profile.email}"`);
          });
          return newCache;
        });
      }

      // Return all requested profiles
      const allProfiles = userIds.map(id => {
        const newProfile = profiles?.find(p => p.id === id);
        if (newProfile) return newProfile;
        return profilesCache.get(id);
      }).filter(Boolean) as UserProfile[];
      
      return allProfiles;
    } catch (error) {
      console.error('Exception in fetchProfiles:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, profilesCache]);

  const getUserName = useCallback((userId: string, fallbackEmail?: string): string => {
    const profile = profilesCache.get(userId);
    console.log(`=== GET USER NAME ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Profile from cache:`, profile);
    console.log(`Fallback email: ${fallbackEmail}`);
    
    // Priority 1: Use full_name if available and valid
    if (profile?.full_name && 
        profile.full_name.trim() !== '' && 
        profile.full_name !== 'null' &&
        profile.full_name.toLowerCase() !== 'unknown user') {
      const name = profile.full_name.trim();
      console.log(`✓ Returning full_name: "${name}"`);
      return name;
    }
    
    // Priority 2: Use profile email if available
    if (profile?.email && 
        profile.email.trim() !== '' && 
        profile.email !== 'null') {
      const email = profile.email.trim();
      console.log(`✓ Returning profile email: "${email}"`);
      return email;
    }
    
    // Priority 3: Use fallback email if provided
    if (fallbackEmail && fallbackEmail.trim() !== '') {
      const fallback = fallbackEmail.trim();
      console.log(`✓ Returning fallback email: "${fallback}"`);
      return fallback;
    }
    
    console.log(`✗ Returning Unknown User for ${userId}`);
    return 'Unknown User';
  }, [profilesCache]);

  const clearCache = useCallback(() => {
    console.log('Clearing user profiles cache');
    setProfilesCache(new Map());
  }, []);

  return {
    fetchProfiles,
    getUserName,
    profilesCache,
    loading,
    clearCache
  };
};
