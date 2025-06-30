
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CustomMultiSelectFilter from "./CustomMultiSelectFilter";
import { formatEmiMonth } from "@/utils/formatters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CALLING_STATUS_OPTIONS, VEHICLE_STATUS_OPTIONS } from "@/constants/options";

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
    vehicleStatus: string[];
    callingStatus?: string[];
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
    vehicleStatusOptions: string[];
    callingStatusOptions?: string[];
  };
  selectedEmiMonth?: string | null;
  onEmiMonthChange?: (month: string) => void;
  emiMonthOptions?: string[];
}

const FilterBar = ({ 
  filters, 
  onFilterChange, 
  availableOptions, 
  selectedEmiMonth,
  onEmiMonthChange,
  emiMonthOptions = []
}: FilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Local state for pending filters - initialize with current filters
  const [pendingFilters, setPendingFilters] = useState({ ...filters });

  // Sync local state when filters prop changes (e.g., when filters are cleared)
  useEffect(() => {
    setPendingFilters({ ...filters });
  }, [filters]);

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
    vehicleStatusOptions: VEHICLE_STATUS_OPTIONS.map(opt => opt.value),
    callingStatusOptions: CALLING_STATUS_OPTIONS.map(opt => opt.value),
  };

  // Use pendingFilters for UI
  const safeFilters = {
    branch: pendingFilters?.branch || [],
    teamLead: pendingFilters?.teamLead || [],
    rm: pendingFilters?.rm || [],
    dealer: pendingFilters?.dealer || [],
    lender: pendingFilters?.lender || [],
    status: pendingFilters?.status || [],
    emiMonth: pendingFilters?.emiMonth || [],
    repayment: pendingFilters?.repayment || [],
    lastMonthBounce: pendingFilters?.lastMonthBounce || [],
    ptpDate: pendingFilters?.ptpDate || [],
    collectionRm: pendingFilters?.collectionRm || [],
    vehicleStatus: pendingFilters?.vehicleStatus || [],
    callingStatus: pendingFilters?.callingStatus || [],
  };

  // Count total active filters (excluding EMI month since it's managed separately)
  const activeFilterCount = Object.entries(safeFilters)
    .filter(([key]) => key !== 'emiMonth')
    .reduce((count, [, filterArray]) => count + (filterArray?.length || 0), 0);

  // Handler for local filter changes
  const handlePendingFilterChange = (key: string, values: string[]) => {
    console.log('🔄 Pending filter change:', key, values);
    setPendingFilters(prev => ({
      ...prev,
      [key]: values
    }));
  };

  // Handler for Apply Filters button - immediately apply all filters
  const handleApplyFilters = () => {
    console.log('✅ Applying all filters:', pendingFilters);
    
    // Apply all pending filters immediately
    Object.entries(pendingFilters).forEach(([key, values]) => {
      if (key !== 'emiMonth') { // EMI month is managed separately
        console.log(`🔄 Applying ${key} filter:`, values);
        onFilterChange(key, values as string[]);
      }
    });
    
    setIsOpen(false);
  };

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
              {selectedEmiMonth && (
                <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
                  EMI: {formatEmiMonth(selectedEmiMonth)}
                </span>
              )}
            </div>
            {isOpen ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-6 border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* EMI Month Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">EMI Month</label>
                <Select value={selectedEmiMonth || ''} onValueChange={onEmiMonthChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select EMI Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                    {emiMonthOptions.map((month) => (
                      <SelectItem key={month} value={month} className="hover:bg-gray-100">
                        {formatEmiMonth(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Collection Status</label>
                <CustomMultiSelectFilter
                  label="Collection Status"
                  options={safeFilterOptions.statuses}
                  selected={safeFilters.status}
                  onSelectionChange={(values) => handlePendingFilterChange('status', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Calling Status</label>
                <CustomMultiSelectFilter
                  label="Calling Status"
                  options={safeFilterOptions.callingStatusOptions}
                  selected={safeFilters.callingStatus}
                  onSelectionChange={(values) => handlePendingFilterChange('callingStatus', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">PTP Date</label>
                <CustomMultiSelectFilter
                  label="PTP Date"
                  options={safeFilterOptions.ptpDateOptions}
                  selected={safeFilters.ptpDate}
                  onSelectionChange={(values) => handlePendingFilterChange('ptpDate', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Last Month Status</label>
                <CustomMultiSelectFilter
                  label="Last Month Status"
                  options={safeFilterOptions.lastMonthBounce}
                  selected={safeFilters.lastMonthBounce}
                  onSelectionChange={(values) => handlePendingFilterChange('lastMonthBounce', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Branches</label>
                <CustomMultiSelectFilter
                  label="Branches"
                  options={safeFilterOptions.branches}
                  selected={safeFilters.branch}
                  onSelectionChange={(values) => handlePendingFilterChange('branch', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Team Leads</label>
                <CustomMultiSelectFilter
                  label="Team Leads"
                  options={safeFilterOptions.teamLeads}
                  selected={safeFilters.teamLead}
                  onSelectionChange={(values) => handlePendingFilterChange('teamLead', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">RMs</label>
                <CustomMultiSelectFilter
                  label="RMs"
                  options={safeFilterOptions.rms}
                  selected={safeFilters.rm}
                  onSelectionChange={(values) => handlePendingFilterChange('rm', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Collection RMs</label>
                <CustomMultiSelectFilter
                  label="Collection RMs"
                  options={safeFilterOptions.collectionRms}
                  selected={safeFilters.collectionRm}
                  onSelectionChange={(values) => handlePendingFilterChange('collectionRm', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dealers</label>
                <CustomMultiSelectFilter
                  label="Dealers"
                  options={safeFilterOptions.dealers}
                  selected={safeFilters.dealer}
                  onSelectionChange={(values) => handlePendingFilterChange('dealer', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Lenders</label>
                <CustomMultiSelectFilter
                  label="Lenders"
                  options={safeFilterOptions.lenders}
                  selected={safeFilters.lender}
                  onSelectionChange={(values) => handlePendingFilterChange('lender', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Repayment</label>
                <CustomMultiSelectFilter
                  label="Repayment"
                  options={safeFilterOptions.repayments}
                  selected={safeFilters.repayment}
                  onSelectionChange={(values) => handlePendingFilterChange('repayment', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Vehicle Status</label>
                <CustomMultiSelectFilter
                  label="Vehicle Status"
                  options={safeFilterOptions.vehicleStatusOptions}
                  selected={safeFilters.vehicleStatus}
                  onSelectionChange={(values) => handlePendingFilterChange('vehicleStatus', values)}
                />
              </div>
            </div>
            
            {/* Apply Filters button with enhanced styling */}
            <div className="mt-6 flex justify-end">
              <div className="border-2 border-blue-500 rounded-lg p-2 bg-blue-50">
                <Button
                  variant="default"
                  className="px-8 py-2 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                  onClick={handleApplyFilters}
                >
                  Apply Filters ({activeFilterCount})
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FilterBar;
