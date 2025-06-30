
import { Button } from "@/components/ui/button";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { formatEmiMonth } from "@/utils/formatters";
import FilterBadge from "./FilterBadge";

interface FilterHeaderProps {
  isOpen: boolean;
  activeFilterCount: number;
  selectedEmiMonth?: string | null;
  onEmiMonthChange?: (month: string) => void;
  emiMonthOptions?: string[];
  onClearAllFilters: () => void;
}

const FilterHeader = ({
  isOpen,
  activeFilterCount,
  selectedEmiMonth,
  onEmiMonthChange,
  emiMonthOptions = [],
  onClearAllFilters
}: FilterHeaderProps) => {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="font-medium">Filters</span>
              <FilterBadge count={activeFilterCount} />
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
            onClick={onClearAllFilters}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterHeader;
