
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';
import { getMonthDateRange } from '@/utils/dateUtils';

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
      console.log('=== FETCHING STATUS COUNTS ===');
      console.log('Selected EMI Month:', selectedEmiMonth);

      // Get date range for the selected month
      const { start, end } = getMonthDateRange(selectedEmiMonth);
      console.log('Status counts - querying date range:', start, 'to', end);

      // PRIMARY: Get all applications from collection table for this month
      let collectionQuery = supabase
        .from('collection')
        .select('application_id, team_lead, rm_name, collection_rm, repayment')
        .gte('demand_date', start)
        .lte('demand_date', end);

      // Apply filters to collection query
      if (filters.teamLead?.length > 0) {
        collectionQuery = collectionQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        collectionQuery = collectionQuery.in('rm_name', filters.rm);
      }
      if (filters.collectionRm?.length > 0) {
        const normalizedCollectionRms = filters.collectionRm.map(rm => 
          rm === 'N/A' || rm === 'NA' ? 'N/A' : rm
        );
        collectionQuery = collectionQuery.or(
          `collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`
        );
      }
      if (filters.repayment?.length > 0) {
        collectionQuery = collectionQuery.in('repayment', filters.repayment);
      }

      const { data: collectionData, error: collectionError } = await collectionQuery;

      if (collectionError) {
        console.error('Error fetching collection for status counts:', collectionError);
        return;
      }

      if (!collectionData || collectionData.length === 0) {
        console.log('No collection data found for status counts');
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

      // Get application IDs from collection data
      const applicationIds = collectionData.map(col => col.application_id);
      console.log(`Found ${applicationIds.length} applications from collection for status counting`);

      // SECONDARY: Apply additional filters from applications table if needed
      if (filters.branch?.length > 0 || filters.dealer?.length > 0 || filters.lender?.length > 0 || filters.vehicleStatus?.length > 0) {
        let applicationsQuery = supabase
          .from('applications')
          .select('applicant_id')
          .in('applicant_id', applicationIds);

        if (filters.branch?.length > 0) {
          applicationsQuery = applicationsQuery.in('branch_name', filters.branch);
        }
        if (filters.dealer?.length > 0) {
          applicationsQuery = applicationsQuery.in('dealer_name', filters.dealer);
        }
        if (filters.lender?.length > 0) {
          applicationsQuery = applicationsQuery.in('lender_name', filters.lender);
        }
        if (filters.vehicleStatus?.length > 0) {
          if (filters.vehicleStatus.includes('None')) {
            applicationsQuery = applicationsQuery.or(`vehicle_status.is.null,vehicle_status.in.(${filters.vehicleStatus.filter(v => v !== 'None').join(',')})`);
          } else {
            applicationsQuery = applicationsQuery.in('vehicle_status', filters.vehicleStatus);
          }
        }

        const { data: filteredApps, error: appsError } = await applicationsQuery;
        
        if (appsError) {
          console.error('Error applying additional filters for status counts:', appsError);
          return;
        }

        // Update application IDs to only those that pass all filters
        const filteredIds = filteredApps?.map(app => app.applicant_id) || [];
        applicationIds.splice(0, applicationIds.length, ...filteredIds);
        console.log(`After additional filtering: ${applicationIds.length} applications for status counting`);
      }

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

      // Fetch field status for these applications using date range
      const { data: fieldStatusData } = await supabase
        .from('field_status')
        .select('application_id, status, created_at')
        .in('application_id', applicationIds)
        .gte('demand_date', start)
        .lte('demand_date', end)
        .order('created_at', { ascending: false });

      console.log(`Found ${fieldStatusData?.length || 0} field status records for status counting`);

      // Create status map (latest status per application)
      const statusMap = new Map<string, string>();
      fieldStatusData?.forEach(fs => {
        if (!statusMap.has(fs.application_id)) {
          statusMap.set(fs.application_id, fs.status);
        }
      });

      // Count statuses for all applications
      const counts = applicationIds.reduce((acc, applicationId) => {
        acc.total++;
        
        const status = statusMap.get(applicationId) || 'Unpaid';
        
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

      console.log('Final status counts calculated:', counts);
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
