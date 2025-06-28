
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import CustomMultiSelectFilter from "./CustomMultiSelectFilter";

interface FilterBarProps {
  filters: any;
  availableOptions: any;
  onFilterChange: (key: string, values: string[]) => void;
  selectedEmiMonth?: string | null;
}

const FilterBar = ({ filters, availableOptions, onFilterChange, selectedEmiMonth }: FilterBarProps) => {
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const filterConfig = [
    { key: 'branch', label: 'Branch', options: availableOptions.branches },
    { key: 'teamLead', label: 'Team Lead', options: availableOptions.teamLeads },
    { key: 'rm', label: 'RM', options: availableOptions.rms },
    { key: 'dealer', label: 'Dealer', options: availableOptions.dealers },
    { key: 'lender', label: 'Lender', options: availableOptions.lenders },
    { key: 'status', label: 'Status', options: availableOptions.statuses },
    { key: 'emiMonth', label: 'EMI Month', options: availableOptions.emiMonths },
    { key: 'repayment', label: 'Repayment', options: availableOptions.repayments },
    { key: 'lastMonthBounce', label: 'Last Month Bounce', options: availableOptions.lastMonthBounce },
    { key: 'ptpDate', label: 'PTP Date', options: availableOptions.ptpDateOptions },
    { key: 'collectionRm', label: 'Collection RM', options: availableOptions.collectionRms },
    { key: 'vehicleStatus', label: 'Vehicle Status', options: availableOptions.vehicleStatusOptions }
  ];

  const getActiveFiltersCount = (): number => {
    return Object.values(filters).reduce((count: number, filterArray: any) => {
      return count + (Array.isArray(filterArray) ? filterArray.length : 0);
    }, 0);
  };

  const clearAllFilters = () => {
    const clearedFilters: { [key: string]: string[] } = {};
    filterConfig.forEach(config => {
      clearedFilters[config.key] = [];
    });
    Object.keys(clearedFilters).forEach(key => {
      onFilterChange(key, []);
    });
  };

  const removeFilter = (filterKey: string, value: string) => {
    const currentValues = filters[filterKey] || [];
    const newValues = currentValues.filter((v: string) => v !== value);
    onFilterChange(filterKey, newValues);
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filterConfig.map((config) => (
          <CustomMultiSelectFilter
            key={config.key}
            label={config.label}
            options={config.options || []}
            selected={filters[config.key] || []}
            onSelectionChange={(values) => onFilterChange(config.key, values)}
          />
        ))}
        
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="ml-2"
          >
            Clear All ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterConfig.map((config) => {
            const activeValues = filters[config.key] || [];
            return activeValues.map((value: string) => (
              <Badge
                key={`${config.key}-${value}`}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <span className="text-xs">{config.label}:</span>
                <span>{value}</span>
                <X
                  className="h-3 w-3 cursor-pointer hover:bg-gray-300 rounded-full"
                  onClick={() => removeFilter(config.key, value)}
                />
              </Badge>
            ));
          })}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
