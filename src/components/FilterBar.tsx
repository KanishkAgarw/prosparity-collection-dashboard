
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterBarProps {
  filters: {
    branch: string;
    teamLead: string;
    dealer: string;
    lender: string;
    status: string;
    emiMonth: string;
  };
  onFilterChange: (key: string, value: string) => void;
  filterOptions: {
    branches: string[];
    teamLeads: string[];
    dealers: string[];
    lenders: string[];
    statuses: string[];
    emiMonths: string[];
  };
}

const FilterBar = ({ filters, onFilterChange, filterOptions }: FilterBarProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <Select value={filters.emiMonth} onValueChange={(value) => onFilterChange('emiMonth', value)}>
        <SelectTrigger>
          <SelectValue placeholder="EMI Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Months</SelectItem>
          {filterOptions.emiMonths.map((month) => (
            <SelectItem key={month} value={month}>{month}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.branch} onValueChange={(value) => onFilterChange('branch', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Branches</SelectItem>
          {filterOptions.branches.map((branch) => (
            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.teamLead} onValueChange={(value) => onFilterChange('teamLead', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Team Lead" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Team Leads</SelectItem>
          {filterOptions.teamLeads.map((lead) => (
            <SelectItem key={lead} value={lead}>{lead}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.dealer} onValueChange={(value) => onFilterChange('dealer', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Dealer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Dealers</SelectItem>
          {filterOptions.dealers.map((dealer) => (
            <SelectItem key={dealer} value={dealer}>{dealer}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.lender} onValueChange={(value) => onFilterChange('lender', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Lender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Lenders</SelectItem>
          {filterOptions.lenders.map((lender) => (
            <SelectItem key={lender} value={lender}>{lender}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Status</SelectItem>
          {filterOptions.statuses.map((status) => (
            <SelectItem key={status} value={status}>{status}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FilterBar;
