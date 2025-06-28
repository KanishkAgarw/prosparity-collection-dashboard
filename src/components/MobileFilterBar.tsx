
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CustomMultiSelectFilter from "./CustomMultiSelectFilter";

interface MobileFilterBarProps {
  filters: any;
  availableOptions: any;
  onFilterChange: (key: string, values: string[]) => void;
}

const MobileFilterBar = ({ filters, availableOptions, onFilterChange }: MobileFilterBarProps) => {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
    <div className="p-4">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 overflow-y-auto">
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
                onClick={clearAllFilters}
                className="w-full mt-4"
              >
                Clear All Filters ({activeFiltersCount})
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filterConfig.map((config) => {
            const activeValues = filters[config.key] || [];
            return activeValues.map((value: string) => (
              <Badge
                key={`${config.key}-${value}`}
                variant="secondary"
                className="flex items-center gap-1 text-xs"
              >
                <span>{config.label}:</span>
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

export default MobileFilterBar;
