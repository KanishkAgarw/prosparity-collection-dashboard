
import { useState, useEffect, useMemo } from "react";
import { formatEmiMonth } from "@/utils/formatters";

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
    lastMonthBounce: []
  });

  // Get the currently filtered applications based on active filters
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const repaymentMatch = filters.repayment.length === 0 || 
        filters.repayment.includes(formatRepayment(app.repayment));
      
      const appLastMonthBounceCategory = categorizeLastMonthBounce(app.last_month_bounce);
      const lastMonthBounceMatch = filters.lastMonthBounce.length === 0 || 
        filters.lastMonthBounce.includes(appLastMonthBounceCategory);

      const emiMonthMatch = filters.emiMonth.length === 0 || 
        filters.emiMonth.includes(formatEmiMonth(app.demand_date));

      return (
        (filters.branch.length === 0 || filters.branch.includes(app.branch_name)) &&
        (filters.teamLead.length === 0 || filters.teamLead.includes(app.team_lead)) &&
        (filters.rm.length === 0 || filters.rm.includes(app.rm_name)) &&
        (filters.dealer.length === 0 || filters.dealer.includes(app.dealer_name)) &&
        (filters.lender.length === 0 || filters.lender.includes(app.lender_name)) &&
        (filters.status.length === 0 || filters.status.includes(app.status)) &&
        emiMonthMatch &&
        repaymentMatch &&
        lastMonthBounceMatch
      );
    });
  }, [applications, filters]);

  // Calculate available options based on currently filtered data
  const availableOptions = useMemo(() => {
    const safeApplications = filteredApplications || [];
    
    // Get unique repayment values and format them
    const repayments = [...new Set(safeApplications
      .map(app => formatRepayment(app.repayment))
      .filter(Boolean))]
      .sort((a, b) => parseInt(a) - parseInt(b));

    // Get unique last month bounce categories
    const lastMonthBounceCategories: LastMonthBounceCategory[] = [...new Set(safeApplications
      .map(app => categorizeLastMonthBounce(app.last_month_bounce)))]
      .sort();
    
    return {
      branches: [...new Set(safeApplications.map(app => app.branch_name).filter(Boolean))],
      teamLeads: [...new Set(safeApplications.map(app => app.team_lead).filter(Boolean))],
      rms: [...new Set(safeApplications.map(app => app.rm_name).filter(Boolean))],
      dealers: [...new Set(safeApplications.map(app => app.dealer_name).filter(Boolean))],
      lenders: [...new Set(safeApplications.map(app => app.lender_name).filter(Boolean))],
      statuses: [...new Set(safeApplications.map(app => app.status).filter(Boolean))],
      emiMonths: [...new Set(safeApplications.map(app => formatEmiMonth(app.demand_date)).filter(Boolean))],
      repayments,
      lastMonthBounce: lastMonthBounceCategories
    };
  }, [filteredApplications]);

  // When available options change, clean up invalid filter selections
  useEffect(() => {
    setFilters(prevFilters => {
      const cleanedFilters = {
        branch: prevFilters.branch.filter(item => availableOptions.branches.includes(item)),
        teamLead: prevFilters.teamLead.filter(item => availableOptions.teamLeads.includes(item)),
        rm: prevFilters.rm.filter(item => availableOptions.rms.includes(item)),
        dealer: prevFilters.dealer.filter(item => availableOptions.dealers.includes(item)),
        lender: prevFilters.lender.filter(item => availableOptions.lenders.includes(item)),
        status: prevFilters.status.filter(item => availableOptions.statuses.includes(item)),
        emiMonth: prevFilters.emiMonth.filter(item => availableOptions.emiMonths.includes(item)),
        repayment: prevFilters.repayment.filter(item => availableOptions.repayments.includes(item)),
        lastMonthBounce: prevFilters.lastMonthBounce.filter(item => availableOptions.lastMonthBounce.includes(item))
      };

      // Only update if there are actual changes
      const hasChanges = Object.keys(cleanedFilters).some(key => 
        cleanedFilters[key as keyof FilterState].length !== prevFilters[key as keyof FilterState].length ||
        !cleanedFilters[key as keyof FilterState].every(item => {
          if (key === 'lastMonthBounce') {
            return prevFilters.lastMonthBounce.includes(item as LastMonthBounceCategory);
          }
          return (prevFilters[key as keyof FilterState] as string[]).includes(item as string);
        })
      );

      return hasChanges ? cleanedFilters : prevFilters;
    });
  }, [availableOptions]);

  const handleFilterChange = (key: keyof FilterState, values: string[]) => {
    if (key === 'lastMonthBounce') {
      // Type-safe handling for lastMonthBounce filter
      const validValues = values.filter(isValidLastMonthBounceCategory);
      setFilters(prev => ({ ...prev, [key]: validValues }));
    } else {
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
