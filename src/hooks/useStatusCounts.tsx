
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';
import { getMonthDateRange } from '@/utils/dateUtils';
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
      console.log('=== FETCHING STATUS COUNTS ===');
      console.log('Selected EMI Month:', selectedEmiMonth);
      console.log('Search term:', searchTerm);

      const { start, end } = getMonthDateRange(selectedEmiMonth!);
      console.log('Status counts - querying date range:', start, 'to', end);

      // Get all applications from collection table for this month with joins
      let collectionQuery = supabase
        .from('collection')
        .select(`
          application_id,
          team_lead,
          rm_name,
          collection_rm,
          repayment,
          applications!inner(
            applicant_name,
            applicant_id,
            applicant_mobile,
            dealer_name,
            lender_name,
            branch_name
          )
        `)
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
          rm === 'N/A' || rm === 'NA' ? null : rm
        );
        if (normalizedCollectionRms.includes(null)) {
          const nonNullRms = normalizedCollectionRms.filter(rm => rm !== null);
          if (nonNullRms.length > 0) {
            collectionQuery = collectionQuery.or(`collection_rm.in.(${nonNullRms.join(',')}),collection_rm.is.null`);
          } else {
            collectionQuery = collectionQuery.is('collection_rm', null);
          }
        } else {
          collectionQuery = collectionQuery.in('collection_rm', normalizedCollectionRms);
        }
      }
      if (filters.repayment?.length > 0) {
        collectionQuery = collectionQuery.in('repayment', filters.repayment);
      }

      // Apply applications table filters
      if (filters.branch?.length > 0) {
        collectionQuery = collectionQuery.in('applications.branch_name', filters.branch);
      }
      if (filters.dealer?.length > 0) {
        collectionQuery = collectionQuery.in('applications.dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        collectionQuery = collectionQuery.in('applications.lender_name', filters.lender);
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

      console.log(`Found ${collectionData.length} applications from collection for status counting`);

      // Apply search filtering if provided
      let filteredData = collectionData;
      if (searchTerm.trim()) {
        const searchLower = searchTerm.trim().toLowerCase();
        console.log('Applying search filter to status counts:', searchLower);
        
        filteredData = collectionData.filter(record => {
          const app = record.applications;
          const searchableFields = [
            app?.applicant_name?.toLowerCase() || '',
            record.application_id?.toLowerCase() || '',
            app?.applicant_mobile?.toLowerCase() || '',
            app?.dealer_name?.toLowerCase() || '',
            app?.lender_name?.toLowerCase() || '',
            app?.branch_name?.toLowerCase() || '',
            record.rm_name?.toLowerCase() || '',
            record.team_lead?.toLowerCase() || '',
            record.collection_rm?.toLowerCase() || ''
          ];

          return searchableFields.some(field => field.includes(searchLower));
        });

        console.log(`After search filter: ${filteredData.length} applications for status counting`);
      }

      // Get application IDs from filtered data - validate they are strings
      const applicationIds = filteredData
        .map(col => col.application_id)
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0);

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

      // Fetch field status using the centralized manager
      const statusMap = await fetchFieldStatus(applicationIds, selectedEmiMonth);

      // Count statuses for all applications
      const counts = applicationIds.reduce((acc, applicationId) => {
        acc.total++;
        
        const status = statusMap[applicationId] || 'Unpaid';
        
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
      // Set empty counts on error to prevent UI issues
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
  }, [user, selectedEmiMonth, filters, searchTerm, fetchFieldStatus, validateInputs]);

  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  return {
    statusCounts,
    loading,
    refetch: fetchStatusCounts
  };
};
