
import { useState } from "react";
import MultiSelectFilter from "./MultiSelectFilter";

interface FilterBarProps {
  filters: {
    branch: string[];
    teamLead: string[];
    dealer: string[];
    lender: string[];
    status: string[];
    emiMonth: string[];
  };
  onFilterChange: (key: string, values: string[]) => void;
  filterOptions: {
    branches: string[];
    teamLeads: string[];
    dealers: string[];
    lenders: string[];
    statuses: string[];
    emiMonths: string[];
  };
}

const FilterBar = ({ filters, onFilterChange, filterOptions }: FilterBarProps) => {
  // Ensure all filter options have default empty arrays
  const safeFilterOptions = {
    branches: filterOptions?.branches || [],
    teamLeads: filterOptions?.teamLeads || [],
    dealers: filterOptions?.dealers || [],
    lenders: filterOptions?.lenders || [],
    statuses: filterOptions?.statuses || [],
    emiMonths: filterOptions?.emiMonths || [],
  };

  // Ensure all filters have default empty arrays
  const safeFilters = {
    branch: filters?.branch || [],
    teamLead: filters?.teamLead || [],
    dealer: filters?.dealer || [],
    lender: filters?.lender || [],
    status: filters?.status || [],
    emiMonth: filters?.emiMonth || [],
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="relative">
        <MultiSelectFilter
          label="EMI Months"
          options={safeFilterOptions.emiMonths}
          selected={safeFilters.emiMonth}
          onSelectionChange={(values) => onFilterChange('emiMonth', values)}
        />
      </div>

      <div className="relative">
        <MultiSelectFilter
          label="Branches"
          options={safeFilterOptions.branches}
          selected={safeFilters.branch}
          onSelectionChange={(values) => onFilterChange('branch', values)}
        />
      </div>

      <div className="relative">
        <MultiSelectFilter
          label="Team Leads"
          options={safeFilterOptions.teamLeads}
          selected={safeFilters.teamLead}
          onSelectionChange={(values) => onFilterChange('teamLead', values)}
        />
      </div>

      <div className="relative">
        <MultiSelectFilter
          label="Dealers"
          options={safeFilterOptions.dealers}
          selected={safeFilters.dealer}
          onSelectionChange={(values) => onFilterChange('dealer', values)}
        />
      </div>

      <div className="relative">
        <MultiSelectFilter
          label="Lenders"
          options={safeFilterOptions.lenders}
          selected={safeFilters.lender}
          onSelectionChange={(values) => onFilterChange('lender', values)}
        />
      </div>

      <div className="relative">
        <MultiSelectFilter
          label="Status"
          options={safeFilterOptions.statuses}
          selected={safeFilters.status}
          onSelectionChange={(values) => onFilterChange('status', values)}
        />
      </div>
    </div>
  );
};

export default FilterBar;
