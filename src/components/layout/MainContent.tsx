
import { Application } from "@/types/application";
import { useIsMobile } from "@/hooks/use-mobile";
import ApplicationsTable from "@/components/ApplicationsTable";
import MobileOptimizedTable from "@/components/MobileOptimizedTable";
import PaginationControls from "@/components/PaginationControls";

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
  onApplicationDeleted,
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
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
        {isMobile ? (
          <MobileOptimizedTable
            applications={applications}
            onRowClick={onRowClick}
            selectedApplicationId={selectedApplicationId}
            selectedEmiMonth={selectedEmiMonth}
          />
        ) : (
          <ApplicationsTable
            applications={applications}
            onRowClick={onRowClick}
            onApplicationDeleted={onApplicationDeleted}
            selectedApplicationId={selectedApplicationId}
            selectedEmiMonth={selectedEmiMonth}
          />
        )}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>
  );
};

export default MainContent;
