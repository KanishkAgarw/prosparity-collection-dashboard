
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

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
        (filters.branch.length === 0 || filters.branch.includes(app.branch)) &&
        (filters.teamLead.length === 0 || filters.teamLead.includes(app.teamLead)) &&
        (filters.dealer.length === 0 || filters.dealer.includes(app.dealer)) &&
        (filters.lender.length === 0 || filters.lender.includes(app.lender)) &&
        (filters.status.length === 0 || filters.status.includes(app.status)) &&
        (filters.emiMonth.length === 0 || filters.emiMonth.includes(app.demandMonth))
      );
    });
  }, [applications, filters]);

  // Calculate available options based on currently filtered data
  const availableOptions = useMemo(() => {
    const safeApplications = filteredApplications || [];
    
    return {
      branches: [...new Set(safeApplications.map(app => app.branch).filter(Boolean))],
      teamLeads: [...new Set(safeApplications.map(app => app.teamLead).filter(Boolean))],
      dealers: [...new Set(safeApplications.map(app => app.dealer).filter(Boolean))],
      lenders: [...new Set(safeApplications.map(app => app.lender).filter(Boolean))],
      statuses: [...new Set(safeApplications.map(app => app.status).filter(Boolean))],
      emiMonths: [...new Set(safeApplications.map(app => app.demandMonth).filter(Boolean))]
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
