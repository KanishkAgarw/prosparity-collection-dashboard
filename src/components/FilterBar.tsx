
import { useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CustomMultiSelectFilter from "./CustomMultiSelectFilter";

interface FilterBarProps {
  filters: {
    branch: string[];
    teamLead: string[];
    rm: string[];
    dealer: string[];
    lender: string[];
    status: string[];
    emiMonth: string[];
    repayment: string[];
    lastMonthBounce: string[];
    ptpDate: string[];
    collectionRm: string[];
  };
  onFilterChange: (key: string, values: string[]) => void;
  availableOptions: {
    branches: string[];
    teamLeads: string[];
    rms: string[];
    dealers: string[];
    lenders: string[];
    statuses: string[];
    emiMonths: string[];
    repayments: string[];
    lastMonthBounce: string[];
    ptpDateOptions: string[];
    collectionRms: string[];
  };
}

const FilterBar = ({ filters, onFilterChange, availableOptions }: FilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Ensure all filter options have default empty arrays
  const safeFilterOptions = {
    branches: availableOptions?.branches || [],
    teamLeads: availableOptions?.teamLeads || [],
    rms: availableOptions?.rms || [],
    dealers: availableOptions?.dealers || [],
    lenders: availableOptions?.lenders || [],
    statuses: availableOptions?.statuses || [],
    emiMonths: availableOptions?.emiMonths || [],
    repayments: availableOptions?.repayments || [],
    lastMonthBounce: availableOptions?.lastMonthBounce || [],
    ptpDateOptions: availableOptions?.ptpDateOptions || [],
    collectionRms: availableOptions?.collectionRms || [],
  };

  // Ensure all filters have default empty arrays
  const safeFilters = {
    branch: filters?.branch || [],
    teamLead: filters?.teamLead || [],
    rm: filters?.rm || [],
    dealer: filters?.dealer || [],
    lender: filters?.lender || [],
    status: filters?.status || [],
    emiMonth: filters?.emiMonth || [],
    repayment: filters?.repayment || [],
    lastMonthBounce: filters?.lastMonthBounce || [],
    ptpDate: filters?.ptpDate || [],
    collectionRm: filters?.collectionRm || [],
  };

  // Count total active filters
  const activeFilterCount = Object.values(safeFilters).reduce((count, filterArray) => count + filterArray.length, 0);

  console.log('FilterBar - PTP Date filter:', safeFilters.ptpDate);
  console.log('FilterBar - PTP Date options:', safeFilterOptions.ptpDateOptions);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 border-0 rounded-xl h-auto"
          >
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900 text-base">Filter Applications</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            {isOpen ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-6 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">PTP Date</label>
                <CustomMultiSelectFilter
                  label="PTP Date"
                  options={safeFilterOptions.ptpDateOptions}
                  selected={safeFilters.ptpDate}
                  onSelectionChange={(values) => {
                    console.log('PTP Date filter changed to:', values);
                    onFilterChange('ptpDate', values);
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">EMI Months</label>
                <CustomMultiSelectFilter
                  label="EMI Months"
                  options={safeFilterOptions.emiMonths}
                  selected={safeFilters.emiMonth}
                  onSelectionChange={(values) => onFilterChange('emiMonth', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Branches</label>
                <CustomMultiSelectFilter
                  label="Branches"
                  options={safeFilterOptions.branches}
                  selected={safeFilters.branch}
                  onSelectionChange={(values) => onFilterChange('branch', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Team Leads</label>
                <CustomMultiSelectFilter
                  label="Team Leads"
                  options={safeFilterOptions.teamLeads}
                  selected={safeFilters.teamLead}
                  onSelectionChange={(values) => onFilterChange('teamLead', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">RMs</label>
                <CustomMultiSelectFilter
                  label="RMs"
                  options={safeFilterOptions.rms}
                  selected={safeFilters.rm}
                  onSelectionChange={(values) => onFilterChange('rm', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Collection RMs</label>
                <CustomMultiSelectFilter
                  label="Collection RMs"
                  options={safeFilterOptions.collectionRms}
                  selected={safeFilters.collectionRm}
                  onSelectionChange={(values) => onFilterChange('collectionRm', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dealers</label>
                <CustomMultiSelectFilter
                  label="Dealers"
                  options={safeFilterOptions.dealers}
                  selected={safeFilters.dealer}
                  onSelectionChange={(values) => onFilterChange('dealer', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Lenders</label>
                <CustomMultiSelectFilter
                  label="Lenders"
                  options={safeFilterOptions.lenders}
                  selected={safeFilters.lender}
                  onSelectionChange={(values) => onFilterChange('lender', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <CustomMultiSelectFilter
                  label="Status"
                  options={safeFilterOptions.statuses}
                  selected={safeFilters.status}
                  onSelectionChange={(values) => onFilterChange('status', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Repayment</label>
                <CustomMultiSelectFilter
                  label="Repayment"
                  options={safeFilterOptions.repayments}
                  selected={safeFilters.repayment}
                  onSelectionChange={(values) => onFilterChange('repayment', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Last Month Status</label>
                <CustomMultiSelectFilter
                  label="Last Month Status"
                  options={safeFilterOptions.lastMonthBounce}
                  selected={safeFilters.lastMonthBounce}
                  onSelectionChange={(values) => onFilterChange('lastMonthBounce', values)}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FilterBar;
