
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';

export interface HistoricalSnapshot {
  id: string;
  snapshot_date: string;
  branch_name: string;
  rm_name?: string;
  total_applications: number;
  unpaid_count: number;
  partially_paid_count: number;
  paid_pending_approval_count: number;
  paid_count: number;
  others_count: number;
  ptp_total: number;
  ptp_overdue: number;
  ptp_today: number;
  ptp_tomorrow: number;
  ptp_future: number;
  ptp_no_ptp_set: number;
  total_emi_amount: number;
  total_principle_due: number;
  total_interest_due: number;
}

export const useHistoricalAnalytics = (selectedDate?: string) => {
  const [snapshots, setSnapshots] = useState<HistoricalSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshots = async (date: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .eq('snapshot_date', date)
        .order('branch_name');

      if (error) throw error;
      setSnapshots(data || []);
    } catch (err) {
      console.error('Error fetching historical snapshots:', err);
      setError('Failed to fetch historical data');
    } finally {
      setLoading(false);
    }
  };

  const generateSnapshot = async (date: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('generate_analytics_snapshot', {
        target_date: date
      });

      if (error) throw error;
      console.log('Snapshot generation result:', data);
      
      // Refresh the snapshots after generation
      await fetchSnapshots(date);
    } catch (err) {
      console.error('Error generating snapshot:', err);
      setError('Failed to generate snapshot');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_snapshots')
        .select('snapshot_date')
        .order('snapshot_date', { ascending: false });

      if (error) throw error;
      
      const uniqueDates = [...new Set(data?.map(item => item.snapshot_date) || [])];
      return uniqueDates;
    } catch (err) {
      console.error('Error fetching available dates:', err);
      return [];
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchSnapshots(selectedDate);
    }
  }, [selectedDate]);

  return {
    snapshots,
    loading,
    error,
    fetchSnapshots,
    generateSnapshot,
    getAvailableDates
  };
};
