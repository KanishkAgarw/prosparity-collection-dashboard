
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Application } from '@/hooks/useApplications';
import { Comment } from '@/hooks/useComments';
import { AuditLog } from '@/hooks/useAuditLogs';
import { CallingLog } from '@/hooks/useCallingLogs';
import { format } from 'date-fns';

interface ExportData {
  applications: Application[];
  comments: Comment[];
  auditLogs: AuditLog[];
  callingLogs: CallingLog[];
}

export const useExport = () => {
  const exportToExcel = useCallback((data: ExportData, fileName: string = 'collection-report') => {
    const workbook = XLSX.utils.book_new();

    // Applications Summary Sheet
    const applicationsData = data.applications.map(app => ({
      'Application ID': app.applicant_id,
      'Applicant Name': app.applicant_name,
      'Mobile': app.applicant_mobile || 'N/A',
      'Branch': app.branch_name,
      'RM Name': app.rm_name,
      'Team Lead': app.team_lead,
      'Dealer': app.dealer_name,
      'Lender': app.lender_name,
      'Status': app.status,
      'EMI Amount': app.emi_amount,
      'Principal Due': app.principle_due,
      'Interest Due': app.interest_due,
      'PTP Date': app.ptp_date ? format(new Date(app.ptp_date), 'dd-MMM-yy') : 'Not Set',
      'Applicant Status': app.applicant_calling_status || 'Not Called',
      'Co-Applicant Status': app.co_applicant_calling_status || 'Not Called',
      'Guarantor Status': app.guarantor_calling_status || 'Not Called',
      'Reference Status': app.reference_calling_status || 'Not Called',
      'Latest Call Status': app.latest_calling_status || 'No Calls',
      'Created Date': format(new Date(app.created_at), 'dd-MMM-yy HH:mm'),
      'Last Updated': format(new Date(app.updated_at), 'dd-MMM-yy HH:mm')
    }));

    const applicationsSheet = XLSX.utils.json_to_sheet(applicationsData);
    XLSX.utils.book_append_sheet(workbook, applicationsSheet, 'Applications Summary');

    // Status Changes Sheet
    const statusChanges = data.auditLogs.map(log => ({
      'Application ID': log.application_id,
      'Field Changed': log.field,
      'Previous Value': log.previous_value || 'Not Set',
      'New Value': log.new_value || 'Not Set',
      'Changed By': log.user_name || 'Unknown User',
      'Change Date': format(new Date(log.created_at), 'dd-MMM-yy HH:mm')
    }));

    const statusSheet = XLSX.utils.json_to_sheet(statusChanges);
    XLSX.utils.book_append_sheet(workbook, statusSheet, 'Status Changes');

    // Calling Logs Sheet
    const callingData = data.callingLogs.map(log => ({
      'Application ID': log.application_id,
      'Contact Type': log.contact_type,
      'Previous Status': log.previous_status || 'Not Called',
      'New Status': log.new_status,
      'Called By': log.user_name || 'Unknown User',
      'Call Date': format(new Date(log.created_at), 'dd-MMM-yy HH:mm')
    }));

    const callingSheet = XLSX.utils.json_to_sheet(callingData);
    XLSX.utils.book_append_sheet(workbook, callingSheet, 'Calling Logs');

    // Comments Sheet
    const commentsData = data.comments.map(comment => ({
      'Application ID': comment.application_id,
      'Comment': comment.content,
      'Added By': comment.user_name || 'Unknown User',
      'Date Added': format(new Date(comment.created_at), 'dd-MMM-yy HH:mm')
    }));

    const commentsSheet = XLSX.utils.json_to_sheet(commentsData);
    XLSX.utils.book_append_sheet(workbook, commentsSheet, 'Comments');

    // Export the file
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    XLSX.writeFile(workbook, `${fileName}-${timestamp}.xlsx`);
  }, []);

  const exportToCSV = useCallback((data: ExportData, fileName: string = 'collection-report') => {
    // For CSV, we'll export just the applications summary
    const csvData = data.applications.map(app => ({
      'Application ID': app.applicant_id,
      'Applicant Name': app.applicant_name,
      'Mobile': app.applicant_mobile || 'N/A',
      'Status': app.status,
      'EMI Amount': app.emi_amount,
      'PTP Date': app.ptp_date ? format(new Date(app.ptp_date), 'dd-MMM-yy') : 'Not Set',
      'Latest Call Status': app.latest_calling_status || 'No Calls',
      'Last Updated': format(new Date(app.updated_at), 'dd-MMM-yy HH:mm')
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    XLSX.writeFile(workbook, `${fileName}-${timestamp}.csv`);
  }, []);

  return {
    exportToExcel,
    exportToCSV
  };
};
