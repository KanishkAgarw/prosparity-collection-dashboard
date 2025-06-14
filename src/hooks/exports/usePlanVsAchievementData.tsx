
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';

interface PlanVsAchievementApplication {
  applicant_id: string;
  branch_name: string;
  rm_name: string;
  collection_rm: string;
  dealer_name: string;
  applicant_name: string;
  previous_ptp_date: string | null;
  previous_status: string | null;
  updated_ptp_date: string | null;
  updated_status: string | null;
  comment_trail: string;
}

export const usePlanVsAchievementData = () => {
  const { user } = useAuth();
  const { getUserName, fetchProfiles } = useUserProfiles();
  const [loading, setLoading] = useState(false);

  const fetchPlanVsAchievementData = useCallback(async (plannedDateTime: Date): Promise<PlanVsAchievementApplication[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      console.log('=== FETCHING PLAN VS ACHIEVEMENT DATA ===');
      console.log('Planned Date/Time:', plannedDateTime.toISOString());

      // First, get applications that had PTP dates set for the planned date
      const { data: ptpApps, error: ptpError } = await supabase
        .from('ptp_dates')
        .select(`
          application_id,
          ptp_date,
          created_at
        `)
        .lte('created_at', plannedDateTime.toISOString())
        .not('ptp_date', 'is', null)
        .order('application_id')
        .order('created_at', { ascending: false });

      if (ptpError) {
        console.error('Error fetching PTP data:', ptpError);
        return [];
      }

      // Get unique applications that had PTP dates as of planned time
      const uniqueAppIds = new Set<string>();
      const historicalPtpMap: Record<string, string> = {};
      
      ptpApps?.forEach(ptp => {
        if (!uniqueAppIds.has(ptp.application_id)) {
          const ptpDate = new Date(ptp.ptp_date);
          const plannedDate = new Date(plannedDateTime);
          plannedDate.setHours(0, 0, 0, 0);
          
          // Check if PTP was set for the planned date
          if (ptpDate.toDateString() === plannedDate.toDateString()) {
            uniqueAppIds.add(ptp.application_id);
            historicalPtpMap[ptp.application_id] = ptp.ptp_date;
          }
        }
      });

      if (uniqueAppIds.size === 0) {
        console.log('No applications found with PTP dates for the planned date');
        return [];
      }

      const applicationIds = Array.from(uniqueAppIds);
      console.log('Found applications with planned PTPs:', applicationIds.length);

      // Get application details
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .in('applicant_id', applicationIds);

      if (appsError) {
        console.error('Error fetching applications:', appsError);
        return [];
      }

      // Get historical status as of planned time
      const { data: historicalStatus, error: statusError } = await supabase
        .from('field_status')
        .select('application_id, status, created_at')
        .in('application_id', applicationIds)
        .lte('created_at', plannedDateTime.toISOString())
        .order('application_id')
        .order('created_at', { ascending: false });

      if (statusError) {
        console.error('Error fetching historical status:', statusError);
      }

      // Get current PTP dates
      const { data: currentPtp, error: currentPtpError } = await supabase
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .in('application_id', applicationIds)
        .order('application_id')
        .order('created_at', { ascending: false });

      if (currentPtpError) {
        console.error('Error fetching current PTP:', currentPtpError);
      }

      // Get current status
      const { data: currentStatus, error: currentStatusError } = await supabase
        .from('field_status')
        .select('application_id, status, created_at')
        .in('application_id', applicationIds)
        .order('application_id')
        .order('created_at', { ascending: false });

      if (currentStatusError) {
        console.error('Error fetching current status:', currentStatusError);
      }

      // Get comments between planned time and now
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('application_id, content, user_id, user_email, created_at')
        .in('application_id', applicationIds)
        .gte('created_at', plannedDateTime.toISOString())
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
      }

      // Fetch user profiles for comments
      const userIds = [...new Set(comments?.map(c => c.user_id) || [])];
      if (userIds.length > 0) {
        await fetchProfiles(userIds);
      }

      // Create maps for efficient lookup
      const historicalStatusMap: Record<string, string> = {};
      const processedHistoricalStatus = new Set<string>();
      historicalStatus?.forEach(status => {
        if (!processedHistoricalStatus.has(status.application_id)) {
          historicalStatusMap[status.application_id] = status.status;
          processedHistoricalStatus.add(status.application_id);
        }
      });

      const currentPtpMap: Record<string, string> = {};
      const processedCurrentPtp = new Set<string>();
      currentPtp?.forEach(ptp => {
        if (!processedCurrentPtp.has(ptp.application_id)) {
          currentPtpMap[ptp.application_id] = ptp.ptp_date;
          processedCurrentPtp.add(ptp.application_id);
        }
      });

      const currentStatusMap: Record<string, string> = {};
      const processedCurrentStatus = new Set<string>();
      currentStatus?.forEach(status => {
        if (!processedCurrentStatus.has(status.application_id)) {
          currentStatusMap[status.application_id] = status.status;
          processedCurrentStatus.add(status.application_id);
        }
      });

      // Group comments by application
      const commentsByApp: Record<string, string> = {};
      comments?.forEach(comment => {
        const userName = getUserName(comment.user_id, comment.user_email);
        const commentText = `${userName}: ${comment.content}`;
        
        if (commentsByApp[comment.application_id]) {
          commentsByApp[comment.application_id] += ` | ${commentText}`;
        } else {
          commentsByApp[comment.application_id] = commentText;
        }
      });

      // Combine all data
      const result: PlanVsAchievementApplication[] = applications?.map(app => ({
        applicant_id: app.applicant_id,
        branch_name: app.branch_name,
        rm_name: app.rm_name,
        collection_rm: app.collection_rm || '',
        dealer_name: app.dealer_name,
        applicant_name: app.applicant_name,
        previous_ptp_date: historicalPtpMap[app.applicant_id] || null,
        previous_status: historicalStatusMap[app.applicant_id] || app.lms_status,
        updated_ptp_date: currentPtpMap[app.applicant_id] || null,
        updated_status: currentStatusMap[app.applicant_id] || app.lms_status,
        comment_trail: commentsByApp[app.applicant_id] || 'No comments'
      })) || [];

      console.log('Plan vs Achievement data processed:', result.length, 'applications');
      return result;
    } catch (error) {
      console.error('Error in fetchPlanVsAchievementData:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, getUserName, fetchProfiles]);

  return {
    fetchPlanVsAchievementData,
    loading
  };
};
