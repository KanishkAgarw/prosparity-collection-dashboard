
import { FilterOptions } from "@/types/application";
import CustomMultiSelectFilter from "./CustomMultiSelectFilter";

interface MobileFilterBarProps {
  filters: {
    branch: string[];
    teamLead: string[];
    dealer: string[];
    lender: string[];
    status: string[];
    emiMonth: string[];
    rmName: string[];
  };
  availableOptions: FilterOptions & { rmNames: string[] };
  onFilterChange: (key: string, values: string[]) => void;
}

const MobileFilterBar = ({ filters, availableOptions, onFilterChange }: MobileFilterBarProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
      
      <div className="space-y-3">
        <CustomMultiSelectFilter
          label="Branch"
          options={availableOptions.branches}
          selectedValues={filters.branch}
          onSelectionChange={(values) => onFilterChange('branch', values)}
          placeholder="Select branches..."
        />
        
        <CustomMultiSelectFilter
          label="Team Lead"
          options={availableOptions.teamLeads}
          selectedValues={filters.teamLead}
          onSelectionChange={(values) => onFilterChange('teamLead', values)}
          placeholder="Select team leads..."
        />

        <CustomMultiSelectFilter
          label="RM Name"
          options={availableOptions.rmNames}
          selectedValues={filters.rmName}
          onSelectionChange={(values) => onFilterChange('rmName', values)}
          placeholder="Select RM names..."
        />
        
        <CustomMultiSelectFilter
          label="Dealer"
          options={availableOptions.dealers}
          selectedValues={filters.dealer}
          onSelectionChange={(values) => onFilterChange('dealer', values)}
          placeholder="Select dealers..."
        />
        
        <CustomMultiSelectFilter
          label="Lender"
          options={availableOptions.lenders}
          selectedValues={filters.lender}
          onSelectionChange={(values) => onFilterChange('lender', values)}
          placeholder="Select lenders..."
        />
        
        <CustomMultiSelectFilter
          label="Status"
          options={availableOptions.statuses}
          selectedValues={filters.status}
          onSelectionChange={(values) => onFilterChange('status', values)}
          placeholder="Select statuses..."
        />
        
        <CustomMultiSelectFilter
          label="EMI Month"
          options={availableOptions.emiMonths}
          selectedValues={filters.emiMonth}
          onSelectionChange={(values) => onFilterChange('emiMonth', values)}
          placeholder="Select EMI months..."
        />
      </div>
    </div>
  );
};

export default MobileFilterBar;
