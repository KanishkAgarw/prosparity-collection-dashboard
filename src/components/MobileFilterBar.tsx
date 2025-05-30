
import { useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CustomMultiSelectFilter from "./CustomMultiSelectFilter";

interface MobileFilterBarProps {
  filters: {
    branch: string[];
    teamLead: string[];
    dealer: string[];
    lender: string[];
    status: string[];
    emiMonth: string[];
  };
  onFilterChange: (key: string, values: string[]) => void;
  availableOptions: {
    branches: string[];
    teamLeads: string[];
    dealers: string[];
    lenders: string[];
    statuses: string[];
    emiMonths: string[];
  };
}

const MobileFilterBar = ({ filters, onFilterChange, availableOptions }: MobileFilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Ensure all filter options have default empty arrays
  const safeFilterOptions = {
    branches: availableOptions?.branches || [],
    teamLeads: availableOptions?.teamLeads || [],
    dealers: availableOptions?.dealers || [],
    lenders: availableOptions?.lenders || [],
    statuses: availableOptions?.statuses || [],
    emiMonths: availableOptions?.emiMonths || [],
  };

  // Ensure all filters have default empty arrays
  const safeFilters = {
    branch: filters?.branch || [],
    teamLead: filters?.teamLead || [],
    dealer: filters?.dealer || [],
    lender: filters?.lender || [],
    status: filters?.status || [],
    emiMonth: filters?.emiMonth || [],
  };

  // Count active filters
  const activeFilterCount = Object.values(safeFilters).reduce(
    (count, filterArray) => count + filterArray.length, 
    0
  );

  return (
    <div className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full md:w-auto flex items-center justify-between p-4 mb-4"
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">EMI Months</label>
              <CustomMultiSelectFilter
                label="EMI Months"
                options={safeFilterOptions.emiMonths}
                selected={safeFilters.emiMonth}
                onSelectionChange={(values) => onFilterChange('emiMonth', values)}
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Branches</label>
              <CustomMultiSelectFilter
                label="Branches"
                options={safeFilterOptions.branches}
                selected={safeFilters.branch}
                onSelectionChange={(values) => onFilterChange('branch', values)}
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Leads</label>
              <CustomMultiSelectFilter
                label="Team Leads"
                options={safeFilterOptions.teamLeads}
                selected={safeFilters.teamLead}
                onSelectionChange={(values) => onFilterChange('teamLead', values)}
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Dealers</label>
              <CustomMultiSelectFilter
                label="Dealers"
                options={safeFilterOptions.dealers}
                selected={safeFilters.dealer}
                onSelectionChange={(values) => onFilterChange('dealer', values)}
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Lenders</label>
              <CustomMultiSelectFilter
                label="Lenders"
                options={safeFilterOptions.lenders}
                selected={safeFilters.lender}
                onSelectionChange={(values) => onFilterChange('lender', values)}
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <CustomMultiSelectFilter
                label="Status"
                options={safeFilterOptions.statuses}
                selected={safeFilters.status}
                onSelectionChange={(values) => onFilterChange('status', values)}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default MobileFilterBar;
