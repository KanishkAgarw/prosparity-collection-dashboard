
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';

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
}

export const useStatusCounts = ({ filters, selectedEmiMonth }: UseStatusCountsProps) => {
  const { user } = useAuth();
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

  const fetchStatusCounts = useCallback(async () => {
    if (!user || !selectedEmiMonth) return;

    setLoading(true);
    try {
      console.log('Fetching status counts for month:', selectedEmiMonth);

      // Build base query for applications filtered by EMI month
      let baseQuery = supabase
        .from('applications')
        .select('applicant_id, branch_name, team_lead, rm_name, collection_rm, dealer_name, lender_name, repayment, vehicle_status')
        .eq('demand_date', selectedEmiMonth);

      // Apply filters to the base query
      if (filters.branch?.length > 0) {
        baseQuery = baseQuery.in('branch_name', filters.branch);
      }
      if (filters.teamLead?.length > 0) {
        baseQuery = baseQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        baseQuery = baseQuery.in('rm_name', filters.rm);
      }
      if (filters.collectionRm?.length > 0) {
        baseQuery = baseQuery.in('collection_rm', filters.collectionRm);
      }
      if (filters.dealer?.length > 0) {
        baseQuery = baseQuery.in('dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        baseQuery = baseQuery.in('lender_name', filters.lender);
      }
      if (filters.repayment?.length > 0) {
        baseQuery = baseQuery.in('repayment', filters.repayment);
      }
      if (filters.vehicleStatus?.length > 0) {
        if (filters.vehicleStatus.includes('None')) {
          baseQuery = baseQuery.or(`vehicle_status.is.null,vehicle_status.in.(${filters.vehicleStatus.filter(v => v !== 'None').join(',')})`);
        } else {
          baseQuery = baseQuery.in('vehicle_status', filters.vehicleStatus);
        }
      }

      const { data: applications, error: appsError } = await baseQuery;

      if (appsError) {
        console.error('Error fetching applications for status counts:', appsError);
        return;
      }

      if (!applications) {
        console.log('No applications found for status counts');
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

      console.log(`Found ${applications.length} applications for status counting`);

      // Fetch field status for these applications
      const applicationIds = applications.map(app => app.applicant_id);
      
      const { data: fieldStatusData } = await supabase
        .from('field_status')
        .select('application_id, status, created_at')
        .in('application_id', applicationIds)
        .eq('demand_date', selectedEmiMonth)
        .order('created_at', { ascending: false });

      console.log(`Found ${fieldStatusData?.length || 0} field status records`);

      // Create status map (latest status per application)
      const statusMap = new Map<string, string>();
      fieldStatusData?.forEach(fs => {
        if (!statusMap.has(fs.application_id)) {
          statusMap.set(fs.application_id, fs.status);
        }
      });

      // Count statuses
      const counts = applications.reduce((acc, app) => {
        acc.total++;
        
        const status = statusMap.get(app.applicant_id) || 'Unpaid';
        
        switch (status) {
          case 'Unpaid':
            acc.statusUnpaid++;
            break;
          case 'Partially Paid':
            acc.statusPartiallyPaid++;
            break;
          case 'Cash Collected from Customer':
            acc.statusCashCollected++;
            break;
          case 'Customer Deposited to Bank':
            acc.statusCustomerDeposited++;
            break;
          case 'Paid':
            acc.statusPaid++;
            break;
          case 'Paid (Pending Approval)':
            acc.statusPendingApproval++;
            break;
        }
        
        return acc;
      }, {
        total: 0,
        statusUnpaid: 0,
        statusPartiallyPaid: 0,
        statusCashCollected: 0,
        statusCustomerDeposited: 0,
        statusPaid: 0,
        statusPendingApproval: 0
      });

      console.log('Status counts calculated:', counts);
      setStatusCounts(counts);

    } catch (error) {
      console.error('Error fetching status counts:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedEmiMonth, filters]);

  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  return {
    statusCounts,
    loading,
    refetch: fetchStatusCounts
  };
};
