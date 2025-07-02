import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';
import { getMonthDateRange, monthToEmiDate } from '@/utils/dateUtils';
import { useFieldStatusManager } from '@/hooks/useFieldStatusManager';

interface StatusCounts {
  total: number;
  statusUnpaid: number;
  statusPartiallyPaid: number;
  statusCashCollected: number;
  statusCustomerDeposited: number;
  statusPaid: number;
  statusPendingApproval: number;
}

interface UseStatusCountsProps {
  filters: FilterState;
  selectedEmiMonth?: string | null;
  searchTerm?: string;
}

export const useStatusCounts = ({ filters, selectedEmiMonth, searchTerm = '' }: UseStatusCountsProps) => {
  const { user } = useAuth();
  const { fetchFieldStatus } = useFieldStatusManager();
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    total: 0,
    statusUnpaid: 0,
    statusPartiallyPaid: 0,
    statusCashCollected: 0,
    statusCustomerDeposited: 0,
    statusPaid: 0,
    statusPendingApproval: 0
  });
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');

  const validateInputs = useCallback((month?: string | null): boolean => {
    if (!user) {
      console.warn('❌ No user for status counts');
      return false;
    }
    if (!month) {
      console.warn('❌ No selected EMI month for status counts');
      return false;
    }
    return true;
  }, [user]);

  const fetchStatusCounts = useCallback(async () => {
    if (!validateInputs(selectedEmiMonth)) return;

    setLoading(true);
    try {
      const { start, end } = getMonthDateRange(selectedEmiMonth!);
      // 1. Get all application_ids for the month from collection
      const { data: collectionData, error: collectionError } = await supabase
        .from('collection')
        .select('application_id')
        .gte('demand_date', start)
        .lte('demand_date', end);

      if (collectionError) {
        console.error('Error fetching collection for status counts:', collectionError);
        setStatusCounts({
          total: 0,
          statusUnpaid: 0,
          statusPartiallyPaid: 0,
          statusCashCollected: 0,
          statusCustomerDeposited: 0,
          statusPaid: 0,
          statusPendingApproval: 0
        });
        return;
      }

      const applicationIds = (collectionData || []).map(row => row.application_id);
      if (applicationIds.length === 0) {
        setStatusCounts({
          total: 0,
          statusUnpaid: 0,
          statusPartiallyPaid: 0,
          statusCashCollected: 0,
          statusCustomerDeposited: 0,
          statusPaid: 0,
          statusPendingApproval: 0
        });
        return;
      }

      // 2. Use useFieldStatusManager to get latest status for all applicationIds for the selected month
      const statusMap = await fetchFieldStatus(applicationIds, selectedEmiMonth);

      // 3. Count statuses
      const counts = {
        total: applicationIds.length,
        statusUnpaid: 0,
        statusPartiallyPaid: 0,
        statusCashCollected: 0,
        statusCustomerDeposited: 0,
        statusPaid: 0,
        statusPendingApproval: 0
      };

      applicationIds.forEach(appId => {
        const status = statusMap[appId] || 'Unpaid';
        switch (status) {
          case 'Unpaid':
            counts.statusUnpaid++;
            break;
          case 'Partially Paid':
            counts.statusPartiallyPaid++;
            break;
          case 'Cash Collected from Customer':
            counts.statusCashCollected++;
            break;
          case 'Customer Deposited to Bank':
            counts.statusCustomerDeposited++;
            break;
          case 'Paid':
            counts.statusPaid++;
            break;
          case 'Paid (Pending Approval)':
            counts.statusPendingApproval++;
            break;
        }
      });

      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching status counts:', error);
      setStatusCounts({
        total: 0,
        statusUnpaid: 0,
        statusPartiallyPaid: 0,
        statusCashCollected: 0,
        statusCustomerDeposited: 0,
        statusPaid: 0,
        statusPendingApproval: 0
      });
    } finally {
      setLoading(false);
    }
  }, [selectedEmiMonth, validateInputs, fetchFieldStatus]);

  // Effect with proper cleanup
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStatusCounts();
    }, 300); // Debounce requests

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStatusCounts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    statusCounts,
    loading,
    refetch: fetchStatusCounts
  };
};
