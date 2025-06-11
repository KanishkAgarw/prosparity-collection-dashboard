import { useState, useMemo } from 'react';
import { Application } from '@/types/application';
import { FilterState, AvailableOptions } from '@/types/filters';
import { filterApplications, getAvailableOptions } from '@/utils/filterLogic';

export const useCascadingFilters = (applications: Application[]) => {
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

  const filteredApplications = useMemo(() => {
    return filterApplications(applications, filters);
  }, [applications, filters]);

  const availableOptions = useMemo<AvailableOptions>(() => {
    return getAvailableOptions(applications, filteredApplications);
  }, [applications, filteredApplications]);

  const handleFilterChange = (key: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: values
    }));
  };

  const clearAllFilters = () => {
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
      collectionRm: []
    });
  };

  return {
    filters,
    filteredApplications,
    availableOptions,
    handleFilterChange,
    clearAllFilters
  };
};
