
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
      console.log('=== PLAN VS ACHIEVEMENT DATA FETCH - DEEP ANALYSIS ===');
      console.log('Input planned date/time:', plannedDateTime.toISOString());

      // Get the planned date (just date part, no time) for PTP comparison
      const plannedDateOnly = new Date(plannedDateTime);
      plannedDateOnly.setHours(0, 0, 0, 0);
      const plannedDateStr = plannedDateOnly.toISOString().split('T')[0];
      
      console.log('Planned date string for PTP matching:', plannedDateStr);
      console.log('Planned timestamp for historical cutoff:', plannedDateTime.toISOString());

      // Step 1: Get ALL PTP records up to the planned timestamp, ordered by creation time
      const { data: allHistoricalPtpData, error: ptpError } = await supabase
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .lte('created_at', plannedDateTime.toISOString())
        .not('ptp_date', 'is', null)
        .order('application_id')
        .order('created_at', { ascending: true }); // Important: ascending order to see chronological changes

      if (ptpError) {
        console.error('Error fetching historical PTP data:', ptpError);
        return [];
      }

      console.log('Total historical PTP records retrieved:', allHistoricalPtpData?.length || 0);

      // Step 2: For each application, find the LATEST PTP as of the planned timestamp
      const latestPtpByApp: Record<string, { ptp_date: string; created_at: string }> = {};
      
      allHistoricalPtpData?.forEach((record, index) => {
        const recordCreatedAt = new Date(record.created_at);
        const recordPtpDate = new Date(record.ptp_date);
        const ptpDateStr = recordPtpDate.toISOString().split('T')[0];
        
        console.log(`PTP Record ${index + 1}:`, {
          app_id: record.application_id,
          ptp_date: record.ptp_date,
          ptp_date_str: ptpDateStr,
          created_at: record.created_at,
          matches_planned_date: ptpDateStr === plannedDateStr
        });

        // Always update to the latest record for this application (chronologically)
        latestPtpByApp[record.application_id] = {
          ptp_date: record.ptp_date,
          created_at: record.created_at
        };
      });

      console.log('Latest PTP by application as of planned timestamp:');
      Object.entries(latestPtpByApp).forEach(([appId, ptpData]) => {
        const ptpDate = new Date(ptpData.ptp_date);
        const ptpDateStr = ptpDate.toISOString().split('T')[0];
        console.log(`  App ${appId}: PTP=${ptpDateStr}, Created=${ptpData.created_at}, Matches=${ptpDateStr === plannedDateStr}`);
      });

      // Step 3: Filter to only applications that had PTP set for the planned date as of planned timestamp
      const applicationsWithPlannedPtp = Object.entries(latestPtpByApp).filter(([appId, ptpData]) => {
        const ptpDate = new Date(ptpData.ptp_date);
        const ptpDateStr = ptpDate.toISOString().split('T')[0];
        const matches = ptpDateStr === plannedDateStr;
        
        if (matches) {
          console.log(`✓ INCLUDED: App ${appId} had PTP=${ptpDateStr} as of ${plannedDateTime.toISOString()}`);
        } else {
          console.log(`✗ EXCLUDED: App ${appId} had PTP=${ptpDateStr} (≠ ${plannedDateStr}) as of ${plannedDateTime.toISOString()}`);
        }
        
        return matches;
      });

      console.log('FINAL FILTER RESULT:', applicationsWithPlannedPtp.length, 'applications should be included');

      if (applicationsWithPlannedPtp.length === 0) {
        console.log('No applications found with PTP dates matching the planned date as of the planned timestamp');
        return [];
      }

      const applicationIds = applicationsWithPlannedPtp.map(([appId]) => appId);
      const historicalPtpMap: Record<string, string> = {};
      applicationsWithPlannedPtp.forEach(([appId, ptpData]) => {
        historicalPtpMap[appId] = ptpData.ptp_date;
      });

      console.log('Proceeding with application IDs:', applicationIds);

      // Get application details
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .in('applicant_id', applicationIds);

      if (appsError) {
        console.error('Error fetching applications:', appsError);
        return [];
      }

      console.log('Retrieved application details for:', applications?.length || 0, 'applications');

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
      const result: PlanVsAchievementApplication[] = applications?.map(app => {
        const previousPtpDate = historicalPtpMap[app.applicant_id];
        const previousStatus = historicalStatusMap[app.applicant_id] || app.lms_status;
        const updatedPtpDate = currentPtpMap[app.applicant_id];
        const updatedStatus = currentStatusMap[app.applicant_id] || app.lms_status;
        
        console.log(`FINAL RESULT - App ${app.applicant_id} (${app.applicant_name}):`);
        console.log(`  Previous PTP: ${previousPtpDate}`);
        console.log(`  Current PTP: ${updatedPtpDate}`);
        console.log(`  Previous Status: ${previousStatus}`);
        console.log(`  Current Status: ${updatedStatus}`);

        return {
          applicant_id: app.applicant_id,
          branch_name: app.branch_name,
          rm_name: app.rm_name,
          collection_rm: app.collection_rm || '',
          dealer_name: app.dealer_name,
          applicant_name: app.applicant_name,
          previous_ptp_date: previousPtpDate || null,
          previous_status: previousStatus,
          updated_ptp_date: updatedPtpDate || null,
          updated_status: updatedStatus,
          comment_trail: commentsByApp[app.applicant_id] || 'No comments'
        };
      }) || [];

      console.log('=== FINAL SUMMARY ===');
      console.log('Total applications in result:', result.length);
      console.log('Expected: Applications that had PTP =', plannedDateStr, 'as of', plannedDateTime.toISOString());
      
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
