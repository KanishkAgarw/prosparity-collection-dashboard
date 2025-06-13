
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';
import { format } from 'date-fns';

interface PlanVsAchievementApplication extends Application {
  status_on_selected_date: string;
  current_status: string;
  comment_trail: string;
}

export const usePlanVsAchievementData = () => {
  const [loading, setLoading] = useState(false);

  const fetchPlanVsAchievementData = useCallback(async (selectedDateTime: Date): Promise<PlanVsAchievementApplication[]> => {
    setLoading(true);
    try {
      console.log('Fetching Plan vs Achievement data for:', selectedDateTime);

      // First, find applications where PTP was set on the selected date/time
      const { data: ptpRecords, error: ptpError } = await supabase
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .gte('created_at', format(selectedDateTime, 'yyyy-MM-dd HH:mm:00'))
        .lt('created_at', format(new Date(selectedDateTime.getTime() + 60000), 'yyyy-MM-dd HH:mm:00')) // 1 minute window
        .not('ptp_date', 'is', null);

      if (ptpError) {
        console.error('Error fetching PTP records:', ptpError);
        return [];
      }

      if (!ptpRecords || ptpRecords.length === 0) {
        console.log('No PTP records found for the selected date/time');
        return [];
      }

      const applicationIds = ptpRecords.map(record => record.application_id);
      console.log('Found', applicationIds.length, 'applications with PTP set on selected date/time');

      // Fetch application details
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('*')
        .in('applicant_id', applicationIds);

      if (appError) {
        console.error('Error fetching applications:', appError);
        return [];
      }

      // Fetch current field status
      const { data: currentStatuses, error: statusError } = await supabase
        .from('field_status')
        .select('application_id, status')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false });

      if (statusError) {
        console.error('Error fetching current statuses:', statusError);
      }

      // Create a map of current statuses
      const currentStatusMap: Record<string, string> = {};
      currentStatuses?.forEach(status => {
        if (!currentStatusMap[status.application_id]) {
          currentStatusMap[status.application_id] = status.status;
        }
      });

      // Fetch historical status at selected date/time
      const { data: historicalStatuses, error: histError } = await supabase
        .from('field_status')
        .select('application_id, status, created_at')
        .in('application_id', applicationIds)
        .lte('created_at', selectedDateTime.toISOString())
        .order('created_at', { ascending: false });

      if (histError) {
        console.error('Error fetching historical statuses:', histError);
      }

      // Create a map of historical statuses (latest before selected date/time)
      const historicalStatusMap: Record<string, string> = {};
      historicalStatuses?.forEach(status => {
        if (!historicalStatusMap[status.application_id]) {
          historicalStatusMap[status.application_id] = status.status;
        }
      });

      // Fetch comments for comment trail
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('application_id, content, user_email, created_at')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
      }

      // Group comments by application_id
      const commentsMap: Record<string, Array<{content: string; user_email: string; created_at: string}>> = {};
      comments?.forEach(comment => {
        if (!commentsMap[comment.application_id]) {
          commentsMap[comment.application_id] = [];
        }
        commentsMap[comment.application_id].push({
          content: comment.content,
          user_email: comment.user_email || 'Unknown User',
          created_at: comment.created_at
        });
      });

      // Combine all data
      const planVsAchievementData: PlanVsAchievementApplication[] = applications?.map(app => {
        const ptpRecord = ptpRecords.find(ptp => ptp.application_id === app.applicant_id);
        const commentTrail = commentsMap[app.applicant_id]?.map(comment => 
          `${format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm')} - ${comment.user_email}: ${comment.content}`
        ).join(' | ') || 'No comments';

        return {
          ...app,
          ptp_date: ptpRecord?.ptp_date,
          status_on_selected_date: historicalStatusMap[app.applicant_id] || app.lms_status,
          current_status: currentStatusMap[app.applicant_id] || app.lms_status,
          comment_trail: commentTrail
        };
      }) || [];

      console.log('Plan vs Achievement data processed:', planVsAchievementData.length, 'applications');
      return planVsAchievementData;

    } catch (error) {
      console.error('Error in fetchPlanVsAchievementData:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchPlanVsAchievementData,
    loading
  };
};
