
import { useState, useMemo } from "react";
import { calculateAvailableOptions } from "@/utils/filterUtils";
import { filterApplications, processFilterChange } from "@/utils/filterLogic";
import { getPtpDateCategoryLabel, type PtpDateCategory } from "@/utils/ptpDateUtils";
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
    ptpDate: [],
    collectionRm: []
  });

  // Get the currently filtered applications based on active filters
  const filteredApplications = useMemo(() => {
    return filterApplications(applications, filters);
  }, [applications, filters]);

  // Calculate available options based on ORIGINAL applications data (not filtered)
  // This ensures all options remain selectable regardless of current filter state
  const availableOptions = useMemo(() => {
    return calculateAvailableOptions(applications);
  }, [applications]);

  const handleFilterChange = (key: keyof FilterState, values: string[]) => {
    console.log('=== CASCADING FILTER CHANGE ===');
    console.log(`Filter key: ${key}`);
    console.log('Raw values:', values);
    
    // For PTP date, we need to convert labels to categories before processing
    if (key === 'ptpDate') {
      // Log the current filter state for debugging
      console.log('Current PTP date filter:', filters.ptpDate);
      console.log('Current filter state:', filters);
    }
    
    processFilterChange(key, values, setFilters);
  };

  // Convert internal PTP date categories back to labels for display
  const displayFilters = useMemo(() => {
    return {
      ...filters,
      ptpDate: filters.ptpDate.map(category => getPtpDateCategoryLabel(category))
    };
  }, [filters]);

  return {
    filters: displayFilters, // Return display-friendly filters
    filteredApplications,
    availableOptions,
    handleFilterChange
  };
}
