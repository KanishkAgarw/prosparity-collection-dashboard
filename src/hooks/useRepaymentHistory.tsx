import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RepaymentHistory } from '@/types/application';

export const useRepaymentHistory = (applicationId: string | undefined) => {
  const [repaymentHistory, setRepaymentHistory] = useState<RepaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRepaymentHistory = async () => {
      if (!applicationId) {
        setRepaymentHistory([]);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('repayment_history')
          .select('*')
          .eq('application_id', applicationId)
          .order('repayment_number', { ascending: true });

        if (error) {
          throw error;
        }

        setRepaymentHistory(data || []);
      } catch (error) {
        console.error('Error fetching repayment history:', error);
        setRepaymentHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRepaymentHistory();
  }, [applicationId]);

  return { repaymentHistory, loading };
}; 