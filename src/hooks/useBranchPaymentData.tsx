
import { useState, useEffect } from 'react';
import { Application } from '@/types/application';
import { useFieldStatus } from '@/hooks/useFieldStatus';
import { supabase } from '@/integrations/supabase/client';
import { getMonthDateRange, convertEmiMonthToDatabase } from '@/utils/dateUtils';

export interface PaymentStatusRow {
  rm_name: string;
  branch_name: string;
  unpaid: number;
  partially_paid: number;
  paid_pending_approval: number;
  paid: number;
  others: number;
  total: number;
}

export interface BranchPaymentStatus {
  branch_name: string;
  total_stats: PaymentStatusRow;
  rm_stats: PaymentStatusRow[];
}

export const useBranchPaymentData = (applications: Application[], selectedEmiMonth?: string) => {
  const { fetchFieldStatus } = useFieldStatus();
  const [data, setData] = useState<BranchPaymentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPaymentData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let collectionData, error;

        if (!selectedEmiMonth) {
          // For "All" option, get all collection records
          console.log('📊 Fetching all collection records for branch payment data');
          const { data, error: allError } = await supabase
            .from('collection')
            .select(`
              application_id,
              applications!inner(*)
            `);
          collectionData = data;
          error = allError;
        } else {
          // Convert EMI month format from display (Jul-25) to database (2025-07)
          const dbFormatMonth = convertEmiMonthToDatabase(selectedEmiMonth);
          console.log('📊 Converting EMI month format:', selectedEmiMonth, '->', dbFormatMonth);
          
          // For specific month, filter by demand_date range
          console.log('📊 Fetching collection records for month:', dbFormatMonth);
          const { start, end } = getMonthDateRange(dbFormatMonth);
          console.log('📊 Date range for payment data:', { start, end });
          
          const { data, error: monthError } = await supabase
            .from('collection')
            .select(`
              application_id,
              applications!inner(*)
            `)
            .gte('demand_date', start)
            .lte('demand_date', end);
          collectionData = data;
          error = monthError;
        }

        if (error) {
          console.error('Error fetching collection data for branch payment analysis:', error);
          setError(error);
          setData([]);
          return;
        }

        if (!collectionData || collectionData.length === 0) {
          console.log('No collection data found for month:', selectedEmiMonth);
          setData([]);
          return;
        }

        // Get application IDs that have collection records for this month
        const monthApplicationIds = collectionData.map(record => record.application_id);
        console.log(`Found ${monthApplicationIds.length} applications with collection records for ${selectedEmiMonth}`);
        
        // Fetch month-specific field status for only these applications
        const statusMap = await fetchFieldStatus(monthApplicationIds, selectedEmiMonth);

        const branchMap = new Map<string, BranchPaymentStatus>();
        
        // Process only applications that have collection records for this month
        collectionData.forEach(record => {
          const app = record.applications;
          const branchName = app?.branch_name || 'Unknown Branch';
          const rmName = app?.collection_rm || app?.rm_name || 'Unknown RM';
          
          // Get month-specific status or default to 'Unpaid'
          const fieldStatus = statusMap[record.application_id] || 'Unpaid';
          
          if (!branchMap.has(branchName)) {
            branchMap.set(branchName, {
              branch_name: branchName,
              total_stats: {
                rm_name: branchName,
                branch_name: branchName,
                unpaid: 0,
                partially_paid: 0,
                paid_pending_approval: 0,
                paid: 0,
                others: 0,
                total: 0
              },
              rm_stats: []
            });
          }
          
          const branch = branchMap.get(branchName)!;
          
          let rmStats = branch.rm_stats.find(rm => rm.rm_name === rmName);
          if (!rmStats) {
            rmStats = {
              rm_name: rmName,
              branch_name: branchName,
              unpaid: 0,
              partially_paid: 0,
              paid_pending_approval: 0,
              paid: 0,
              others: 0,
              total: 0
            };
            branch.rm_stats.push(rmStats);
          }
          
          rmStats.total++;
          branch.total_stats.total++;
          
          switch (fieldStatus) {
            case 'Unpaid':
              rmStats.unpaid++;
              branch.total_stats.unpaid++;
              break;
            case 'Partially Paid':
              rmStats.partially_paid++;
              branch.total_stats.partially_paid++;
              break;
            case 'Paid (Pending Approval)':
              rmStats.paid_pending_approval++;
              branch.total_stats.paid_pending_approval++;
              break;
            case 'Paid':
              rmStats.paid++;
              branch.total_stats.paid++;
              break;
            case 'Cash Collected from Customer':
            case 'Customer Deposited to Bank':
            default:
              rmStats.others++;
              branch.total_stats.others++;
              break;
          }
        });
        
        const result = Array.from(branchMap.values())
          .map(branch => ({
            ...branch,
            rm_stats: branch.rm_stats.sort((a, b) => b.total - a.total)
          }))
          .sort((a, b) => b.total_stats.total - a.total_stats.total);
          
        setData(result);
      } catch (err) {
        console.error('Error in fetchPaymentData:', err);
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [selectedEmiMonth, fetchFieldStatus]);

  return { data, loading, error };
};
