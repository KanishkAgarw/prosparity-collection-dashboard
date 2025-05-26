
export interface Application {
  applicationId: string;
  applicantName: string;
  branch: string;
  teamLead: string;
  rm: string;
  dealer: string;
  lender: string;
  status: string;
  emiDue: number;
  amountPaid: number;
  paidDate: string;
  ptpDate: string;
  demandMonth: string;
  auditLogs: AuditLog[];
}

export interface AuditLog {
  id: number;
  timestamp: Date;
  user: string;
  field: string;
  previousValue: string;
  newValue: string;
  applicationId: string;
}

export interface FilterOptions {
  branches: string[];
  teamLeads: string[];
  dealers: string[];
  lenders: string[];
  statuses: string[];
  emiMonths: string[];
}
