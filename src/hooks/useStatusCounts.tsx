import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';
import { getMonthDateRange, monthToEmiDate } from '@/utils/dateUtils';
import { useEnhancedStatusManager } from '@/hooks/useEnhancedStatusManager';

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
  const { fetchEnhancedStatus } = useEnhancedStatusManager();
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
      
      // Build query with same filters as useSimpleApplications
      let query = supabase
        .from('collection')
        .select(`
          *,
          applications!inner(*)
        `)
        .gte('demand_date', start)
        .lte('demand_date', end);

      // Apply same server-side filters as useSimpleApplications
      if (filters.teamLead?.length > 0) {
        query = query.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        query = query.in('rm_name', filters.rm);
      }
      if (filters.repayment?.length > 0) {
        query = query.in('repayment', filters.repayment);
      }
      if (filters.branch?.length > 0) {
        query = query.in('applications.branch_name', filters.branch);
      }
      if (filters.collectionRm?.length > 0) {
        query = query.in('collection_rm', filters.collectionRm);
      }
      if (filters.dealer?.length > 0) {
        query = query.in('applications.dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        query = query.in('applications.lender_name', filters.lender);
      }
      if (filters.lastMonthBounce?.length > 0) {
        const numericValues = filters.lastMonthBounce.map(val => typeof val === 'string' ? parseInt(val, 10) : val);
        query = query.in('last_month_bounce', numericValues);
      }
      if (filters.vehicleStatus?.length > 0) {
        query = query.in('applications.vehicle_status', filters.vehicleStatus);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('Error fetching filtered data for status counts:', queryError);
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

      if (!data || data.length === 0) {
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

      let filteredApplicationIds = data.map(row => row.application_id);

      // Apply search term filtering if provided
      if (searchTerm?.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        filteredApplicationIds = data
          .filter(row => {
            const app = row.applications;
            const searchableFields = [
              app?.applicant_name?.toLowerCase() || '',
              row.application_id?.toLowerCase() || '',
              app?.applicant_mobile?.toLowerCase() || '',
              app?.dealer_name?.toLowerCase() || '',
              app?.lender_name?.toLowerCase() || '',
              app?.branch_name?.toLowerCase() || '',
              app?.rm_name?.toLowerCase() || '',
              app?.team_lead?.toLowerCase() || '',
              row.collection_rm?.toLowerCase() || ''
            ];
            return searchableFields.some(field => field.includes(searchLower));
          })
          .map(row => row.application_id);
      }

      if (filteredApplicationIds.length === 0) {
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

      // Get enhanced status for filtered applications (this will prioritize collection.lms_status = 'Paid')
      const statusMap = await fetchEnhancedStatus(filteredApplicationIds, { selectedMonth: selectedEmiMonth });

      // Apply status filter if specified
      let finalApplicationIds = filteredApplicationIds;
      if (filters.status?.length > 0) {
        finalApplicationIds = filteredApplicationIds.filter(appId => {
          const status = statusMap[appId] || 'Unpaid';
          return filters.status!.includes(status);
        });
      }

      // Count statuses for the final filtered set using enhanced status
      const counts = {
        total: finalApplicationIds.length,
        statusUnpaid: 0,
        statusPartiallyPaid: 0,
        statusCashCollected: 0,
        statusCustomerDeposited: 0,
        statusPaid: 0,
        statusPendingApproval: 0
      };

      finalApplicationIds.forEach(appId => {
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
  }, [selectedEmiMonth, filters, searchTerm, validateInputs, fetchEnhancedStatus]);

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
