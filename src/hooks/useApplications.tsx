
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Application {
  id: string;
  application_id: string;
  applicant_name: string;
  branch: string;
  team_lead: string;
  rm: string;
  dealer: string;
  lender: string;
  status: string;
  emi_due: number;
  emi_month: string;
  paid_date?: string;
  ptp_date?: string;
  rm_comments?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Fetching applications for user:', user.id);
      
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
      } else {
        console.log('Fetched applications:', data);
        console.log('Sample application data:', data?.[0]);
        setApplications(data || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  return {
    applications,
    loading,
    refetch: fetchApplications
  };
};
