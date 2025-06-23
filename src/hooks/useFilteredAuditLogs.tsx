
import { useMemo } from 'react';
import { AuditLog } from '@/hooks/useAuditLogs';

export const useFilteredAuditLogs = (auditLogs: AuditLog[]) => {
  return useMemo(() => {
    console.log('=== FILTERING AUDIT LOGS ===');
    console.log('Total audit logs received:', auditLogs.length);
    
    // Filter to include Status and PTP Date changes
    const statusRelatedLogs = auditLogs.filter(log => {
      const isStatusField = log.field === 'Status';
      const isPtpField = log.field === 'PTP Date';
      const isAmountCollected = log.field === 'Amount Collected';
      
      console.log(`Log ${log.id}: field="${log.field}" -> include=${isStatusField || isPtpField || isAmountCollected}`);
      
      return isStatusField || isPtpField || isAmountCollected;
    });
    console.log('Filtered status-related logs:', statusRelatedLogs.length);
    console.log('Status-related logs:', statusRelatedLogs.map(log => ({ 
      id: log.id, 
      field: log.field, 
      previous: log.previous_value, 
      new: log.new_value,
      created_at: log.created_at
    })));
    
    return statusRelatedLogs;
  }, [auditLogs]);
};
