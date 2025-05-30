
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
    <div className="space-y-6">
      {/* Status Cards */}
      <StatusCards applications={applications} />

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 min-w-0">
            <SearchBar
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Search applications..."
            />
          </div>
          
          <div className="w-full lg:w-auto">
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
    </div>
  );
};

export default FiltersSection;
