
import { useState, useMemo } from "react";
import { calculateAvailableOptions } from "@/utils/filterUtils";
import { filterApplications, processFilterChange } from "@/utils/filterLogic";
import type { FilterState } from "@/types/filters";

interface CascadingFiltersProps {
  applications: any[];
}

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
    return filterApplications(applications, filters);
  }, [applications, filters]);

  // Calculate available options based on ORIGINAL applications data (not filtered)
  // This ensures all options remain selectable regardless of current filter state
  const availableOptions = useMemo(() => {
    return calculateAvailableOptions(applications);
  }, [applications]); // Changed dependency from filteredApplications to applications

  const handleFilterChange = (key: keyof FilterState, values: string[]) => {
    processFilterChange(key, values, setFilters);
  };

  return {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange
  };
}
