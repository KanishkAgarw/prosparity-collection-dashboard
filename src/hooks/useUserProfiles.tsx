
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
      return userIds.map(id => profilesCache.get(id)).filter(Boolean) as UserProfile[];
    }

    setLoading(true);
    try {
      console.log('=== USER PROFILES FETCH DEBUG (FIXED) ===');
      console.log('Fetching profiles for user IDs:', uncachedUserIds);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', uncachedUserIds);

      if (error) {
        console.error('Error fetching user profiles:', error);
        return [];
      }

      console.log('Fetched profiles (FIXED):', profiles);

      // FIXED: Update cache with new profiles
      if (profiles && profiles.length > 0) {
        setProfilesCache(prevCache => {
          const newCache = new Map(prevCache);
          profiles.forEach(profile => {
            newCache.set(profile.id, profile);
          });
          console.log('Updated profiles cache:', Array.from(newCache.entries()));
          return newCache;
        });
      }

      // Return all requested profiles (including newly fetched and cached)
      const allProfiles = userIds.map(id => {
        // Check cache first
        const cached = profilesCache.get(id);
        if (cached) return cached;
        // Check newly fetched profiles
        return profiles?.find(p => p.id === id);
      }).filter(Boolean) as UserProfile[];
      
      console.log('Returning all profiles (FIXED):', allProfiles);
      return allProfiles;
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, profilesCache]);

  const getUserName = useCallback((userId: string, fallbackEmail?: string): string => {
    const profile = profilesCache.get(userId);
    console.log(`=== GET USER NAME DEBUG (FIXED) ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Profile from cache:`, profile);
    console.log(`Fallback email: ${fallbackEmail}`);
    
    // FIXED: More robust name resolution
    if (profile?.full_name && 
        String(profile.full_name).trim() !== '' && 
        String(profile.full_name).toLowerCase() !== 'null') {
      const name = String(profile.full_name).trim();
      console.log(`Returning full_name: ${name}`);
      return name;
    }
    if (profile?.email && 
        String(profile.email).trim() !== '' && 
        String(profile.email).toLowerCase() !== 'null') {
      const email = String(profile.email).trim();
      console.log(`Returning profile email: ${email}`);
      return email;
    }
    if (fallbackEmail && String(fallbackEmail).trim() !== '') {
      const fallback = String(fallbackEmail).trim();
      console.log(`Returning fallback email: ${fallback}`);
      return fallback;
    }
    console.log(`Returning Unknown User`);
    return 'Unknown User';
  }, [profilesCache]);

  const clearCache = useCallback(() => {
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
