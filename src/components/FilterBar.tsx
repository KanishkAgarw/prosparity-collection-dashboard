
import { useState } from "react";
import CustomMultiSelectFilter from "@/components/CustomMultiSelectFilter";
import PtpDateFilter from "@/components/filters/PtpDateFilter";
import { formatEmiMonth } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

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
  const activeFilterCount = Object.values(filters).reduce((total: number, filterArray: any) => {
    if (Array.isArray(filterArray)) {
      return total + filterArray.length;
    }
    return total;
  }, 0);

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
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            
            {/* EMI Month Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">EMI Month:</span>
              <select
                value={selectedEmiMonth || ''}
                onChange={(e) => onEmiMonthChange?.(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Month</option>
                {emiMonthOptions.map((month) => (
                  <option key={month} value={month}>
                    {formatEmiMonth(month)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <CollapsibleContent>
        <div className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Branch Filter */}
            <CustomMultiSelectFilter
              label="Branch"
              options={availableOptions.branches || []}
              selected={filters.branch || []}
              onSelectionChange={(values) => onFilterChange('branch', values)}
              placeholder="Select branches"
            />

            {/* Team Lead Filter */}
            <CustomMultiSelectFilter
              label="Team Lead"
              options={availableOptions.teamLeads || []}
              selected={filters.teamLead || []}
              onSelectionChange={(values) => onFilterChange('teamLead', values)}
              placeholder="Select team leads"
            />

            {/* RM Filter */}
            <CustomMultiSelectFilter
              label="RM"
              options={availableOptions.rms || []}
              selected={filters.rm || []}
              onSelectionChange={(values) => onFilterChange('rm', values)}
              placeholder="Select RMs"
            />

            {/* Collection RM Filter */}
            <CustomMultiSelectFilter
              label="Collection RM"
              options={availableOptions.collectionRms || []}
              selected={filters.collectionRm || []}
              onSelectionChange={(values) => onFilterChange('collectionRm', values)}
              placeholder="Select collection RMs"
            />

            {/* Dealer Filter */}
            <CustomMultiSelectFilter
              label="Dealer"
              options={availableOptions.dealers || []}
              selected={filters.dealer || []}
              onSelectionChange={(values) => onFilterChange('dealer', values)}
              placeholder="Select dealers"
            />

            {/* Lender Filter */}
            <CustomMultiSelectFilter
              label="Lender"
              options={availableOptions.lenders || []}
              selected={filters.lender || []}
              onSelectionChange={(values) => onFilterChange('lender', values)}
              placeholder="Select lenders"
            />

            {/* Status Filter */}
            <CustomMultiSelectFilter
              label="Status"
              options={availableOptions.statuses || []}
              selected={filters.status || []}
              onSelectionChange={(values) => onFilterChange('status', values)}
              placeholder="Select status"
            />

            {/* Repayment Filter */}
            <CustomMultiSelectFilter
              label="Repayment"
              options={availableOptions.repayments || []}
              selected={filters.repayment || []}
              onSelectionChange={(values) => onFilterChange('repayment', values)}
              placeholder="Select repayment"
            />

            {/* Last Month Bounce Filter */}
            <CustomMultiSelectFilter
              label="Last Month Bounce"
              options={availableOptions.lastMonthBounce || []}
              selected={filters.lastMonthBounce || []}
              onSelectionChange={(values) => onFilterChange('lastMonthBounce', values)}
              placeholder="Select bounce status"
            />

            {/* PTP Date Filter */}
            <PtpDateFilter
              selectedValues={filters.ptpDate || []}
              onValueChange={(values) => onFilterChange('ptpDate', values)}
              availableOptions={availableOptions.ptpDateOptions || []}
            />

            {/* Vehicle Status Filter */}
            <CustomMultiSelectFilter
              label="Vehicle Status"
              options={availableOptions.vehicleStatusOptions || []}
              selected={filters.vehicleStatus || []}
              onSelectionChange={(values) => onFilterChange('vehicleStatus', values)}
              placeholder="Select vehicle status"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FilterBar;
