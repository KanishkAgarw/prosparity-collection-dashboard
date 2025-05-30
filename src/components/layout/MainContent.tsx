
import { Application } from "@/types/application";
import StatusCards from "@/components/StatusCards";
import MobileStatusCards from "@/components/MobileStatusCards";
import ApplicationsTable from "@/components/ApplicationsTable";
import PaginationControls from "@/components/PaginationControls";

interface MainContentProps {
  applications: Application[];
  onRowClick: (app: Application) => void;
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
  return (
    <>
      {/* Status Cards */}
      <div className="hidden sm:block">
        <StatusCards applications={applications} />
      </div>
      <div className="sm:hidden">
        <MobileStatusCards applications={applications} />
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow">
        <ApplicationsTable
          applications={applications}
          onRowClick={onRowClick}
          onApplicationDeleted={onApplicationDeleted}
          selectedApplicationId={selectedApplicationId}
        />
        
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
    </>
  );
};

export default MainContent;
