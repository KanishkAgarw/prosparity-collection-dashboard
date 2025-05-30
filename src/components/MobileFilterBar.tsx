
import { useState, useEffect } from "react";
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
  filterOptions: {
    branches: string[];
    teamLeads: string[];
    dealers: string[];
    lenders: string[];
    statuses: string[];
    emiMonths: string[];
  };
}

const MobileFilterBar = ({ filters, onFilterChange, filterOptions }: MobileFilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredDealers, setFilteredDealers] = useState<string[]>([]);

  // Ensure all filter options have default empty arrays
  const safeFilterOptions = {
    branches: filterOptions?.branches || [],
    teamLeads: filterOptions?.teamLeads || [],
    dealers: filterOptions?.dealers || [],
    lenders: filterOptions?.lenders || [],
    statuses: filterOptions?.statuses || [],
    emiMonths: filterOptions?.emiMonths || [],
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

  // Function to handle team lead filter changes
  const handleTeamLeadFilterChange = (values: string[]) => {
    onFilterChange('teamLead', values);
    
    // Reset dealer filter when team lead changes
    if (values.length === 0) {
      // If no team lead is selected, don't filter dealers
      setFilteredDealers(safeFilterOptions.dealers);
    } else {
      // If team lead filter is cleared, reset dealer filter
      if (safeFilters.dealer.length > 0) {
        onFilterChange('dealer', []);
      }
    }
  };

  // Update filtered dealers when team lead selection changes
  useEffect(() => {
    if (safeFilters.teamLead.length === 0) {
      // If no team leads selected, show all dealers
      setFilteredDealers(safeFilterOptions.dealers);
    } else {
      // Get dealers from applications in Index.tsx that match selected team leads
      // For now, we'll just filter the dealers array since we don't have access to the raw data
      // This will be a simplified version - in production you would want to query the actual relationships
      
      // In a production environment, you would query your database for dealers associated with the selected team leads
      // For now, we'll just use all dealers since we can't determine the actual relationships
      setFilteredDealers(safeFilterOptions.dealers);
    }
  }, [safeFilters.teamLead, safeFilterOptions.dealers]);

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
                onSelectionChange={handleTeamLeadFilterChange}
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Dealers</label>
              <CustomMultiSelectFilter
                label="Dealers"
                options={filteredDealers}
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
