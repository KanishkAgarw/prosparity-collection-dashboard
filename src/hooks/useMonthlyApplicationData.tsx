import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatEmiMonth } from '@/utils/formatters';

export const useMonthlyApplicationData = (applicantId?: string) => {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableMonthsFormatted, setAvailableMonthsFormatted] = useState<string[]>([]);

  const fetchMonthlyData = useCallback(async () => {
    if (!applicantId) {
      setMonthlyData([]);
      setAvailableMonths([]);
      setAvailableMonthsFormatted([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collection')
        .select('*')
        .eq('application_id', applicantId)
        .order('demand_date', { ascending: true });
      if (error) {
        console.error('Error fetching monthly application data:', error);
        return;
      }
      if (!data || data.length === 0) {
        setMonthlyData([]);
        setAvailableMonths([]);
        setAvailableMonthsFormatted([]);
        return;
      }
      const months = [...new Set(data.map(item => item.demand_date))].sort();
      const monthsFormatted = months.map(month => formatEmiMonth(month));
      setMonthlyData(data);
      setAvailableMonths(months);
      setAvailableMonthsFormatted(monthsFormatted);
    } catch (error) {
      console.error('Error in fetchMonthlyData:', error);
    } finally {
      setLoading(false);
    }
  }, [applicantId]);

  const getApplicationForMonth = useCallback((month: string): any => {
    const monthData = monthlyData.find(item => item.demand_date === month);
    if (monthData) {
      return {
        ...monthData,
        amount_collected: monthData.amount_collected || null
      };
    }
    return null;
  }, [monthlyData]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  return {
    monthlyData,
    availableMonths,
    availableMonthsFormatted,
    loading,
    getApplicationForMonth,
    refetch: fetchMonthlyData
  };
}; 