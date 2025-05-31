
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
      console.log('=== USER PROFILES FETCH DEBUG ===');
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
      setProfilesCache(prevCache => {
        const newCache = new Map(prevCache);
        profiles?.forEach(profile => {
          newCache.set(profile.id, profile);
        });
        return newCache;
      });

      // Return all requested profiles (including newly fetched and cached)
      const allProfiles = userIds.map(id => {
        const cached = profilesCache.get(id);
        if (cached) return cached;
        return profiles?.find(p => p.id === id);
      }).filter(Boolean) as UserProfile[];
      
      console.log('Returning all profiles:', allProfiles);
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
    console.log(`=== GET USER NAME DEBUG ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Profile from cache:`, profile);
    console.log(`Fallback email: ${fallbackEmail}`);
    
    // Prioritize full_name over email with proper null/empty checks
    if (profile?.full_name && profile.full_name.trim() && 
        profile.full_name !== 'null' && profile.full_name !== null) {
      console.log(`Returning full_name: ${profile.full_name}`);
      return profile.full_name.trim();
    }
    if (profile?.email && profile.email.trim() && 
        profile.email !== 'null' && profile.email !== null) {
      console.log(`Returning profile email: ${profile.email}`);
      return profile.email.trim();
    }
    if (fallbackEmail && fallbackEmail.trim()) {
      console.log(`Returning fallback email: ${fallbackEmail}`);
      return fallbackEmail.trim();
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
