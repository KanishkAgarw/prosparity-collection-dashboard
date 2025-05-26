
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
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="relative">
        <MultiSelectFilter
          label="EMI Months"
          options={filterOptions.emiMonths}
          selectedValues={filters.emiMonth}
          onSelectionChange={(values) => onFilterChange('emiMonth', values)}
        />
      </div>

      <div className="relative">
        <MultiSelectFilter
          label="Branches"
          options={filterOptions.branches}
          selectedValues={filters.branch}
          onSelectionChange={(values) => onFilterChange('branch', values)}
        />
      </div>

      <div className="relative">
        <MultiSelectFilter
          label="Team Leads"
          options={filterOptions.teamLeads}
          selectedValues={filters.teamLead}
          onSelectionChange={(values) => onFilterChange('teamLead', values)}
        />
      </div>

      <div className="relative">
        <MultiSelectFilter
          label="Dealers"
          options={filterOptions.dealers}
          selectedValues={filters.dealer}
          onSelectionChange={(values) => onFilterChange('dealer', values)}
        />
      </div>

      <div className="relative">
        <MultiSelectFilter
          label="Lenders"
          options={filterOptions.lenders}
          selectedValues={filters.lender}
          onSelectionChange={(values) => onFilterChange('lender', values)}
        />
      </div>

      <div className="relative">
        <MultiSelectFilter
          label="Status"
          options={filterOptions.statuses}
          selectedValues={filters.status}
          onSelectionChange={(values) => onFilterChange('status', values)}
        />
      </div>
    </div>
  );
};

export default FilterBar;
