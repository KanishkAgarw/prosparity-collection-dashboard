
import { useMemo } from 'react';
import { Application } from '@/types/application';
import { isToday, isTomorrow, isBefore, isAfter, startOfDay } from 'date-fns';
import { useFieldStatus } from '@/hooks/useFieldStatus';
import { usePtpDates } from '@/hooks/usePtpDates';
import { supabase } from '@/integrations/supabase/client';
import { getMonthDateRange } from '@/utils/dateUtils';

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

export const useBranchPTPData = (applications: Application[], selectedEmiMonth?: string) => {
  const { fetchFieldStatus } = useFieldStatus();
  const { fetchPtpDates } = usePtpDates();

  return useMemo(async () => {
    if (!selectedEmiMonth) {
      console.log('❌ No selected EMI month for branch PTP data');
      return [];
    }

    // First, get applications that have collection records for the selected month
    // This matches the logic used in useStatusCounts
    const { start, end } = getMonthDateRange(selectedEmiMonth);
    
    const { data: collectionData, error } = await supabase
      .from('collection')
      .select(`
        application_id,
        applications!inner(*)
      `)
      .gte('demand_date', start)
      .lte('demand_date', end);

    if (error) {
      console.error('Error fetching collection data for branch PTP analysis:', error);
      return [];
    }

    if (!collectionData || collectionData.length === 0) {
      console.log('No collection data found for month:', selectedEmiMonth);
      return [];
    }

    // Get application IDs that have collection records for this month
    const monthApplicationIds = collectionData.map(record => record.application_id);
    console.log(`Found ${monthApplicationIds.length} applications with collection records for ${selectedEmiMonth}`);
    
    // Fetch month-specific field status for only these applications
    const statusMap = await fetchFieldStatus(monthApplicationIds, selectedEmiMonth);
    
    // Fetch PTP dates for these applications
    const ptpDatesMap = await fetchPtpDates(monthApplicationIds);

    // Filter applications that are not "Paid" for the selected month
    const unpaidApplications = collectionData.filter(record => {
      const fieldStatus = statusMap[record.application_id] || 'Unpaid';
      return fieldStatus !== 'Paid';
    });
    
    console.log('PTP Data - Applications with collection records:', collectionData.length);
    console.log('PTP Data - Unpaid applications (excluding Paid for selected month):', unpaidApplications.length);
    
    const branchMap = new Map<string, BranchPTPStatus>();
    const today = startOfDay(new Date());
    
    unpaidApplications.forEach(record => {
      const app = record.applications;
      const branchName = app?.branch_name || 'Unknown Branch';
      const rmName = app?.collection_rm || app?.rm_name || 'Unknown RM';
      
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
      
      if (!ptpDatesMap[record.application_id]) {
        rmStats.no_ptp_set++;
        branch.total_stats.no_ptp_set++;
      } else {
        try {
          const ptpDate = new Date(ptpDatesMap[record.application_id]);
          
          if (isToday(ptpDate)) {
            rmStats.today++;
            branch.total_stats.today++;
          } else if (isTomorrow(ptpDate)) {
            rmStats.tomorrow++;
            branch.total_stats.tomorrow++;
          } else if (isBefore(ptpDate, today)) {
            rmStats.overdue++;
            branch.total_stats.overdue++;
          } else if (isAfter(ptpDate, today) && !isTomorrow(ptpDate)) {
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
    
    const result = Array.from(branchMap.values())
      .map(branch => ({
        ...branch,
        rm_stats: branch.rm_stats.sort((a, b) => b.total - a.total)
      }))
      .sort((a, b) => b.total_stats.total - a.total_stats.total);
      
    console.log('PTP Analytics Result:', result);
    
    return result;
  }, [applications, selectedEmiMonth, fetchFieldStatus, fetchPtpDates]);
};
