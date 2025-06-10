
import { useState, useEffect, useMemo } from "react";
import { formatEmiMonth } from "@/utils/formatters";
import { categorizePtpDate, getPtpDateCategoryLabel, type PtpDateCategory } from "@/utils/ptpDateUtils";

interface CascadingFiltersProps {
  applications: any[];
}

type LastMonthBounceCategory = 'Not paid' | 'Paid on time' | '1-5 days late' | '6-15 days late' | '15+ days late';

interface FilterState {
  branch: string[];
  teamLead: string[];
  rm: string[];
  dealer: string[];
  lender: string[];
  status: string[];
  emiMonth: string[];
  repayment: string[];
  lastMonthBounce: LastMonthBounceCategory[];
  ptpDate: PtpDateCategory[];
}

// Helper function to format repayment values
const formatRepayment = (repayment: string | undefined) => {
  if (!repayment) return '';
  // Convert "1st" to "1", "2nd" to "2", etc.
  return repayment.replace(/(\d+)(st|nd|rd|th)/, '$1');
};

// Helper function to categorize last month bounce
const categorizeLastMonthBounce = (bounce: number | null | undefined): LastMonthBounceCategory => {
  if (bounce === null || bounce === undefined) return 'Not paid';
  if (bounce === 0) return 'Paid on time';
  if (bounce >= 1 && bounce <= 5) return '1-5 days late';
  if (bounce >= 6 && bounce <= 15) return '6-15 days late';
  if (bounce > 15) return '15+ days late';
  return 'Not paid';
};

// Type guard to check if a string is a valid LastMonthBounceCategory
const isValidLastMonthBounceCategory = (value: string): value is LastMonthBounceCategory => {
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
const isValidPtpDateCategory = (value: string): value is PtpDateCategory => {
  const validCategories: PtpDateCategory[] = ['today', 'overdue', 'upcoming', 'future', 'no_date'];
  return validCategories.includes(value as PtpDateCategory);
};

export function useCascadingFilters({ applications }: CascadingFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    branch: [],
    teamLead: [],
    rm: [],
    dealer: [],
    lender: [],
    status: [],
    emiMonth: [],
    repayment: [],
    lastMonthBounce: [],
    ptpDate: []
  });

  // Get the currently filtered applications based on active filters
  const filteredApplications = useMemo(() => {
    console.log('=== FILTERING APPLICATIONS ===');
    console.log('Total applications:', applications.length);
    console.log('Active filters:', filters);
    
    const result = applications.filter(app => {
      const repaymentMatch = filters.repayment.length === 0 || 
        filters.repayment.includes(formatRepayment(app.repayment));
      
      const appLastMonthBounceCategory = categorizeLastMonthBounce(app.last_month_bounce);
      const lastMonthBounceMatch = filters.lastMonthBounce.length === 0 || 
        filters.lastMonthBounce.includes(appLastMonthBounceCategory);

      const emiMonthMatch = filters.emiMonth.length === 0 || 
        filters.emiMonth.includes(formatEmiMonth(app.demand_date));

      const statusMatch = filters.status.length === 0 || 
        filters.status.includes(app.field_status || 'Unpaid');

      const appPtpDateCategory = categorizePtpDate(app.ptp_date);
      const ptpDateMatch = filters.ptpDate.length === 0 || 
        filters.ptpDate.includes(appPtpDateCategory);

      const branchMatch = filters.branch.length === 0 || filters.branch.includes(app.branch_name);
      const teamLeadMatch = filters.teamLead.length === 0 || filters.teamLead.includes(app.team_lead);
      const rmMatch = filters.rm.length === 0 || filters.rm.includes(app.rm_name);
      const dealerMatch = filters.dealer.length === 0 || filters.dealer.includes(app.dealer_name);
      const lenderMatch = filters.lender.length === 0 || filters.lender.includes(app.lender_name);

      return branchMatch && teamLeadMatch && rmMatch && dealerMatch && 
             lenderMatch && statusMatch && emiMonthMatch && repaymentMatch && 
             lastMonthBounceMatch && ptpDateMatch;
    });
    
    console.log('Filtered applications:', result.length);
    return result;
  }, [applications, filters]);

  // Calculate available options based on ORIGINAL applications data (not filtered)
  // This ensures all options remain selectable regardless of current filter state
  const availableOptions = useMemo(() => {
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
      ptpDateOptions
    };
    
    console.log('Available options calculated:', {
      branches: options.branches.length,
      teamLeads: options.teamLeads.length,
      rms: options.rms.length,
      dealers: options.dealers.length,
      lenders: options.lenders.length,
      ptpDateOptions: options.ptpDateOptions
    });
    
    return options;
  }, [applications]); // Changed dependency from filteredApplications to applications

  const handleFilterChange = (key: keyof FilterState, values: string[]) => {
    console.log('=== FILTER CHANGE ===');
    console.log(`Changing ${key} filter to:`, values);
    
    if (key === 'lastMonthBounce') {
      // Type-safe handling for lastMonthBounce filter
      const validValues = values.filter(isValidLastMonthBounceCategory);
      console.log('Valid lastMonthBounce values:', validValues);
      setFilters(prev => ({ ...prev, [key]: validValues }));
    } else if (key === 'ptpDate') {
      // Convert labels back to categories for PTP date filter - updated for 4 options
      const labelToCategoryMap: { [key: string]: PtpDateCategory } = {
        "Today's PTP": 'today',
        "Overdue PTP": 'overdue',
        "Upcoming PTPs": 'upcoming',
        "No PTP set": 'no_date'
      };
      
      const validCategories = values
        .map(label => labelToCategoryMap[label])
        .filter((category): category is PtpDateCategory => 
          category !== undefined && isValidPtpDateCategory(category)
        );
      
      console.log('PTP Date - Labels:', values);
      console.log('PTP Date - Categories:', validCategories);
      setFilters(prev => ({ ...prev, [key]: validCategories }));
    } else {
      console.log(`Setting ${key} to:`, values);
      setFilters(prev => ({ ...prev, [key]: values }));
    }
  };

  return {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  };
}
