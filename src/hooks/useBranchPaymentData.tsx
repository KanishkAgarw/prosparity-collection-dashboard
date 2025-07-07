
import { useState, useEffect } from 'react';
import { Application } from '@/types/application';
import { useEnhancedStatusManager } from '@/hooks/useEnhancedStatusManager';
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
  const { fetchEnhancedStatus } = useEnhancedStatusManager();
  const [data, setData] = useState<BranchPaymentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPaymentData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('📊 BRANCH PAYMENT DATA - Fetching payment data for month:', selectedEmiMonth);
        
        let collectionData, error;

        if (!selectedEmiMonth) {
          // For "All" option, get all collection records
          console.log('📊 BRANCH PAYMENT DATA - Fetching all collection records');
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
          console.log('📊 BRANCH PAYMENT DATA - Converting EMI month format:', selectedEmiMonth, '->', dbFormatMonth);
          
          // Validate the converted month format
          if (!dbFormatMonth || !dbFormatMonth.match(/^\d{4}-\d{2}$/)) {
            console.error('❌ BRANCH PAYMENT DATA - Invalid month format after conversion:', dbFormatMonth);
            throw new Error(`Invalid month format: ${selectedEmiMonth}`);
          }
          
          // For specific month, filter by demand_date range
          console.log('📊 BRANCH PAYMENT DATA - Fetching collection records for month:', dbFormatMonth);
          const { start, end } = getMonthDateRange(dbFormatMonth);
          console.log('📊 BRANCH PAYMENT DATA - Date range:', { start, end });
          
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
          console.error('❌ BRANCH PAYMENT DATA - Error fetching collection data:', error);
          throw new Error(`Failed to fetch collection data: ${error.message}`);
        }

        if (!collectionData || collectionData.length === 0) {
          console.log('⚪ BRANCH PAYMENT DATA - No collection data found for month:', selectedEmiMonth);
          setData([]);
          return;
        }

        // Get application IDs that have collection records for this month
        const monthApplicationIds = collectionData.map(record => record.application_id);
        console.log(`📋 BRANCH PAYMENT DATA - Found ${monthApplicationIds.length} applications with collection records for ${selectedEmiMonth}`);
        
        if (monthApplicationIds.length === 0) {
          console.log('⚪ BRANCH PAYMENT DATA - No valid application IDs found');
          setData([]);
          return;
        }
        
        // Convert selectedEmiMonth to database format for enhanced status query
        const dbFormatMonth = selectedEmiMonth ? convertEmiMonthToDatabase(selectedEmiMonth) : undefined;
        
        // ✅ USE ENHANCED STATUS MANAGER for correct "Paid" status prioritization
        console.log('🔧 BRANCH PAYMENT DATA - Using ENHANCED STATUS MANAGER for status fetching');
        const statusMap = await fetchEnhancedStatus(
          monthApplicationIds, 
          { 
            selectedMonth: dbFormatMonth,
            includeAllMonths: false 
          }
        );
        
        console.log('🔍 BRANCH PAYMENT DATA - Enhanced status map loaded:', Object.keys(statusMap).length, 'applications');
        console.log('🔍 BRANCH PAYMENT DATA - Status map sample entries:', Object.entries(statusMap).slice(0, 5));
        
        // Log status distribution from enhanced manager
        const statusDistribution = Object.values(statusMap).reduce((acc, status) => {
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('📊 BRANCH PAYMENT DATA - Enhanced status distribution:', statusDistribution);
        console.log('💰 BRANCH PAYMENT DATA - PAID COUNT from enhanced manager:', statusDistribution['Paid'] || 0);

        const branchMap = new Map<string, BranchPaymentStatus>();
        
        // Process applications using enhanced status data
        collectionData.forEach(record => {
          if (!record.applications) {
            console.warn('⚠️ BRANCH PAYMENT DATA - Missing application data for record:', record.application_id);
            return;
          }
          
          const app = record.applications;
          const branchName = app?.branch_name || 'Unknown Branch';
          const rmName = app?.collection_rm || app?.rm_name || 'Unknown RM';
          
          // ✅ Get enhanced status (prioritizes collection.lms_status = 'Paid')
          let enhancedStatus = statusMap[record.application_id];
          if (!enhancedStatus) {
            // Use the application's lms_status as fallback
            enhancedStatus = app.lms_status || 'Unpaid';
            console.log(`🔄 BRANCH PAYMENT DATA - Using fallback status for ${record.application_id}:`, enhancedStatus);
          } else {
            console.log(`✅ BRANCH PAYMENT DATA - Using enhanced status for ${record.application_id}:`, enhancedStatus);
          }
          
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
          
          // Categorize using enhanced status
          switch (enhancedStatus) {
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
              console.log(`💰 BRANCH PAYMENT DATA - Adding PAID status for ${record.application_id} in branch ${branchName}`);
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
          
        console.log('🎯 BRANCH PAYMENT DATA - Final enhanced status distribution:');
        let totalPaidFromBranches = 0;
        result.forEach(branch => {
          console.log(`Branch ${branch.branch_name}:`, {
            unpaid: branch.total_stats.unpaid,
            partially_paid: branch.total_stats.partially_paid,
            paid_pending_approval: branch.total_stats.paid_pending_approval,
            paid: branch.total_stats.paid,
            others: branch.total_stats.others,
            total: branch.total_stats.total
          });
          totalPaidFromBranches += branch.total_stats.paid;
        });
        console.log('💰 BRANCH PAYMENT DATA - TOTAL PAID COUNT across all branches:', totalPaidFromBranches);
        
        setData(result);
      } catch (err) {
        console.error('❌ BRANCH PAYMENT DATA - Error in fetchPaymentData:', err);
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (applications && applications.length > 0) {
      fetchPaymentData();
    } else {
      console.log('⚪ BRANCH PAYMENT DATA - No applications provided');
      setData([]);
    }
  }, [selectedEmiMonth, fetchEnhancedStatus, applications]);

  return { data, loading, error };
};
