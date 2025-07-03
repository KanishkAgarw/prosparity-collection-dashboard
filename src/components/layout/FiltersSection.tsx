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
  selectedEmiMonth?: string | null;
  onEmiMonthChange?: (month: string) => void;
  emiMonthOptions?: string[];
  loading?: boolean;
  searchLoading?: boolean;
  totalCount?: number;
}

const FiltersSection = ({
  filters,
  availableOptions,
  onFilterChange,
  searchTerm,
  onSearchChange,
  selectedEmiMonth,
  onEmiMonthChange,
  emiMonthOptions = [],
  loading = false,
  searchLoading = false,
  totalCount
}: FiltersSectionProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      {/* Filters Dropdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading filters...</span>
          </div>
        ) : isMobile ? (
          <MobileFilterBar
            filters={filters}
            availableOptions={availableOptions}
            onFilterChange={onFilterChange}
            emiMonthOptions={emiMonthOptions}
          />
        ) : (
          <FilterBar
            filters={filters}
            availableOptions={availableOptions}
            onFilterChange={onFilterChange}
            selectedEmiMonth={selectedEmiMonth}
            onEmiMonthChange={onEmiMonthChange}
            emiMonthOptions={emiMonthOptions}
          />
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <SearchBar
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search applications..."
          loading={searchLoading}
          resultCount={searchTerm ? totalCount : undefined}
        />
      </div>
    </div>
  );
};

export default FiltersSection;
