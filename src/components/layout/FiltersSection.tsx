
import { useIsMobile } from "@/hooks/use-mobile";
import FilterBar from "@/components/FilterBar";
import MobileFilterBar from "@/components/MobileFilterBar";
import SearchBar from "@/components/SearchBar";
import StatusCards from "@/components/StatusCards";
import { Application } from "@/types/application";

interface FiltersSectionProps {
  filters: any;
  availableOptions: any;
  onFilterChange: (key: string, values: string[]) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  applications: Application[];
}

const FiltersSection = ({
  filters,
  availableOptions,
  onFilterChange,
  searchTerm,
  onSearchChange,
  applications
}: FiltersSectionProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-3">
      {/* Status Cards */}
      <StatusCards applications={applications} />

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-2">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <SearchBar
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search applications..."
          />
          
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
      </div>
    </div>
  );
};

export default FiltersSection;
