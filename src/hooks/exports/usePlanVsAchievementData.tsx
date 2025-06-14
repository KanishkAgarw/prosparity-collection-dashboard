
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
      console.log('=== PLAN VS ACHIEVEMENT DATA FETCH - FIXED LOGIC ===');
      console.log('Input planned date/time:', plannedDateTime.toISOString());

      // Get the planned date (just date part, no time) for PTP comparison
      const plannedDateOnly = new Date(plannedDateTime);
      plannedDateOnly.setHours(0, 0, 0, 0);
      const plannedDateStr = plannedDateOnly.toISOString().split('T')[0];
      
      console.log('Looking for applications that had PTP =', plannedDateStr, 'as of', plannedDateTime.toISOString());

      // Step 1: Get ALL PTP records created before or at the planned timestamp
      const { data: historicalPtpData, error: ptpError } = await supabase
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .lte('created_at', plannedDateTime.toISOString())
        .order('application_id')
        .order('created_at', { ascending: false });

      if (ptpError) {
        console.error('Error fetching historical PTP data:', ptpError);
        return [];
      }

      console.log('Total historical PTP records retrieved:', historicalPtpData?.length || 0);

      // Step 2: Get the LATEST PTP for each application as of the planned timestamp
      const ptpAsOfTimestamp: Record<string, string | null> = {};
      const processedApps = new Set<string>();
      
      historicalPtpData?.forEach((record, index) => {
        if (!processedApps.has(record.application_id)) {
          const recordPtpDate = record.ptp_date ? new Date(record.ptp_date).toISOString().split('T')[0] : null;
          
          console.log(`Historical PTP Record ${index + 1}:`, {
            app_id: record.application_id,
            ptp_date: record.ptp_date,
            ptp_date_str: recordPtpDate,
            created_at: record.created_at,
            matches_planned_date: recordPtpDate === plannedDateStr
          });

          ptpAsOfTimestamp[record.application_id] = record.ptp_date;
          processedApps.add(record.application_id);
        }
      });

      // Step 3: Filter to only applications that had PTP = planned date as of the timestamp
      const applicationsWithMatchingPtp = Object.entries(ptpAsOfTimestamp).filter(([appId, ptpDate]) => {
        if (!ptpDate) return false;
        
        const ptpDateStr = new Date(ptpDate).toISOString().split('T')[0];
        const matches = ptpDateStr === plannedDateStr;
        
        console.log(`App ${appId}: PTP as of timestamp = ${ptpDateStr}, Planned date = ${plannedDateStr}, Matches = ${matches}`);
        
        return matches;
      });

      console.log('APPLICATIONS WITH MATCHING PTP:');
      applicationsWithMatchingPtp.forEach(([appId, ptpDate]) => {
        const ptpDateStr = new Date(ptpDate!).toISOString().split('T')[0];
        console.log(`✓ App ${appId}: PTP = ${ptpDateStr} (matches planned date ${plannedDateStr})`);
      });

      console.log('FINAL FILTER RESULT:', applicationsWithMatchingPtp.length, 'applications had PTP matching planned date as of the timestamp');

      if (applicationsWithMatchingPtp.length === 0) {
        console.log('No applications found with matching PTP dates as of the planned timestamp');
        return [];
      }

      const applicationIds = applicationsWithMatchingPtp.map(([appId]) => appId);
      const historicalPtpMap: Record<string, string> = {};
      applicationsWithMatchingPtp.forEach(([appId, ptpDate]) => {
        if (ptpDate) {
          historicalPtpMap[appId] = ptpDate;
        }
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

      // Get historical status as of planned time (for "previous status")
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

      // Get current PTP dates (for "updated PTP date")
      const { data: currentPtpData, error: currentPtpError } = await supabase
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .in('application_id', applicationIds)
        .order('application_id')
        .order('created_at', { ascending: false });

      if (currentPtpError) {
        console.error('Error fetching current PTP data:', currentPtpError);
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

      const currentStatusMap: Record<string, string> = {};
      const processedCurrentStatus = new Set<string>();
      currentStatus?.forEach(status => {
        if (!processedCurrentStatus.has(status.application_id)) {
          currentStatusMap[status.application_id] = status.status;
          processedCurrentStatus.add(status.application_id);
        }
      });

      const currentPtpMap: Record<string, string | null> = {};
      const processedCurrentPtp = new Set<string>();
      currentPtpData?.forEach(ptp => {
        if (!processedCurrentPtp.has(ptp.application_id)) {
          currentPtpMap[ptp.application_id] = ptp.ptp_date;
          processedCurrentPtp.add(ptp.application_id);
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
        const previousStatus = historicalStatusMap[app.applicant_id] || app.lms_status;
        const updatedStatus = currentStatusMap[app.applicant_id] || app.lms_status;
        const historicalPtpDate = historicalPtpMap[app.applicant_id];
        const currentPtpDate = currentPtpMap[app.applicant_id];
        
        console.log(`FINAL RESULT - App ${app.applicant_id} (${app.applicant_name}):`);
        console.log(`  Previous PTP Date (as of ${plannedDateTime.toISOString()}): ${historicalPtpDate}`);
        console.log(`  Current PTP Date: ${currentPtpDate}`);
        console.log(`  Previous Status (as of ${plannedDateTime.toISOString()}): ${previousStatus}`);
        console.log(`  Current Status: ${updatedStatus}`);

        return {
          applicant_id: app.applicant_id,
          branch_name: app.branch_name,
          rm_name: app.rm_name,
          collection_rm: app.collection_rm || '',
          dealer_name: app.dealer_name,
          applicant_name: app.applicant_name,
          previous_ptp_date: historicalPtpDate,
          previous_status: previousStatus,
          updated_ptp_date: currentPtpDate,
          updated_status: updatedStatus,
          comment_trail: commentsByApp[app.applicant_id] || 'No comments'
        };
      }) || [];

      console.log('=== FINAL SUMMARY ===');
      console.log('Total applications in result:', result.length);
      console.log('Logic: Applications that had PTP =', plannedDateStr, 'as of', plannedDateTime.toISOString());
      console.log('Expected: All previous_ptp_date values should be', plannedDateStr);
      
      // Validate the results
      const invalidResults = result.filter(app => {
        const appPtpDateStr = app.previous_ptp_date ? new Date(app.previous_ptp_date).toISOString().split('T')[0] : null;
        return appPtpDateStr !== plannedDateStr;
      });
      
      if (invalidResults.length > 0) {
        console.error('❌ VALIDATION FAILED: Found applications with incorrect previous_ptp_date:');
        invalidResults.forEach(app => {
          const appPtpDateStr = app.previous_ptp_date ? new Date(app.previous_ptp_date).toISOString().split('T')[0] : null;
          console.error(`- ${app.applicant_name}: previous_ptp_date = ${appPtpDateStr}, expected = ${plannedDateStr}`);
        });
      } else {
        console.log('✅ VALIDATION PASSED: All applications have correct previous_ptp_date');
      }
      
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
