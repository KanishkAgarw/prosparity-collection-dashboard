
import { useState, useEffect, useMemo } from "react";
import { formatEmiMonth } from "@/utils/formatters";

interface CascadingFiltersProps {
  applications: any[];
}

interface FilterState {
  branch: string[];
  teamLead: string[];
  dealer: string[];
  lender: string[];
  status: string[];
  emiMonth: string[];
}

export function useCascadingFilters({ applications }: CascadingFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    branch: [],
    teamLead: [],
    dealer: [],
    lender: [],
    status: [],
    emiMonth: []
  });

  // Get the currently filtered applications based on active filters
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      return (
        (filters.branch.length === 0 || filters.branch.includes(app.branch_name)) &&
        (filters.teamLead.length === 0 || filters.teamLead.includes(app.team_lead)) &&
        (filters.dealer.length === 0 || filters.dealer.includes(app.dealer_name)) &&
        (filters.lender.length === 0 || filters.lender.includes(app.lender_name)) &&
        (filters.status.length === 0 || filters.status.includes(app.status)) &&
        (filters.emiMonth.length === 0 || filters.emiMonth.includes(formatEmiMonth(app.demand_date)))
      );
    });
  }, [applications, filters]);

  // Calculate available options based on currently filtered data
  const availableOptions = useMemo(() => {
    const safeApplications = filteredApplications || [];
    
    return {
      branches: [...new Set(safeApplications.map(app => app.branch_name).filter(Boolean))],
      teamLeads: [...new Set(safeApplications.map(app => app.team_lead).filter(Boolean))],
      dealers: [...new Set(safeApplications.map(app => app.dealer_name).filter(Boolean))],
      lenders: [...new Set(safeApplications.map(app => app.lender_name).filter(Boolean))],
      statuses: [...new Set(safeApplications.map(app => app.status).filter(Boolean))],
      emiMonths: [...new Set(safeApplications.map(app => formatEmiMonth(app.demand_date)).filter(Boolean))]
    };
  }, [filteredApplications]);

  // When available options change, clean up invalid filter selections
  useEffect(() => {
    setFilters(prevFilters => {
      const cleanedFilters = {
        branch: prevFilters.branch.filter(item => availableOptions.branches.includes(item)),
        teamLead: prevFilters.teamLead.filter(item => availableOptions.teamLeads.includes(item)),
        dealer: prevFilters.dealer.filter(item => availableOptions.dealers.includes(item)),
        lender: prevFilters.lender.filter(item => availableOptions.lenders.includes(item)),
        status: prevFilters.status.filter(item => availableOptions.statuses.includes(item)),
        emiMonth: prevFilters.emiMonth.filter(item => availableOptions.emiMonths.includes(item))
      };

      // Only update if there are actual changes
      const hasChanges = Object.keys(cleanedFilters).some(key => 
        cleanedFilters[key as keyof FilterState].length !== prevFilters[key as keyof FilterState].length ||
        !cleanedFilters[key as keyof FilterState].every(item => prevFilters[key as keyof FilterState].includes(item))
      );

      return hasChanges ? cleanedFilters : prevFilters;
    });
  }, [availableOptions]);

  const handleFilterChange = (key: keyof FilterState, values: string[]) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  };

  return {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  };
}
