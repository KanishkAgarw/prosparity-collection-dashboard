
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  user_email?: string;
  user_name: string;
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
      console.log('=== FETCHING COMMENTS WITH PROFILES ===');
      console.log('Application ID:', applicationId);
      
      // Fetch comments with user profiles in a single query
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          user_id,
          user_email,
          application_id,
          created_at,
          updated_at,
          profiles!inner(
            full_name,
            email
          )
        `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments with profiles:', commentsError);
        
        // Fallback: fetch comments without profiles and handle name resolution manually
        const { data: basicComments, error: basicError } = await supabase
          .from('comments')
          .select('*')
          .eq('application_id', applicationId)
          .order('created_at', { ascending: true });

        if (basicError) {
          console.error('Error fetching basic comments:', basicError);
          return;
        }

        // Get unique user IDs and fetch profiles separately
        const userIds = [...new Set(basicComments?.map(comment => comment.user_id) || [])];
        console.log('Fetching profiles for user IDs:', userIds);
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        console.log('Fetched profiles:', profiles);

        // Map comments with profile data
        const commentsWithNames = (basicComments || []).map(comment => {
          const profile = profiles?.find(p => p.id === comment.user_id);
          
          let userName = 'Unknown User';
          if (profile?.full_name && profile.full_name.trim() !== '') {
            userName = profile.full_name.trim();
          } else if (profile?.email && profile.email.trim() !== '') {
            userName = profile.email.trim();
          } else if (comment.user_email && comment.user_email.trim() !== '') {
            userName = comment.user_email.trim();
          }
          
          console.log(`Comment ${comment.id}: User ${comment.user_id} -> "${userName}"`);
          
          return {
            ...comment,
            user_name: userName
          };
        });

        setComments(commentsWithNames);
        return;
      }

      console.log('Successfully fetched comments with profiles:', commentsData);

      // Process comments with joined profile data
      const processedComments = (commentsData || []).map(comment => {
        let userName = 'Unknown User';
        
        // Try to get name from joined profile
        if (comment.profiles?.full_name && comment.profiles.full_name.trim() !== '') {
          userName = comment.profiles.full_name.trim();
        } else if (comment.profiles?.email && comment.profiles.email.trim() !== '') {
          userName = comment.profiles.email.trim();
        } else if (comment.user_email && comment.user_email.trim() !== '') {
          userName = comment.user_email.trim();
        }
        
        console.log(`✓ Comment ${comment.id}: User ${comment.user_id} -> "${userName}"`);
        
        return {
          id: comment.id,
          content: comment.content,
          user_id: comment.user_id,
          user_email: comment.user_email,
          user_name: userName,
          application_id: comment.application_id,
          created_at: comment.created_at,
          updated_at: comment.updated_at
        };
      });

      setComments(processedComments);
    } catch (error) {
      console.error('Exception in fetchComments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string) => {
    if (!applicationId || !user || !content.trim()) return;

    try {
      console.log('=== ADDING COMMENT ===');
      console.log('Application ID:', applicationId);
      console.log('User:', user);
      
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
        throw error;
      } else {
        console.log('✓ Added comment successfully:', data);
        // Immediately refresh comments to get the latest data
        await fetchComments();
      }
    } catch (error) {
      console.error('Exception in addComment:', error);
      throw error;
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
