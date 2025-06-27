import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_email: string | null;
  user_name: string;
  application_id: string;
  demand_date?: string;
}

export const useComments = (selectedMonth?: string) => {
  const { user } = useAuth();
  const { getUserName, fetchProfiles } = useUserProfiles();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async (applicationId: string): Promise<Comment[]> => {
    if (!user || !applicationId) return [];

    setLoading(true);
    try {
      console.log('=== FETCHING COMMENTS ===');
      console.log('Application ID:', applicationId);
      console.log('Selected Month:', selectedMonth);

      // Build query with month filtering if selectedMonth is provided
      let query = supabase
        .from('comments')
        .select('*')
        .eq('application_id', applicationId);

      // Add month filtering if selectedMonth is provided
      if (selectedMonth) {
        query = query.eq('demand_date', selectedMonth);
      }

      query = query.order('created_at', { ascending: false });

      const { data: commentsData, error: commentsError } = await query;

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return [];
      }

      if (!commentsData || commentsData.length === 0) {
        console.log('No comments found for application:', applicationId, 'month:', selectedMonth);
        setComments([]);
        return [];
      }

      console.log('Raw comments data:', commentsData);

      // Get unique user IDs for profile fetching
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      console.log('Fetching profiles for user IDs:', userIds);

      // Fetch user profiles first and wait for completion
      await fetchProfiles(userIds);

      // Small delay to ensure profiles are cached
      await new Promise(resolve => setTimeout(resolve, 100));

      // Map comments with resolved user names
      const mappedComments: Comment[] = commentsData.map(comment => {
        const userName = getUserName(comment.user_id, comment.user_email);
        console.log(`✓ Comment ${comment.id}: user_id=${comment.user_id} -> resolved_name="${userName}"`);
        
        return {
          ...comment,
          user_name: userName
        };
      });

      console.log('Final mapped comments with resolved names:', mappedComments);
      setComments(mappedComments);
      return mappedComments;
    } catch (error) {
      console.error('Exception in fetchComments:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, fetchProfiles, getUserName, selectedMonth]);

  const fetchCommentsByApplications = useCallback(async (
    applicationIds: string[], 
    startDate?: Date, 
    endDate?: Date
  ): Promise<Record<string, Array<{content: string; user_name: string}>>> => {
    if (!user || applicationIds.length === 0) return {};

    try {
      console.log('=== FETCHING COMMENTS FOR MULTIPLE APPLICATIONS ===');
      console.log('Application IDs:', applicationIds);
      console.log('Date range:', startDate, 'to', endDate);

      // Build query with date filtering if provided
      let query = supabase
        .from('comments')
        .select('*')
        .in('application_id', applicationIds);

      // Add date filtering if both dates are provided
      if (startDate && endDate) {
        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }

      query = query.order('created_at', { ascending: false });

      const { data: commentsData, error: commentsError } = await query;

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return {};
      }

      if (!commentsData || commentsData.length === 0) {
        console.log('No comments found for applications in date range');
        return {};
      }

      console.log('Found comments:', commentsData.length);

      // Get unique user IDs for profile fetching
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      await fetchProfiles(userIds);

      // Small delay to ensure profiles are cached
      await new Promise(resolve => setTimeout(resolve, 100));

      // Group comments by application and resolve user names
      const commentsByApp: Record<string, Array<{content: string; user_name: string}>> = {};
      
      commentsData.forEach(comment => {
        if (!commentsByApp[comment.application_id]) {
          commentsByApp[comment.application_id] = [];
        }
        
        // Only keep the 2 most recent comments per application
        if (commentsByApp[comment.application_id].length < 2) {
          const userName = getUserName(comment.user_id, comment.user_email);
          commentsByApp[comment.application_id].push({
            content: comment.content,
            user_name: userName
          });
        }
      });

      console.log('Comments grouped by application with resolved names:', commentsByApp);
      return commentsByApp;
    } catch (error) {
      console.error('Exception in fetchCommentsByApplications:', error);
      return {};
    }
  }, [user, fetchProfiles, getUserName]);

  const addComment = useCallback(async (applicationId: string, content: string, demandDate?: string): Promise<void> => {
    if (!user || !applicationId || !content.trim()) return;

    try {
      console.log('=== ADDING COMMENT ===');
      console.log('Application ID:', applicationId);
      console.log('Content:', content);
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
      console.log('Demand Date:', demandDate);

      const commentData: any = {
        application_id: applicationId,
        content: content.trim(),
        user_id: user.id,
        user_email: user.email
      };

      // Add demand_date if provided
      if (demandDate) {
        commentData.demand_date = demandDate;
      }

      const { error } = await supabase
        .from('comments')
        .insert(commentData);

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }

      console.log('✓ Comment added successfully');
      // Refresh comments after adding
      await fetchComments(applicationId);
    } catch (error) {
      console.error('Exception in addComment:', error);
      throw error;
    }
  }, [user, fetchComments]);

  return {
    comments,
    loading,
    fetchComments,
    fetchCommentsByApplications,
    addComment
  };
};
