
import { useMemo } from 'react';
import { Application } from '@/types/application';

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

export const useBranchPaymentData = (applications: Application[]) => {
  return useMemo(() => {
    const branchMap = new Map<string, BranchPaymentStatus>();
    
    applications.forEach(app => {
      const branchName = app.branch_name;
      const rmName = app.collection_rm || app.rm_name || 'Unknown RM';
      
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
      
      switch (app.field_status) {
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
    
    return Array.from(branchMap.values())
      .map(branch => ({
        ...branch,
        rm_stats: branch.rm_stats.sort((a, b) => b.total - a.total)
      }))
      .sort((a, b) => b.total_stats.total - a.total_stats.total);
  }, [applications]);
};
