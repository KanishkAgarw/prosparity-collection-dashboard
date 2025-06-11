
import { Application } from "@/types/application";
import { FilterState } from "@/types/filters";
import { getPtpDateCategory } from "@/utils/ptpDateUtils";

// Function to filter applications based on filter state
export function filterApplications(applications: Application[], filters: FilterState): Application[] {
  return applications.filter(app => {
    // Branch filter
    if (filters.branch.length > 0 && !filters.branch.includes(app.branch_name)) {
      return false;
    }

    // Team Lead filter
    if (filters.teamLead.length > 0 && !filters.teamLead.includes(app.team_lead)) {
      return false;
    }

    // RM filter
    if (filters.rm.length > 0 && !filters.rm.includes(app.rm_name)) {
      return false;
    }

    // Dealer filter
    if (filters.dealer.length > 0 && !filters.dealer.includes(app.dealer_name)) {
      return false;
    }

    // Lender filter
    if (filters.lender.length > 0 && !filters.lender.includes(app.lender_name)) {
      return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(app.field_status || 'Unpaid')) {
      return false;
    }

    // EMI Month filter
    if (filters.emiMonth.length > 0) {
      const emiAmount = app.emi_amount;
      const matchesEmiRange = filters.emiMonth.some(range => {
        const [min, max] = range.split(' - ').map(val => parseInt(val.replace(/,/g, '')));
        return emiAmount >= min && emiAmount <= max;
      });
      if (!matchesEmiRange) {
        return false;
      }
    }

    // Repayment filter
    if (filters.repayment.length > 0 && app.repayment && !filters.repayment.includes(app.repayment)) {
      return false;
    }

    // Last Month Bounce filter
    if (filters.lastMonthBounce.length > 0) {
      const bounce = (app.last_month_bounce || 0).toString();
      if (!filters.lastMonthBounce.includes(bounce)) {
        return false;
      }
    }

    // Collection RM filter
    if (filters.collectionRM.length > 0 && app.collection_rm && !filters.collectionRM.includes(app.collection_rm)) {
      return false;
    }

    // PTP Date filter
    if (filters.ptpDate.length > 0) {
      if (!app.ptp_date) {
        return false;
      }
      
      const ptpCategory = getPtpDateCategory(app.ptp_date);
      if (!filters.ptpDate.includes(ptpCategory)) {
        return false;
      }
    }

    return true;
  });
}

// Function to process filter changes and update state
export function processFilterChange(
  key: keyof FilterState,
  values: string[],
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
) {
  console.log(`Processing filter change for ${key}:`, values);
  
  setFilters(prevFilters => {
    const newFilters = {
      ...prevFilters,
      [key]: values
    };
    
    console.log('Updated filter state:', newFilters);
    return newFilters;
  });
}
