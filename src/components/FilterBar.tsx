
import { useMemo } from "react";
import { FilterOptions } from "@/types/application";
import { FilterState } from "@/types/filters";
import MultiSelectFilter from "./MultiSelectFilter";
import { getPtpDateOptions } from "@/utils/ptpDateUtils";

interface FilterBarProps {
  filters: FilterState;
  availableOptions: FilterOptions;
  onFilterChange: (key: keyof FilterState, values: string[]) => void;
}

const FilterBar = ({ filters, availableOptions, onFilterChange }: FilterBarProps) => {
  const ptpDateOptions = useMemo(() => getPtpDateOptions(), []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <MultiSelectFilter
          label="Branch"
          selected={filters.branch}
          options={availableOptions.branches}
          onSelectionChange={(values) => onFilterChange('branch', values)}
        />
        
        <MultiSelectFilter
          label="Team Lead"
          selected={filters.teamLead}
          options={availableOptions.teamLeads}
          onSelectionChange={(values) => onFilterChange('teamLead', values)}
        />
        
        <MultiSelectFilter
          label="RM"
          selected={filters.rm}
          options={availableOptions.dealers}
          onSelectionChange={(values) => onFilterChange('rm', values)}
        />
        
        <MultiSelectFilter
          label="Dealer"
          selected={filters.dealer}
          options={availableOptions.dealers}
          onSelectionChange={(values) => onFilterChange('dealer', values)}
        />
        
        <MultiSelectFilter
          label="Lender"
          selected={filters.lender}
          options={availableOptions.lenders}
          onSelectionChange={(values) => onFilterChange('lender', values)}
        />
        
        <MultiSelectFilter
          label="Status"
          selected={filters.status}
          options={availableOptions.statuses}
          onSelectionChange={(values) => onFilterChange('status', values)}
        />
        
        <MultiSelectFilter
          label="EMI Range"
          selected={filters.emiMonth}
          options={availableOptions.emiMonths}
          onSelectionChange={(values) => onFilterChange('emiMonth', values)}
        />
        
        <MultiSelectFilter
          label="Repayment"
          selected={filters.repayment}
          options={availableOptions.repayments}
          onSelectionChange={(values) => onFilterChange('repayment', values)}
        />
        
        <MultiSelectFilter
          label="Last Month Bounce"
          selected={filters.lastMonthBounce}
          options={availableOptions.lastMonthBounce}
          onSelectionChange={(values) => onFilterChange('lastMonthBounce', values)}
        />
        
        <MultiSelectFilter
          label="PTP Date"
          selected={filters.ptpDate}
          options={ptpDateOptions}
          onSelectionChange={(values) => onFilterChange('ptpDate', values)}
        />

        <MultiSelectFilter
          label="Collection RM"
          selected={filters.collectionRM}
          options={availableOptions.collectionRMs}
          onSelectionChange={(values) => onFilterChange('collectionRM', values)}
        />
      </div>
    </div>
  );
};

export default FilterBar;
