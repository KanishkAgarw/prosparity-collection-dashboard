
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';
import { getMonthVariations } from '@/utils/dateUtils';

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

      // Get all possible database variations for the selected month
      const monthVariations = getMonthVariations(selectedEmiMonth);
      console.log('Status counts - querying month variations:', monthVariations);

      // Build base query for applications filtered by EMI month
      let applicationsQuery = supabase
        .from('applications')
        .select('applicant_id, branch_name, team_lead, rm_name, collection_rm, dealer_name, lender_name, repayment, vehicle_status')
        .in('demand_date', monthVariations);

      // Build base query for collection filtered by EMI month
      let collectionQuery = supabase
        .from('collection')
        .select('application_id, team_lead, rm_name, collection_rm, repayment')
        .in('demand_date', monthVariations);

      // Apply filters to both queries
      if (filters.branch?.length > 0) {
        applicationsQuery = applicationsQuery.in('branch_name', filters.branch);
      }
      if (filters.teamLead?.length > 0) {
        applicationsQuery = applicationsQuery.in('team_lead', filters.teamLead);
        collectionQuery = collectionQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        applicationsQuery = applicationsQuery.in('rm_name', filters.rm);
        collectionQuery = collectionQuery.in('rm_name', filters.rm);
      }
      if (filters.collectionRm?.length > 0) {
        // Normalize collection RM values - treat N/A and NA as the same
        const normalizedCollectionRms = filters.collectionRm.map(rm => 
          rm === 'N/A' || rm === 'NA' ? 'N/A' : rm
        );
        applicationsQuery = applicationsQuery.or(
          `collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`
        );
        collectionQuery = collectionQuery.or(
          `collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`
        );
      }
      if (filters.dealer?.length > 0) {
        applicationsQuery = applicationsQuery.in('dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        applicationsQuery = applicationsQuery.in('lender_name', filters.lender);
      }
      if (filters.repayment?.length > 0) {
        applicationsQuery = applicationsQuery.in('repayment', filters.repayment);
        collectionQuery = collectionQuery.in('repayment', filters.repayment);
      }
      if (filters.vehicleStatus?.length > 0) {
        if (filters.vehicleStatus.includes('None')) {
          applicationsQuery = applicationsQuery.or(`vehicle_status.is.null,vehicle_status.in.(${filters.vehicleStatus.filter(v => v !== 'None').join(',')})`);
        } else {
          applicationsQuery = applicationsQuery.in('vehicle_status', filters.vehicleStatus);
        }
      }

      const [appResult, colResult] = await Promise.all([applicationsQuery, collectionQuery]);

      if (appResult.error) {
        console.error('Error fetching applications for status counts:', appResult.error);
        return;
      }

      if (colResult.error) {
        console.error('Error fetching collection for status counts:', colResult.error);
        return;
      }

      const applications = appResult.data || [];
      const collections = colResult.data || [];

      // Combine application IDs from both sources
      const allApplicationIds = new Set<string>();
      applications.forEach(app => allApplicationIds.add(app.applicant_id));
      collections.forEach(col => allApplicationIds.add(col.application_id));

      const applicationIds = Array.from(allApplicationIds);

      console.log(`Found ${applicationIds.length} unique applications for status counting`);

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

      // Fetch field status for these applications
      const { data: fieldStatusData } = await supabase
        .from('field_status')
        .select('application_id, status, created_at')
        .in('application_id', applicationIds)
        .in('demand_date', monthVariations)
        .order('created_at', { ascending: false });

      console.log(`Found ${fieldStatusData?.length || 0} field status records`);

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
