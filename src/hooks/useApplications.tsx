
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Application {
  id: string;
  applicant_id: string;
  applicant_name: string;
  branch_name: string;
  team_lead: string;
  rm_name: string;
  dealer_name: string;
  lender_name: string;
  status: string;
  emi_amount: number;
  principle_due: number;
  interest_due: number;
  demand_date?: string;
  paid_date?: string;
  ptp_date?: string;
  rm_comments?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  applicant_mobile?: string;
  applicant_address?: string;
  house_ownership?: string;
  co_applicant_name?: string;
  co_applicant_mobile?: string;
  co_applicant_address?: string;
  guarantor_name?: string;
  guarantor_mobile?: string;
  guarantor_address?: string;
  reference_name?: string;
  reference_mobile?: string;
  reference_address?: string;
  fi_location?: string;
  repayment?: string;
  last_month_bounce?: number;
  applicant_calling_status?: string;
  co_applicant_calling_status?: string;
  guarantor_calling_status?: string;
  reference_calling_status?: string;
  latest_calling_status?: string;
  recent_comments?: string[];
}

interface UseApplicationsProps {
  page?: number;
  pageSize?: number;
}

export const useApplications = ({ page = 1, pageSize = 50 }: UseApplicationsProps = {}) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log(`Fetching applications page ${page} (${pageSize} per page)`);
      
      // Get total count
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });

      setTotalCount(count || 0);

      // Get paginated applications with recent comments
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (appsError) {
        console.error('Error fetching applications:', appsError);
        return;
      }

      // Fetch recent comments for all applications
      const appIds = appsData?.map(app => app.applicant_id) || [];
      
      let applicationsWithComments = appsData || [];
      
      if (appIds.length > 0) {
        const { data: commentsData } = await supabase
          .from('comments')
          .select('application_id, content, created_at')
          .in('application_id', appIds)
          .order('created_at', { ascending: false });

        // Group comments by application and get last 3
        const commentsByApp = (commentsData || []).reduce((acc, comment) => {
          if (!acc[comment.application_id]) {
            acc[comment.application_id] = [];
          }
          if (acc[comment.application_id].length < 3) {
            acc[comment.application_id].push(comment.content);
          }
          return acc;
        }, {} as Record<string, string[]>);

        applicationsWithComments = appsData.map(app => ({
          ...app,
          recent_comments: commentsByApp[app.applicant_id] || []
        }));
      }

      console.log('Fetched applications with comments:', applicationsWithComments);
      setApplications(applicationsWithComments);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  return {
    applications,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
    loading,
    refetch: fetchApplications
  };
};
