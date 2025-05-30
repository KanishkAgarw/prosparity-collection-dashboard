
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    if (!applicationId || !user) return;
    
    setLoading(true);
    try {
      console.log('Fetching comments for application:', applicationId);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey (
            full_name
          )
        `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
      } else {
        console.log('Fetched comments:', data);
        const commentsWithNames = data?.map(comment => ({
          ...comment,
          user_name: comment.profiles?.full_name || comment.user_email || 'Unknown User'
        })) || [];
        setComments(commentsWithNames);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

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
