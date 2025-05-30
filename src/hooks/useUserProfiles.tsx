
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
      console.log('Fetching profiles for user IDs:', uncachedUserIds);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', uncachedUserIds);

      if (error) {
        console.error('Error fetching user profiles:', error);
        return [];
      }

      // Update cache with new profiles
      setProfilesCache(prevCache => {
        const newCache = new Map(prevCache);
        profiles?.forEach(profile => {
          newCache.set(profile.id, profile);
        });
        return newCache;
      });

      // Return all requested profiles
      const updatedCache = new Map(profilesCache);
      profiles?.forEach(profile => {
        updatedCache.set(profile.id, profile);
      });
      
      return userIds.map(id => updatedCache.get(id)).filter(Boolean) as UserProfile[];
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getUserName = useCallback((userId: string, fallbackEmail?: string): string => {
    const profile = profilesCache.get(userId);
    if (profile?.full_name) return profile.full_name;
    if (profile?.email) return profile.email;
    if (fallbackEmail) return fallbackEmail;
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
