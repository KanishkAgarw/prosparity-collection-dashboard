
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  application_id: string;
  created_at: string;
  updated_at: string;
}

export const useComments = (applicationId?: string) => {
  const { user } = useAuth();
  const { fetchProfiles, getUserName } = useUserProfiles();
  const [rawComments, setRawComments] = useState<Omit<Comment, 'user_name'>[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    if (!applicationId || !user) return;
    
    setLoading(true);
    try {
      console.log('Fetching comments for application:', applicationId);
      
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
      } else {
        console.log('Fetched comments:', data);
        setRawComments(data || []);
        
        // Fetch profiles for all unique user IDs
        const userIds = [...new Set(data?.map(comment => comment.user_id) || [])];
        if (userIds.length > 0) {
          await fetchProfiles(userIds);
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoize comments with user names to prevent unnecessary re-renders
  const comments = useMemo(() => {
    return rawComments.map(comment => ({
      ...comment,
      user_name: getUserName(comment.user_id, comment.user_email)
    }));
  }, [rawComments, getUserName]);

  const addComment = async (content: string) => {
    if (!applicationId || !user || !content.trim()) return;

    try {
      console.log('Adding comment for application:', applicationId);
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: content.trim(),
          application_id: applicationId,
          user_id: user.id,
          user_email: user.email
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding comment:', error);
      } else {
        console.log('Added comment:', data);
        await fetchComments(); // Refresh comments
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  useEffect(() => {
    if (applicationId && user) {
      fetchComments();
    }
  }, [applicationId, user]);

  return {
    comments,
    loading,
    addComment,
    refetch: fetchComments
  };
};
