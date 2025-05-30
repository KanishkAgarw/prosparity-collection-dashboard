
import { Application } from "@/types/application";
import { useIsMobile } from "@/hooks/use-mobile";
import ApplicationsTable from "@/components/ApplicationsTable";
import MobileOptimizedTable from "@/components/MobileOptimizedTable";
import PaginationControls from "@/components/PaginationControls";

interface MainContentProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  onApplicationDeleted: () => void;
  selectedApplicationId?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  pageSize: number;
}

const MainContent = ({
  applications,
  onRowClick,
  onApplicationDeleted,
  selectedApplicationId,
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  pageSize
}: MainContentProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {applications.length} of {totalCount} applications
        </span>
        <span>
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Table/List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isMobile ? (
          <div className="p-4">
            <MobileOptimizedTable
              applications={applications}
              onRowClick={onRowClick}
              selectedApplicationId={selectedApplicationId}
            />
          </div>
        ) : (
          <ApplicationsTable
            applications={applications}
            onRowClick={onRowClick}
            onApplicationDeleted={onApplicationDeleted}
            selectedApplicationId={selectedApplicationId}
          />
        )}
      </div>

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
