

import { Application } from "@/types/application";
import SimpleApplicationsTable from "@/components/tables/SimpleApplicationsTable";
import PaginationControls from "@/components/PaginationControls";
import { useIsMobile } from "@/hooks/use-mobile";
import OptimizedMobileTable from "@/components/tables/mobile/OptimizedMobileTable";

interface MainContentProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  onApplicationDeleted?: () => void;
  selectedApplicationId?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  pageSize: number;
  selectedEmiMonth?: string | null;
}

const MainContent = ({
  applications,
  onRowClick,
  selectedApplicationId,
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  pageSize,
  selectedEmiMonth
}: MainContentProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} applications
        </span>
        {totalCount >= 1000 && (
          <span className="text-amber-600 font-medium">
            Showing first 1,000 results
          </span>
        )}
      </div>

      {/* Table */}
      {isMobile ? (
        <OptimizedMobileTable
          applications={applications}
          onRowClick={onRowClick}
          selectedApplicationId={selectedApplicationId}
          selectedEmiMonth={selectedEmiMonth}
        />
      ) : (
        <SimpleApplicationsTable
          applications={applications}
          onRowClick={onRowClick}
          selectedApplicationId={selectedApplicationId}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalCount={totalCount}
          pageSize={pageSize}
        />
      )}
    </div>
  );
};

export default MainContent;

