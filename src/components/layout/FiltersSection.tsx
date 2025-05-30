
import FilterBar from "@/components/FilterBar";
import MobileFilterBar from "@/components/MobileFilterBar";
import SearchBar from "@/components/SearchBar";
import { FilterOptions } from "@/types/application";

interface FiltersSectionProps {
  filters: Record<string, string>;
  availableOptions: FilterOptions;
  onFilterChange: (key: string, value: string) => void;
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
