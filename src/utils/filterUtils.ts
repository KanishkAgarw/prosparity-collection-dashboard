
import { formatEmiMonth } from "@/utils/formatters";
import { categorizePtpDate, getPtpDateCategoryLabel, type PtpDateCategory } from "@/utils/ptpDateUtils";
import type { LastMonthBounceCategory, AvailableOptions } from "@/types/filters";

// Helper function to format repayment values
export const formatRepayment = (repayment: string | undefined) => {
  if (!repayment) return '';
  // Convert "1st" to "1", "2nd" to "2", etc.
  return repayment.replace(/(\d+)(st|nd|rd|th)/, '$1');
};

// Helper function to categorize last month bounce
export const categorizeLastMonthBounce = (bounce: number | null | undefined): LastMonthBounceCategory => {
  if (bounce === null || bounce === undefined) return 'Not paid';
  if (bounce === 0) return 'Paid on time';
  if (bounce >= 1 && bounce <= 5) return '1-5 days late';
  if (bounce >= 6 && bounce <= 15) return '6-15 days late';
  if (bounce > 15) return '15+ days late';
  return 'Not paid';
};

// Type guard to check if a string is a valid LastMonthBounceCategory
export const isValidLastMonthBounceCategory = (value: string): value is LastMonthBounceCategory => {
  const validCategories: LastMonthBounceCategory[] = [
    'Not paid', 
    'Paid on time', 
    '1-5 days late', 
    '6-15 days late', 
    '15+ days late'
  ];
  return validCategories.includes(value as LastMonthBounceCategory);
};

// Type guard to check if a string is a valid PtpDateCategory
export const isValidPtpDateCategory = (value: string): value is PtpDateCategory => {
  const validCategories: PtpDateCategory[] = ['today', 'overdue', 'upcoming', 'no_date'];
  return validCategories.includes(value as PtpDateCategory);
};

// Calculate available options from applications
export const calculateAvailableOptions = (applications: any[]): AvailableOptions => {
  const safeApplications = applications || [];
  
  console.log('=== CALCULATING AVAILABLE OPTIONS ===');
  console.log('Using original applications:', safeApplications.length);
  
  // Get unique repayment values and format them
  const repayments = [...new Set(safeApplications
    .map(app => formatRepayment(app.repayment))
    .filter(Boolean))]
    .sort((a, b) => parseInt(a) - parseInt(b));

  // Get unique last month bounce categories
  const lastMonthBounceCategories: LastMonthBounceCategory[] = [...new Set(safeApplications
    .map(app => categorizeLastMonthBounce(app.last_month_bounce)))]
    .sort();

  // Get PTP date categories with labels - now only 4 categories
  const ptpDateCategories = [...new Set(safeApplications
    .map(app => categorizePtpDate(app.ptp_date)))]
    .sort((a, b) => {
      // Sort in priority order: today, overdue, upcoming, no_date
      const order = ['today', 'overdue', 'upcoming', 'no_date'];
      return order.indexOf(a) - order.indexOf(b);
    });

  const ptpDateOptions = ptpDateCategories.map(category => getPtpDateCategoryLabel(category));
  
  const options = {
    branches: [...new Set(safeApplications.map(app => app.branch_name).filter(Boolean))],
    teamLeads: [...new Set(safeApplications.map(app => app.team_lead).filter(Boolean))],
    rms: [...new Set(safeApplications.map(app => app.rm_name).filter(Boolean))],
    dealers: [...new Set(safeApplications.map(app => app.dealer_name).filter(Boolean))],
    lenders: [...new Set(safeApplications.map(app => app.lender_name).filter(Boolean))],
    statuses: [...new Set(safeApplications.map(app => app.field_status || 'Unpaid').filter(Boolean))],
    emiMonths: [...new Set(safeApplications.map(app => formatEmiMonth(app.demand_date)).filter(Boolean))],
    repayments,
    lastMonthBounce: lastMonthBounceCategories,
    ptpDateOptions,
    collectionRms: [...new Set(safeApplications.map(app => app.collection_rm).filter(Boolean))]
  };
  
  console.log('Available options calculated:', {
    branches: options.branches.length,
    teamLeads: options.teamLeads.length,
    rms: options.rms.length,
    dealers: options.dealers.length,
    lenders: options.lenders.length,
    ptpDateOptions: options.ptpDateOptions,
    collectionRms: options.collectionRms.length
  });
  
  return options;
};
