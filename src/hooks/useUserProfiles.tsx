
import { useState, useEffect, useCallback } from 'react';
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
      const cachedProfiles = userIds.map(id => profilesCache.get(id)).filter(Boolean) as UserProfile[];
      console.log('=== RETURNING CACHED PROFILES ===');
      console.log('Cached profiles count:', cachedProfiles.length);
      console.log('Cached profiles:', cachedProfiles);
      return cachedProfiles;
    }

    setLoading(true);
    try {
      console.log('=== USER PROFILES FETCH (CRITICAL DEBUG) ===');
      console.log('Fetching profiles for user IDs:', uncachedUserIds);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', uncachedUserIds);

      if (error) {
        console.error('CRITICAL: Error fetching user profiles:', error);
        return [];
      }

      console.log('=== PROFILES FETCH SUCCESS ===');
      console.log('Fetched profiles count:', profiles?.length || 0);
      console.log('Fetched profiles data:', profiles);

      // Update cache with new profiles
      if (profiles && profiles.length > 0) {
        setProfilesCache(prevCache => {
          const newCache = new Map(prevCache);
          profiles.forEach(profile => {
            newCache.set(profile.id, profile);
            console.log(`✓ Cached profile: ${profile.id} -> name: "${profile.full_name}", email: "${profile.email}"`);
          });
          console.log('✓ Updated profiles cache size:', newCache.size);
          return newCache;
        });
      }

      // Return all requested profiles (including newly fetched and cached)
      const allProfiles = userIds.map(id => {
        // Check newly fetched profiles first
        const newProfile = profiles?.find(p => p.id === id);
        if (newProfile) {
          console.log(`✓ Found newly fetched profile for ${id}:`, newProfile);
          return newProfile;
        }
        // Then check cache
        const cachedProfile = profilesCache.get(id);
        if (cachedProfile) {
          console.log(`✓ Found cached profile for ${id}:`, cachedProfile);
        } else {
          console.log(`✗ No profile found for ${id}`);
        }
        return cachedProfile;
      }).filter(Boolean) as UserProfile[];
      
      console.log('=== RETURNING ALL PROFILES ===');
      console.log('All profiles count:', allProfiles.length);
      console.log('All profiles:', allProfiles);
      return allProfiles;
    } catch (error) {
      console.error('CRITICAL: Exception in fetchProfiles:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, profilesCache]);

  const getUserName = useCallback((userId: string, fallbackEmail?: string): string => {
    const profile = profilesCache.get(userId);
    console.log(`=== GET USER NAME (CRITICAL DEBUG) ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Profile from cache:`, profile);
    console.log(`Fallback email: ${fallbackEmail}`);
    
    // Enhanced name resolution with better validation
    if (profile?.full_name && 
        typeof profile.full_name === 'string' &&
        profile.full_name.trim() !== '' && 
        profile.full_name.toLowerCase() !== 'null' &&
        profile.full_name !== 'null' &&
        profile.full_name !== null) {
      const name = profile.full_name.trim();
      console.log(`✓ Returning full_name: "${name}"`);
      return name;
    }
    
    if (profile?.email && 
        typeof profile.email === 'string' &&
        profile.email.trim() !== '' && 
        profile.email.toLowerCase() !== 'null' &&
        profile.email !== 'null' &&
        profile.email !== null) {
      const email = profile.email.trim();
      console.log(`✓ Returning profile email: "${email}"`);
      return email;
    }
    
    if (fallbackEmail && 
        typeof fallbackEmail === 'string' &&
        fallbackEmail.trim() !== '') {
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

  // Debug cache contents
  useEffect(() => {
    console.log('=== PROFILES CACHE UPDATE ===');
    console.log('Cache size:', profilesCache.size);
    profilesCache.forEach((profile, id) => {
      console.log(`Cache entry: ${id} ->`, profile);
    });
  }, [profilesCache]);

  return {
    fetchProfiles,
    getUserName,
    profilesCache,
    loading,
    clearCache
  };
};
