import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BranchPaymentStatus, PaymentStatusRow } from './useBranchPaymentData';

export const useBranchPaymentDataFromAuditLogs = (selectedEmiMonth?: string) => {
  const [data, setData] = useState<BranchPaymentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching branch payment data from audit_logs for month:', selectedEmiMonth);

        // Fetch audit logs with applications data
        let query = supabase
          .from('audit_logs')
          .select(`
            application_id,
            new_value,
            created_at,
            applications!inner(
              applicant_id,
              branch_name,
              collection_rm,
              rm_name,
              demand_date
            )
          `)
          .eq('field', 'Status')
          .order('created_at', { ascending: false });

        // Apply EMI month filtering
        if (selectedEmiMonth && selectedEmiMonth !== 'all') {
          if (selectedEmiMonth === 'Jun-25') {
            query = query.eq('applications.demand_date', '2025-06-05');
          } else if (selectedEmiMonth === 'Jul-25') {
            // Jul-25 includes both Jul-25 applications and Jun-25 applications updated in July
            query = query.or(
              'applications.demand_date.eq.2025-07-05,and(applications.demand_date.eq.2025-06-05,created_at.gte.2025-07-01,created_at.lt.2025-08-01)'
            );
          }
        } else {
          // "All" - include both Jun-25 and Jul-25
          query = query.in('applications.demand_date', ['2025-06-05', '2025-07-05']);
        }

        const { data: auditData, error: auditError } = await query;

        if (auditError) {
          throw auditError;
        }

        // Process the data client-side to get latest status per application
        const processedData = processAuditLogsClientSide(auditData || [], selectedEmiMonth);
        setData(processedData);

        console.log('✓ Successfully fetched branch payment data from audit_logs');
      } catch (err) {
        console.error('Error fetching branch payment data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEmiMonth]);

  return { data, loading, error };
};

// Helper function to process SQL results into the expected format
const processSQLResults = (queryData: any[]): BranchPaymentStatus[] => {
  const branchMap = new Map<string, BranchPaymentStatus>();

  queryData.forEach(row => {
    const branchName = row.branch_name;
    const rmName = row.rm_name;

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
    
    // Add RM stats
    const rmStats: PaymentStatusRow = {
      rm_name: rmName,
      branch_name: branchName,
      unpaid: parseInt(row.unpaid) || 0,
      partially_paid: parseInt(row.partially_paid) || 0,
      paid_pending_approval: parseInt(row.paid_pending_approval) || 0,
      paid: parseInt(row.paid) || 0,
      others: parseInt(row.others) || 0,
      total: parseInt(row.total) || 0
    };

    branch.rm_stats.push(rmStats);

    // Aggregate to branch totals
    branch.total_stats.unpaid += rmStats.unpaid;
    branch.total_stats.partially_paid += rmStats.partially_paid;
    branch.total_stats.paid_pending_approval += rmStats.paid_pending_approval;
    branch.total_stats.paid += rmStats.paid;
    branch.total_stats.others += rmStats.others;
    branch.total_stats.total += rmStats.total;
  });

  // Sort and return
  return Array.from(branchMap.values())
    .map(branch => ({
      ...branch,
      rm_stats: branch.rm_stats.sort((a, b) => b.total - a.total)
    }))
    .sort((a, b) => b.total_stats.total - a.total_stats.total);
};

// Helper function for client-side processing (fallback)
const processAuditLogsClientSide = (auditData: any[], selectedEmiMonth?: string): BranchPaymentStatus[] => {
  // Get latest status per application
  const latestStatusMap = new Map<string, any>();
  
  auditData.forEach(log => {
    const appId = log.application_id;
    const existingLog = latestStatusMap.get(appId);
    
    if (!existingLog || new Date(log.created_at) > new Date(existingLog.created_at)) {
      // Apply EMI month filtering
      const app = log.applications;
      const demandDate = app.demand_date;
      
      let includeApp = true;
      if (selectedEmiMonth && selectedEmiMonth !== 'all') {
        if (selectedEmiMonth === 'Jun-25') {
          includeApp = demandDate === '2025-06-05';
        } else if (selectedEmiMonth === 'Jul-25') {
          const logDate = new Date(log.created_at);
          includeApp = demandDate === '2025-07-05' || 
                     (demandDate === '2025-06-05' && 
                      logDate >= new Date('2025-07-01') && 
                      logDate < new Date('2025-08-01'));
        }
      } else {
        includeApp = ['2025-06-05', '2025-07-05'].includes(demandDate);
      }
      
      if (includeApp) {
        latestStatusMap.set(appId, log);
      }
    }
  });

  // Group by branch and RM
  const branchMap = new Map<string, BranchPaymentStatus>();
  
  Array.from(latestStatusMap.values()).forEach(log => {
    const app = log.applications;
    const branchName = app.branch_name;
    const rmName = app.collection_rm || app.rm_name || 'Unknown RM';
    const status = log.new_value;

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

    switch (status) {
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
      default:
        rmStats.others++;
        branch.total_stats.others++;
        break;
    }
  });

  return Array.from(branchMap.values())
    .map(branch => ({
      ...branch,
      rm_stats: branch.rm_stats.sort((a, b) => b.total - a.total)
    }))
    .sort((a, b) => b.total_stats.total - a.total_stats.total);
};