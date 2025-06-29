
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
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);

  // Clear comments when selectedMonth changes to prevent stale data
  useEffect(() => {
    setComments([]);
    setCurrentApplicationId(null);
  }, [selectedMonth]);

  const fetchComments = useCallback(async (applicationId: string): Promise<Comment[]> => {
    if (!user || !applicationId) return [];

    // Don't fetch if we're already loading for this application
    if (loading && currentApplicationId === applicationId) return [];

    setLoading(true);
    setCurrentApplicationId(applicationId);
    
    try {
      console.log('=== FETCHING COMMENTS ===');
      console.log('Application ID:', applicationId);
      console.log('Selected Month:', selectedMonth);

      // Build query with month filtering if selectedMonth is provided
      let query = supabase
        .from('comments')
        .select('*')
        .eq('application_id', applicationId);

      // Add month filtering if selectedMonth is provided - use proper date handling
      if (selectedMonth) {
        // Parse the selectedMonth properly - it should be in YYYY-MM-DD format
        let monthStart: string;
        let monthEnd: string;
        
        try {
          if (selectedMonth.length === 10 && selectedMonth.includes('-')) {
            // selectedMonth is already in YYYY-MM-DD format
            const date = new Date(selectedMonth);
            const year = date.getFullYear();
            const month = date.getMonth();
            
            monthStart = new Date(year, month, 1).toISOString().split('T')[0];
            const nextMonth = new Date(year, month + 1, 1);
            monthEnd = nextMonth.toISOString().split('T')[0];
          } else if (selectedMonth.length === 7) {
            // selectedMonth is in YYYY-MM format
            monthStart = `${selectedMonth}-01`;
            const [year, month] = selectedMonth.split('-');
            const nextMonth = new Date(parseInt(year), parseInt(month), 1);
            monthEnd = nextMonth.toISOString().split('T')[0];
          } else {
            // Fallback - treat as YYYY-MM-DD
            const date = new Date(selectedMonth);
            monthStart = date.toISOString().split('T')[0];
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);
            monthEnd = nextDay.toISOString().split('T')[0];
          }
          
          console.log('Date range for comments:', monthStart, 'to', monthEnd);
          
          query = query
            .gte('created_at', monthStart)
            .lt('created_at', monthEnd);
        } catch (dateError) {
          console.error('Error parsing selectedMonth for comments:', dateError);
          // Continue without date filtering if parsing fails
        }
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
  }, [user, fetchProfiles, getUserName, selectedMonth, loading, currentApplicationId]);

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

      // Add demand_date if provided - standardize date format
      if (demandDate) {
        let formattedDate: string;
        try {
          if (demandDate.length === 7) {
            // YYYY-MM format, convert to first day of month
            formattedDate = `${demandDate}-01`;
          } else if (demandDate.length === 10) {
            // Already in YYYY-MM-DD format
            formattedDate = demandDate;
          } else {
            // Try to parse and format
            const date = new Date(demandDate);
            formattedDate = date.toISOString().split('T')[0];
          }
          commentData.demand_date = formattedDate;
          console.log('Formatted demand_date for comment:', formattedDate);
        } catch (dateError) {
          console.error('Error formatting demand_date for comment:', dateError);
          // Continue without demand_date if parsing fails
        }
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

  // Add a function to clear comments (useful for resetting state)
  const clearComments = useCallback(() => {
    setComments([]);
    setCurrentApplicationId(null);
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
