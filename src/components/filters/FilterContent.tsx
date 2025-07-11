import { Button } from "@/components/ui/button";
import CustomMultiSelectFilter from "@/components/CustomMultiSelectFilter";
import PtpDateFilter from "@/components/filters/PtpDateFilter";

interface FilterContentProps {
  filters: any;
  availableOptions: any;
  onFilterChange: (key: string, values: string[]) => void;
  onClose?: () => void;
  onCancel?: () => void;
}

const FilterContent = ({ filters, availableOptions, onFilterChange, onClose, onCancel }: FilterContentProps) => {
  return (
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

      {/* Action Buttons */}
      {(onClose || onCancel) && (
        <div className="mt-6 flex justify-end gap-3">
          {onCancel && (
            <Button
              variant="outline"
              className="px-6 py-2"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          {onClose && (
            <div className="border border-blue-500 rounded-lg p-2 bg-blue-50">
              <Button
                variant="default"
                className="px-8 py-2 text-base font-semibold"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterContent;
