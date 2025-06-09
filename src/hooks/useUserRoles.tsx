
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export const useUserRoles = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkIsAdmin = async (userId?: string) => {
    if (!userId) return false;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin role:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in checkIsAdmin:', error);
      return false;
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user roles:', error);
        return;
      }

      setUserRoles(data || []);
    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
    }
  };

  const assignRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role
        });

      if (error) {
        console.error('Error assigning role:', error);
        throw error;
      }

      await fetchUserRoles();
    } catch (error) {
      console.error('Error in assignRole:', error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeRoles = async () => {
      setLoading(true);
      
      if (user) {
        const adminStatus = await checkIsAdmin(user.id);
        setIsAdmin(adminStatus);
        
        if (adminStatus) {
          await fetchUserRoles();
        }
      }
      
      setLoading(false);
    };

    initializeRoles();
  }, [user]);

  return {
    userRoles,
    isAdmin,
    loading,
    checkIsAdmin,
    assignRole,
    fetchUserRoles
  };
};
