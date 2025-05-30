
import CustomMultiSelectFilter from "./CustomMultiSelectFilter";

interface FilterBarProps {
  filters: {
    branch: string[];
    teamLead: string[];
    rm: string[];
    dealer: string[];
    lender: string[];
    status: string[];
    emiMonth: string[];
  };
  onFilterChange: (key: string, values: string[]) => void;
  availableOptions: {
    branches: string[];
    teamLeads: string[];
    rms: string[];
    dealers: string[];
    lenders: string[];
    statuses: string[];
    emiMonths: string[];
  };
}

const FilterBar = ({ filters, onFilterChange, availableOptions }: FilterBarProps) => {
  // Ensure all filter options have default empty arrays
  const safeFilterOptions = {
    branches: availableOptions?.branches || [],
    teamLeads: availableOptions?.teamLeads || [],
    rms: availableOptions?.rms || [],
    dealers: availableOptions?.dealers || [],
    lenders: availableOptions?.lenders || [],
    statuses: availableOptions?.statuses || [],
    emiMonths: availableOptions?.emiMonths || [],
  };

  // Ensure all filters have default empty arrays
  const safeFilters = {
    branch: filters?.branch || [],
    teamLead: filters?.teamLead || [],
    rm: filters?.rm || [],
    dealer: filters?.dealer || [],
    lender: filters?.lender || [],
    status: filters?.status || [],
    emiMonth: filters?.emiMonth || [],
  };

  // Count total active filters
  const activeFilterCount = Object.values(safeFilters).reduce((count, filterArray) => count + filterArray.length, 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Filter Applications</h3>
        {activeFilterCount > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {activeFilterCount} active
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <CustomMultiSelectFilter
          label="EMI Months"
          options={safeFilterOptions.emiMonths}
          selected={safeFilters.emiMonth}
          onSelectionChange={(values) => onFilterChange('emiMonth', values)}
        />

        <CustomMultiSelectFilter
          label="Branches"
          options={safeFilterOptions.branches}
          selected={safeFilters.branch}
          onSelectionChange={(values) => onFilterChange('branch', values)}
        />

        <CustomMultiSelectFilter
          label="Team Leads"
          options={safeFilterOptions.teamLeads}
          selected={safeFilters.teamLead}
          onSelectionChange={(values) => onFilterChange('teamLead', values)}
        />

        <CustomMultiSelectFilter
          label="RMs"
          options={safeFilterOptions.rms}
          selected={safeFilters.rm}
          onSelectionChange={(values) => onFilterChange('rm', values)}
        />

        <CustomMultiSelectFilter
          label="Dealers"
          options={safeFilterOptions.dealers}
          selected={safeFilters.dealer}
          onSelectionChange={(values) => onFilterChange('dealer', values)}
        />

        <CustomMultiSelectFilter
          label="Lenders"
          options={safeFilterOptions.lenders}
          selected={safeFilters.lender}
          onSelectionChange={(values) => onFilterChange('lender', values)}
        />

        <CustomMultiSelectFilter
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
