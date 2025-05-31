
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Application } from '@/types/application';
import { format } from 'date-fns';
import { formatPtpDate, formatCurrency } from '@/utils/formatters';

interface ExportData {
  applications: Application[];
}

export const useExport = () => {
  const exportToExcel = useCallback((data: ExportData, fileName: string = 'collection-report') => {
    const workbook = XLSX.utils.book_new();

    // Create actionable monitoring format
    const monitoringData = data.applications.map(app => ({
      'Application ID': app.applicant_id,
      'Applicant Name': app.applicant_name,
      'Mobile': app.applicant_mobile || 'N/A',
      'EMI Amount': formatCurrency(app.emi_amount),
      'Status': app.status,
      'PTP Date': formatPtpDate(app.ptp_date),
      'Call Status - Applicant': app.applicant_calling_status || 'Not Called',
      'Call Status - Co-Applicant': app.co_applicant_calling_status || 'Not Called',
      'Call Status - Guarantor': app.guarantor_calling_status || 'Not Called',
      'Call Status - Reference': app.reference_calling_status || 'Not Called',
      'Overall Call Status': app.latest_calling_status || 'No Calls',
      'Recent Comment 1': app.recent_comments?.[0]?.content || '',
      'Recent Comment 2': app.recent_comments?.[1]?.content || '',
      'Recent Comment 3': app.recent_comments?.[2]?.content || '',
      'Branch': app.branch_name,
      'RM Name': app.rm_name,
      'Team Lead': app.team_lead,
      'Dealer': app.dealer_name,
      'Lender': app.lender_name,
      'Last Updated': format(new Date(app.updated_at), 'dd-MMM-yy HH:mm')
    }));

    const monitoringSheet = XLSX.utils.json_to_sheet(monitoringData);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 20 }, // Application ID
      { wch: 25 }, // Applicant Name
      { wch: 15 }, // Mobile
      { wch: 12 }, // EMI Amount
      { wch: 12 }, // Status
      { wch: 12 }, // PTP Date
      { wch: 18 }, // Call Status - Applicant
      { wch: 18 }, // Call Status - Co-Applicant
      { wch: 18 }, // Call Status - Guarantor
      { wch: 18 }, // Call Status - Reference
      { wch: 15 }, // Overall Call Status
      { wch: 30 }, // Recent Comment 1
      { wch: 30 }, // Recent Comment 2
      { wch: 30 }, // Recent Comment 3
      { wch: 15 }, // Branch
      { wch: 20 }, // RM Name
      { wch: 20 }, // Team Lead
      { wch: 25 }, // Dealer
      { wch: 25 }, // Lender
      { wch: 18 }  // Last Updated
    ];
    
    monitoringSheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, monitoringSheet, 'Collection Monitoring');

    // Export the file
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    XLSX.writeFile(workbook, `${fileName}-${timestamp}.xlsx`);
  }, []);

  const exportToCSV = useCallback((data: ExportData, fileName: string = 'collection-report') => {
    // For CSV, create a simplified version
    const csvData = data.applications.map(app => ({
      'Application ID': app.applicant_id,
      'Applicant Name': app.applicant_name,
      'Mobile': app.applicant_mobile || 'N/A',
      'EMI Amount': formatCurrency(app.emi_amount),
      'Status': app.status,
      'PTP Date': formatPtpDate(app.ptp_date),
      'Overall Call Status': app.latest_calling_status || 'No Calls',
      'Recent Comment': app.recent_comments?.[0]?.content || 'No Comments',
      'Last Updated': format(new Date(app.updated_at), 'dd-MMM-yy HH:mm')
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Collection Summary');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    XLSX.writeFile(workbook, `${fileName}-${timestamp}.csv`);
  }, []);

  return {
    exportToExcel,
    exportToCSV
  };
};
