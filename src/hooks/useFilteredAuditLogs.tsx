
import { useMemo } from 'react';
import { AuditLog } from '@/hooks/useAuditLogs';

export const useFilteredAuditLogs = (auditLogs: AuditLog[]) => {
  // Filter out calling status changes from audit logs
  const statusOnlyLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Exclude calling status related fields
      const callingStatusFields = [
        'applicant calling status',
        'co_applicant calling status', 
        'guarantor calling status',
        'reference calling status',
        'Applicant Calling Status',
        'Co_applicant Calling Status',
        'Guarantor Calling Status', 
        'Reference Calling Status'
      ];
      
      return !callingStatusFields.some(field => 
        log.field.toLowerCase().includes(field.toLowerCase())
      );
    });
  }, [auditLogs]);

  return statusOnlyLogs;
};
