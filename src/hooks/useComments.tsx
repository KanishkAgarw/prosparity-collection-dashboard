
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { getMonthDateRange } from '@/utils/dateUtils';

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
  const [lastFetchedApplicationId, setLastFetchedApplicationId] = useState<string | null>(null);
  const [lastFetchedMonth, setLastFetchedMonth] = useState<string | null>(null);
  const fetchInProgressRef = useRef<boolean>(false);

  // Clear comments when selectedMonth changes to prevent stale data
  useEffect(() => {
    if (selectedMonth !== lastFetchedMonth) {
      console.log('Comments: Clearing due to month change', { from: lastFetchedMonth, to: selectedMonth });
      setComments([]);
      setLastFetchedApplicationId(null);
      setLastFetchedMonth(null);
    }
  }, [selectedMonth, lastFetchedMonth]);

  const fetchComments = useCallback(async (applicationId: string): Promise<Comment[]> => {
    if (!user || !applicationId) return [];

    // Prevent duplicate fetches
    if (fetchInProgressRef.current) {
      console.log('Comments: Fetch already in progress, skipping');
      return comments;
    }

    // Check if we already have data for this application and month
    if (lastFetchedApplicationId === applicationId && lastFetchedMonth === selectedMonth && comments.length > 0) {
      console.log('Comments: Using cached data', { applicationId, selectedMonth, count: comments.length });
      return comments;
    }

    fetchInProgressRef.current = true;
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

      // Add month filtering if selectedMonth is provided - filter by demand_date
      if (selectedMonth) {
        const { start, end } = getMonthDateRange(selectedMonth);
        console.log('Date range for comments:', { start, end });
        
        query = query
          .gte('demand_date', start)
          .lte('demand_date', end);
      }

      // Limit to most recent 10 comments for performance
      query = query
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: commentsData, error: commentsError } = await query;

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return [];
      }

      if (!commentsData || commentsData.length === 0) {
        console.log('No comments found for application:', applicationId, 'month:', selectedMonth);
        setComments([]);
        setLastFetchedApplicationId(applicationId);
        setLastFetchedMonth(selectedMonth);
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
      setLastFetchedApplicationId(applicationId);
      setLastFetchedMonth(selectedMonth);
      return mappedComments;
    } catch (error) {
      console.error('Exception in fetchComments:', error);
      return [];
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [user, fetchProfiles, getUserName, selectedMonth, comments, lastFetchedApplicationId, lastFetchedMonth]);

  // Remove the bulk fetch function - we'll only fetch on demand now
  const fetchCommentsByApplications = useCallback(async (
    applicationIds: string[], 
    startDate?: Date, 
    endDate?: Date
  ): Promise<Record<string, Array<{content: string; user_name: string}>>> => {
    // This is now deprecated - comments should be fetched individually
    console.warn('fetchCommentsByApplications is deprecated. Use individual fetchComments instead.');
    return {};
  }, []);

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

      // Add demand_date if provided - but store as full date for proper filtering
      if (demandDate) {
        // If demandDate is just YYYY-MM, convert to first day of month
        const fullDate = demandDate.length === 7 ? `${demandDate}-01` : demandDate;
        commentData.demand_date = fullDate;
      }

      const { error } = await supabase
        .from('comments')
        .insert(commentData);

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }

      console.log('✓ Comment added successfully');
      // Refresh comments after adding - but only if we have cached data for this app/month
      if (lastFetchedApplicationId === applicationId && lastFetchedMonth === selectedMonth) {
        await fetchComments(applicationId);
      }
    } catch (error) {
      console.error('Exception in addComment:', error);
      throw error;
    }
  }, [user, fetchComments, lastFetchedApplicationId, lastFetchedMonth, selectedMonth]);

  // Add a function to clear comments (useful for resetting state)
  const clearComments = useCallback(() => {
    console.log('Comments: Clearing all cached data');
    setComments([]);
    setLastFetchedApplicationId(null);
    setLastFetchedMonth(null);
  }, []);

  return {
    comments,
    loading,
    fetchComments,
    fetchCommentsByApplications, // Kept for backward compatibility but deprecated
    addComment,
    clearComments
  };
};
