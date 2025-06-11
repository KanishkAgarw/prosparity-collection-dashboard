
import { useMemo } from 'react';
import { Application } from '@/types/application';
import { isToday, isTomorrow, isBefore, isAfter, startOfDay } from 'date-fns';

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

export interface PTPStatusRow {
  rm_name: string;
  branch_name: string;
  overdue: number;
  today: number;
  tomorrow: number;
  future: number;
  no_ptp_set: number;
  total: number;
}

export interface BranchPaymentStatus {
  branch_name: string;
  total_stats: PaymentStatusRow;
  rm_stats: PaymentStatusRow[];
}

export interface BranchPTPStatus {
  branch_name: string;
  total_stats: PTPStatusRow;
  rm_stats: PTPStatusRow[];
}

export const useBranchAnalyticsData = (applications: Application[]) => {
  const branchPaymentStatusData = useMemo(() => {
    const branchMap = new Map<string, BranchPaymentStatus>();
    
    applications.forEach(app => {
      const branchName = app.branch_name;
      // Prioritize collection_rm over rm_name
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
      
      // Find or create RM stats
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
      
      // Update counts
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
        // Move Cash Collected and Customer Deposited to Others category
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
        // Sort RMs by total count (descending)
        rm_stats: branch.rm_stats.sort((a, b) => b.total - a.total)
      }))
      // Sort branches by total count (descending)
      .sort((a, b) => b.total_stats.total - a.total_stats.total);
  }, [applications]);

  const branchPtpStatusData = useMemo(() => {
    // Filter out paid applications
    const unpaidApplications = applications.filter(app => 
      !['Paid'].includes(app.field_status || '')
    );
    
    const branchMap = new Map<string, BranchPTPStatus>();
    const today = startOfDay(new Date());
    
    unpaidApplications.forEach(app => {
      const branchName = app.branch_name;
      // Prioritize collection_rm over rm_name
      const rmName = app.collection_rm || app.rm_name || 'Unknown RM';
      
      if (!branchMap.has(branchName)) {
        branchMap.set(branchName, {
          branch_name: branchName,
          total_stats: {
            rm_name: branchName,
            branch_name: branchName,
            overdue: 0,
            today: 0,
            tomorrow: 0,
            future: 0,
            no_ptp_set: 0,
            total: 0
          },
          rm_stats: []
        });
      }
      
      const branch = branchMap.get(branchName)!;
      
      // Find or create RM stats
      let rmStats = branch.rm_stats.find(rm => rm.rm_name === rmName);
      if (!rmStats) {
        rmStats = {
          rm_name: rmName,
          branch_name: branchName,
          overdue: 0,
          today: 0,
          tomorrow: 0,
          future: 0,
          no_ptp_set: 0,
          total: 0
        };
        branch.rm_stats.push(rmStats);
      }
      
      // Update counts
      rmStats.total++;
      branch.total_stats.total++;
      
      if (!app.ptp_date) {
        rmStats.no_ptp_set++;
        branch.total_stats.no_ptp_set++;
      } else {
        try {
          const ptpDate = new Date(app.ptp_date);
          
          if (isToday(ptpDate)) {
            rmStats.today++;
            branch.total_stats.today++;
          } else if (isTomorrow(ptpDate)) {
            rmStats.tomorrow++;
            branch.total_stats.tomorrow++;
          } else if (isBefore(ptpDate, today)) {
            rmStats.overdue++;
            branch.total_stats.overdue++;
          } else if (isAfter(ptpDate, today)) {
            rmStats.future++;
            branch.total_stats.future++;
          } else {
            rmStats.no_ptp_set++;
            branch.total_stats.no_ptp_set++;
          }
        } catch {
          rmStats.no_ptp_set++;
          branch.total_stats.no_ptp_set++;
        }
      }
    });
    
    return Array.from(branchMap.values())
      .map(branch => ({
        ...branch,
        // Sort RMs by total count (descending)
        rm_stats: branch.rm_stats.sort((a, b) => b.total - a.total)
      }))
      // Sort branches by total count (descending)
      .sort((a, b) => b.total_stats.total - a.total_stats.total);
  }, [applications]);

  return {
    branchPaymentStatusData,
    branchPtpStatusData
  };
};
