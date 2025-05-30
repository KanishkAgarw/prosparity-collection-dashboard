
import { useIsMobile } from "@/hooks/use-mobile";
import FilterBar from "@/components/FilterBar";
import MobileFilterBar from "@/components/MobileFilterBar";
import SearchBar from "@/components/SearchBar";

interface FiltersSectionProps {
  filters: any;
  availableOptions: any;
  onFilterChange: (key: string, values: string[]) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const FiltersSection = ({
  filters,
  availableOptions,
  onFilterChange,
  searchTerm,
  onSearchChange
}: FiltersSectionProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      {/* Filters Dropdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {isMobile ? (
          <MobileFilterBar
            filters={filters}
            availableOptions={availableOptions}
            onFilterChange={onFilterChange}
          />
        ) : (
          <FilterBar
            filters={filters}
            availableOptions={availableOptions}
            onFilterChange={onFilterChange}
          />
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <SearchBar
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search applications..."
        />
      </div>
    </div>
  );
};

export default FiltersSection;
