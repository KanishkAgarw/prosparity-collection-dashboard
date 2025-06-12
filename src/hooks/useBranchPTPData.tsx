
import { useMemo } from 'react';
import { Application } from '@/types/application';
import { isToday, isTomorrow, isBefore, isAfter, startOfDay } from 'date-fns';

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

export interface BranchPTPStatus {
  branch_name: string;
  total_stats: PTPStatusRow;
  rm_stats: PTPStatusRow[];
}

export const useBranchPTPData = (applications: Application[]) => {
  return useMemo(() => {
    const unpaidApplications = applications.filter(app => 
      !['Paid'].includes(app.field_status || '')
    );
    
    const branchMap = new Map<string, BranchPTPStatus>();
    const today = startOfDay(new Date());
    
    unpaidApplications.forEach(app => {
      const branchName = app.branch_name;
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
        rm_stats: branch.rm_stats.sort((a, b) => b.total - a.total)
      }))
      .sort((a, b) => b.total_stats.total - a.total_stats.total);
  }, [applications]);
};
