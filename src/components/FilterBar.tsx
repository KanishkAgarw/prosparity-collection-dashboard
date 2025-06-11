
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
          values={filters.branch}
          options={availableOptions.branches}
          onChange={(values) => onFilterChange('branch', values)}
        />
        
        <MultiSelectFilter
          label="Team Lead"
          values={filters.teamLead}
          options={availableOptions.teamLeads}
          onChange={(values) => onFilterChange('teamLead', values)}
        />
        
        <MultiSelectFilter
          label="RM"
          values={filters.rm}
          options={availableOptions.dealers}
          onChange={(values) => onFilterChange('rm', values)}
        />
        
        <MultiSelectFilter
          label="Dealer"
          values={filters.dealer}
          options={availableOptions.dealers}
          onChange={(values) => onFilterChange('dealer', values)}
        />
        
        <MultiSelectFilter
          label="Lender"
          values={filters.lender}
          options={availableOptions.lenders}
          onChange={(values) => onFilterChange('lender', values)}
        />
        
        <MultiSelectFilter
          label="Status"
          values={filters.status}
          options={availableOptions.statuses}
          onChange={(values) => onFilterChange('status', values)}
        />
        
        <MultiSelectFilter
          label="EMI Range"
          values={filters.emiMonth}
          options={availableOptions.emiMonths}
          onChange={(values) => onFilterChange('emiMonth', values)}
        />
        
        <MultiSelectFilter
          label="Repayment"
          values={filters.repayment}
          options={availableOptions.repayments}
          onChange={(values) => onFilterChange('repayment', values)}
        />
        
        <MultiSelectFilter
          label="Last Month Bounce"
          values={filters.lastMonthBounce}
          options={availableOptions.lastMonthBounce}
          onChange={(values) => onFilterChange('lastMonthBounce', values)}
        />
        
        <MultiSelectFilter
          label="PTP Date"
          values={filters.ptpDate}
          options={ptpDateOptions}
          onChange={(values) => onFilterChange('ptpDate', values)}
        />

        <MultiSelectFilter
          label="Collection RM"
          values={filters.collectionRM}
          options={availableOptions.collectionRMs}
          onChange={(values) => onFilterChange('collectionRM', values)}
        />
      </div>
    </div>
  );
};

export default FilterBar;
