
import { useState } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import FilterHeader from "@/components/filters/FilterHeader";
import FilterContent from "@/components/filters/FilterContent";
import { calculateActiveFilterCount } from "@/utils/filterUtils";

interface FilterBarProps {
  filters: any;
  availableOptions: any;
  onFilterChange: (key: string, values: string[]) => void;
  selectedEmiMonth?: string | null;
  onEmiMonthChange?: (month: string) => void;
  emiMonthOptions?: string[];
}

const FilterBar = ({
  filters,
  availableOptions,
  onFilterChange,
  selectedEmiMonth,
  onEmiMonthChange,
  emiMonthOptions = []
}: FilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate total active filters with proper typing
  const activeFilterCount = calculateActiveFilterCount(filters);

  const clearAllFilters = () => {
    Object.keys(filters).forEach(key => {
      onFilterChange(key, []);
    });
  };

  console.log('FilterBar render - available options:', {
    statuses: availableOptions.statuses?.length || 0,
    ptpDateOptions: availableOptions.ptpDateOptions?.length || 0,
    branches: availableOptions.branches?.length || 0
  });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <FilterHeader
        isOpen={isOpen}
        activeFilterCount={activeFilterCount}
        selectedEmiMonth={selectedEmiMonth}
        onEmiMonthChange={onEmiMonthChange}
        emiMonthOptions={emiMonthOptions}
        onClearAllFilters={clearAllFilters}
      />

      <CollapsibleContent>
        <FilterContent
          filters={filters}
          availableOptions={availableOptions}
          onFilterChange={onFilterChange}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FilterBar;
