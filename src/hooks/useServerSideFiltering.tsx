
import { useState, useCallback, useMemo } from 'react';
import { FilterState } from '@/types/filters';

export const useServerSideFiltering = () => {
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
    collectionRm: [],
    vehicleStatus: [],
    callingStatus: []
  });

  const handleFilterChange = useCallback((key: string, values: string[]) => {
    console.log('🔄 Server-side filter change:', key, values);
    setFilters(prev => ({
      ...prev,
      [key]: values
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    console.log('🧹 Clearing all filters');
    setFilters({
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
      collectionRm: [],
      vehicleStatus: [],
      callingStatus: []
    });
  }, []);

  // Extract selected EMI Month for context-aware filtering
  const selectedEmiMonth = useMemo(() => {
    if (filters.emiMonth.length === 1) {
      return filters.emiMonth[0];
    }
    return null;
  }, [filters.emiMonth]);

  // Get count of active filters
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters)
      .filter(([key]) => key !== 'emiMonth') // Exclude EMI month from count
      .reduce((count, [, values]) => count + values.length, 0);
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return activeFilterCount > 0;
  }, [activeFilterCount]);

  return {
    filters,
    handleFilterChange,
    clearAllFilters,
    selectedEmiMonth,
    activeFilterCount,
    hasActiveFilters
  };
};
