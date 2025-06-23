import { useState, useMemo } from 'react';
import { Application } from '@/types/application';
import { FilterState, AvailableOptions } from '@/types/filters';
import { filterApplications, getAvailableOptions } from '@/utils/filterLogic';
import { VEHICLE_STATUS_OPTIONS } from '@/constants/options';

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
    collectionRm: [],
    vehicleStatus: []
  });

  const filteredApplications = useMemo(() => {
    return filterApplications(applications, filters);
  }, [applications, filters]);

  const availableOptions = useMemo<AvailableOptions>(() => {
    const dynamicOptions = getAvailableOptions(applications, filteredApplications);
    return {
      ...dynamicOptions,
      vehicleStatusOptions: VEHICLE_STATUS_OPTIONS.map(opt => opt.value)
    };
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
      collectionRm: [],
      vehicleStatus: []
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
