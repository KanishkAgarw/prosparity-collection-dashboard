
import { useMemo } from 'react';
import { Application } from '@/types/application';
import { AuditLog } from './useAuditLogs';
import { format } from 'date-fns';

export interface CollectionSummaryRow {
  rm_name: string;
  branch_name: string;
  daily_counts: { [date: string]: number };
  total: number;
}

export interface BranchCollectionSummary {
  branch_name: string;
  total_stats: CollectionSummaryRow;
  rm_stats: CollectionSummaryRow[];
}

// Target status changes for collection tracking
const COLLECTION_STATUSES = [
  'Paid (Pending Approval)',
  'Cash Collected from Customer',
  'Partially Paid',
  'Customer Deposited to Bank'
];

export const useCollectionSummaryData = (applications: Application[], auditLogs: AuditLog[]) => {
  return useMemo(() => {
    console.log('Collection Summary Data - Applications:', applications.length);
    console.log('Collection Summary Data - Audit logs:', auditLogs.length);
    
    // Filter audit logs for status changes to collection-related statuses
    const collectionStatusLogs = auditLogs.filter(log => 
      log.field === 'Status' && 
      log.new_value && 
      COLLECTION_STATUSES.includes(log.new_value)
    );
    
    console.log('Collection status change logs:', collectionStatusLogs.length);
    
    // Get unique dates from the logs
    const uniqueDates = [...new Set(collectionStatusLogs.map(log => 
      format(new Date(log.created_at), 'dd-MMM-yy')
    ))].sort();
    
    console.log('Unique dates:', uniqueDates);
    
    // Create application lookup for branch and RM info
    const applicationLookup = new Map();
    applications.forEach(app => {
      applicationLookup.set(app.applicant_id, {
        branch_name: app.branch_name,
        rm_name: app.collection_rm || app.rm_name || 'Unknown RM'
      });
    });
    
    const branchMap = new Map<string, BranchCollectionSummary>();
    
    // Process each status change log
    collectionStatusLogs.forEach(log => {
      const appInfo = applicationLookup.get(log.application_id);
      if (!appInfo) return;
      
      const { branch_name, rm_name } = appInfo;
      const logDate = format(new Date(log.created_at), 'dd-MMM-yy');
      
      // Initialize branch if it doesn't exist
      if (!branchMap.has(branch_name)) {
        const dailyCounts: { [date: string]: number } = {};
        uniqueDates.forEach(date => { dailyCounts[date] = 0; });
        
        branchMap.set(branch_name, {
          branch_name,
          total_stats: {
            rm_name: branch_name,
            branch_name,
            daily_counts: { ...dailyCounts },
            total: 0
          },
          rm_stats: []
        });
      }
      
      const branch = branchMap.get(branch_name)!;
      
      // Find or create RM stats
      let rmStats = branch.rm_stats.find(rm => rm.rm_name === rm_name);
      if (!rmStats) {
        const dailyCounts: { [date: string]: number } = {};
        uniqueDates.forEach(date => { dailyCounts[date] = 0; });
        
        rmStats = {
          rm_name,
          branch_name,
          daily_counts: { ...dailyCounts },
          total: 0
        };
        branch.rm_stats.push(rmStats);
      }
      
      // Increment counts
      if (!rmStats.daily_counts[logDate]) rmStats.daily_counts[logDate] = 0;
      if (!branch.total_stats.daily_counts[logDate]) branch.total_stats.daily_counts[logDate] = 0;
      
      rmStats.daily_counts[logDate]++;
      rmStats.total++;
      branch.total_stats.daily_counts[logDate]++;
      branch.total_stats.total++;
    });
    
    const result = Array.from(branchMap.values())
      .map(branch => ({
        ...branch,
        rm_stats: branch.rm_stats.sort((a, b) => b.total - a.total)
      }))
      .sort((a, b) => b.total_stats.total - a.total_stats.total);
    
    return { data: result, uniqueDates };
  }, [applications, auditLogs]);
};
