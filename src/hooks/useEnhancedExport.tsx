
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Application } from '@/types/application';
import { format } from 'date-fns';
import { formatPtpDate } from '@/utils/formatters';
import { usePlanVsAchievementData } from './usePlanVsAchievementData';

interface ExportData {
  applications: Application[];
}

export const useEnhancedExport = () => {
  const { fetchPlanVsAchievementData } = usePlanVsAchievementData();

  const formatCommentTrail = (comments: Array<{content: string; user_name: string}>) => {
    if (!comments || comments.length === 0) {
      return 'No comments';
    }
    
    return comments
      .map(comment => `${comment.user_name}: ${comment.content}`)
      .join(' | ');
  };

  const exportToExcel = useCallback((applications: Application[], fileName: string = 'applications-export') => {
    const workbook = XLSX.utils.book_new();

    // Create export data with all columns
    const exportData = applications.map(app => ({
      'Applicant ID': app.applicant_id,
      'Branch Name': app.branch_name,
      'RM Name': app.rm_name || app.collection_rm,
      'Dealer Name': app.dealer_name,
      'Applicant Name': app.applicant_name,
      'Applicant Mobile Number': app.applicant_mobile || '',
      'Applicant Current Address': app.applicant_address || '',
      'House Ownership': app.house_ownership || '',
      'Co-Applicant Name': app.co_applicant_name || '',
      'Coapplicant Mobile Number': app.co_applicant_mobile || '',
      'Coapplicant Current Address': app.co_applicant_address || '',
      'Guarantor Name': app.guarantor_name || '',
      'Guarantor Mobile Number': app.guarantor_mobile || '',
      'Guarantor Current Address': app.guarantor_address || '',
      'Reference Name': app.reference_name || '',
      'Reference Mobile Number': app.reference_mobile || '',
      'Reference Address': app.reference_address || '',
      'FI Submission Location': app.fi_location || '',
      'Demand Date': app.demand_date || '',
      'Repayment': app.repayment || '',
      'Principle Due': app.principle_due || 0,
      'Interest Due': app.interest_due || 0,
      'EMI': app.emi_amount,
      'Last Month Bounce': app.last_month_bounce || 0,
      'Lender Name': app.lender_name,
      'Status': app.field_status || 'Unpaid',
      'Team Lead': app.team_lead,
      'PTP Date': formatPtpDate(app.ptp_date),
      'Comment Trail': formatCommentTrail(app.recent_comments || [])
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
      { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 60 }
    ];
    
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

    // Export the file
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    XLSX.writeFile(workbook, `${fileName}-${timestamp}.xlsx`);
  }, []);

  const exportPtpCommentsReport = useCallback((data: ExportData, fileName: string = 'ptp-comments-report') => {
    const workbook = XLSX.utils.book_new();

    // Create export data with only the requested columns
    const exportData = data.applications.map(app => ({
      'Applicant ID': app.applicant_id,
      'Branch Name': app.branch_name,
      'RM Name': app.rm_name || app.collection_rm,
      'Dealer Name': app.dealer_name,
      'Applicant Name': app.applicant_name,
      'PTP Date': formatPtpDate(app.ptp_date),
      'Comment Trail': formatCommentTrail(app.recent_comments || [])
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 20 }, // Applicant ID
      { wch: 20 }, // Branch Name
      { wch: 20 }, // RM Name
      { wch: 25 }, // Dealer Name
      { wch: 25 }, // Applicant Name
      { wch: 15 }, // PTP Date
      { wch: 60 }  // Comment Trail (wider for multiple comments)
    ];
    
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PTP and Comments');

    // Export the file
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    XLSX.writeFile(workbook, `${fileName}-${timestamp}.xlsx`);
  }, []);

  const exportFullReport = useCallback((data: ExportData, fileName: string = 'applications-report') => {
    const workbook = XLSX.utils.book_new();

    // Create export data with all columns (existing full report)
    const exportData = data.applications.map(app => ({
      'Applicant ID': app.applicant_id,
      'Branch Name': app.branch_name,
      'RM Name': app.rm_name || app.collection_rm,
      'Dealer Name': app.dealer_name,
      'Applicant Name': app.applicant_name,
      'Applicant Mobile Number': app.applicant_mobile || '',
      'Applicant Current Address': app.applicant_address || '',
      'House Ownership': app.house_ownership || '',
      'Co-Applicant Name': app.co_applicant_name || '',
      'Coapplicant Mobile Number': app.co_applicant_mobile || '',
      'Coapplicant Current Address': app.co_applicant_address || '',
      'Guarantor Name': app.guarantor_name || '',
      'Guarantor Mobile Number': app.guarantor_mobile || '',
      'Guarantor Current Address': app.guarantor_address || '',
      'Reference Name': app.reference_name || '',
      'Reference Mobile Number': app.reference_mobile || '',
      'Reference Address': app.reference_address || '',
      'FI Submission Location': app.fi_location || '',
      'Demand Date': app.demand_date || '',
      'Repayment': app.repayment || '',
      'Principle Due': app.principle_due || 0,
      'Interest Due': app.interest_due || 0,
      'EMI': app.emi_amount,
      'Last Month Bounce': app.last_month_bounce || 0,
      'Lender Name': app.lender_name,
      'Status': app.field_status || 'Unpaid',
      'Team Lead': app.team_lead
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
      { wch: 12 }, { wch: 20 }
    ];
    
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

    // Export the file
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    XLSX.writeFile(workbook, `${fileName}-${timestamp}.xlsx`);
  }, []);

  const exportPlanVsAchievementReport = useCallback(async (selectedDateTime: Date, fileName: string = 'plan-vs-achievement-report') => {
    try {
      console.log('Starting Plan vs Achievement export for:', selectedDateTime);
      
      const planVsAchievementData = await fetchPlanVsAchievementData(selectedDateTime);
      
      if (planVsAchievementData.length === 0) {
        console.warn('No applications found for the selected date/time');
        return;
      }

      const workbook = XLSX.utils.book_new();

      // Create export data with Plan vs Achievement specific columns
      const exportData = planVsAchievementData.map((app: any) => ({
        'Applicant ID': app.applicant_id,
        'Branch Name': app.branch_name,
        'RM Name': app.rm_name,
        'Collection RM': app.collection_rm || '',
        'Dealer Name': app.dealer_name,
        'Applicant Name': app.applicant_name,
        'PTP Date': formatPtpDate(app.ptp_date),
        'Status on Selected Date': app.status_on_selected_date,
        'Status as of Export': app.current_status,
        'Comment Trail': app.comment_trail
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 20 }, // Applicant ID
        { wch: 20 }, // Branch Name
        { wch: 20 }, // RM Name
        { wch: 20 }, // Collection RM
        { wch: 25 }, // Dealer Name
        { wch: 25 }, // Applicant Name
        { wch: 15 }, // PTP Date
        { wch: 25 }, // Status on Selected Date
        { wch: 25 }, // Status as of Export
        { wch: 60 }  // Comment Trail
      ];
      
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Plan vs Achievement');

      // Export the file with timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
      const selectedDateFormatted = format(selectedDateTime, 'yyyy-MM-dd-HHmm');
      XLSX.writeFile(workbook, `${fileName}-${selectedDateFormatted}-exported-${timestamp}.xlsx`);
      
      console.log('Plan vs Achievement export completed successfully');
    } catch (error) {
      console.error('Error exporting Plan vs Achievement report:', error);
    }
  }, [fetchPlanVsAchievementData]);

  return {
    exportPtpCommentsReport,
    exportFullReport,
    exportPlanVsAchievementReport,
    exportToExcel
  };
};
