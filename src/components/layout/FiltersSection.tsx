
import FilterBar from "@/components/FilterBar";
import MobileFilterBar from "@/components/MobileFilterBar";
import SearchBar from "@/components/SearchBar";

interface FilterState {
  branch: string[];
  teamLead: string[];
  rm: string[];
  dealer: string[];
  lender: string[];
  status: string[];
  emiMonth: string[];
  repayment: string[];
  lastMonthBounce: string[];
}

interface FilterOptions {
  branches: string[];
  teamLeads: string[];
  rms: string[];
  dealers: string[];
  lenders: string[];
  statuses: string[];
  emiMonths: string[];
  repayments: string[];
  lastMonthBounce: string[];
}

interface FiltersSectionProps {
  filters: FilterState;
  availableOptions: FilterOptions;
  onFilterChange: (key: keyof FilterState, values: string[]) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const FiltersSection = ({ 
  filters, 
  availableOptions, 
  onFilterChange, 
  searchTerm, 
  onSearchChange 
}: FiltersSectionProps) => {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-4">
        <div className="hidden lg:block">
          <FilterBar
            filters={filters}
            availableOptions={availableOptions}
            onFilterChange={onFilterChange}
          />
        </div>
        
        <div className="lg:hidden">
          <MobileFilterBar
            filters={filters}
            availableOptions={availableOptions}
            onFilterChange={onFilterChange}
          />
        </div>
      </div>

      {/* Search */}
      <SearchBar 
        searchTerm={searchTerm} 
        onSearchChange={onSearchChange}
        placeholder="Search by name, ID, dealer, lender, RM, or team lead..."
      />
    </div>
  );
};

export default FiltersSection;
