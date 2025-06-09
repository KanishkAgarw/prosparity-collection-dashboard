
import { useState } from "react";
import { Application } from "@/types/application";
import ApplicationsTable from "@/components/ApplicationsTable";
import MobileOptimizedTable from "@/components/MobileOptimizedTable";
import PaginationControls from "@/components/PaginationControls";
import BulkStatusUpdate from "@/components/BulkStatusUpdate";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { CheckSquare, Square } from "lucide-react";

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
  const { isAdmin } = useUserRoles();
  const isMobile = useIsMobile();
  const [showBulkSelection, setShowBulkSelection] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState<Application[]>([]);

  const handleBulkUpdate = () => {
    setSelectedApplications([]);
    setShowBulkSelection(false);
  };

  const handleCancelBulk = () => {
    setSelectedApplications([]);
    setShowBulkSelection(false);
  };

  return (
    <div className="space-y-6">
      {/* Admin Controls */}
      {isAdmin && (
        <div className="space-y-4">
          {/* Bulk Operations */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Applications Management</h3>
            <div className="flex gap-2">
              {!showBulkSelection ? (
                <Button
                  variant="outline"
                  onClick={() => setShowBulkSelection(true)}
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Bulk Update
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowBulkSelection(false)}
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Cancel Selection
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Status Update Component */}
          {showBulkSelection && selectedApplications.length > 0 && (
            <BulkStatusUpdate
              selectedApplications={selectedApplications}
              onUpdate={handleBulkUpdate}
              onCancel={handleCancelBulk}
            />
          )}
        </div>
      )}

      {/* Applications Table/List */}
      <div className="bg-white rounded-lg shadow">
        {isMobile ? (
          <MobileOptimizedTable
            applications={applications}
            onRowClick={onRowClick}
            selectedApplicationId={selectedApplicationId}
          />
        ) : (
          <ApplicationsTable
            applications={applications}
            onRowClick={onRowClick}
            onApplicationDeleted={onApplicationDeleted}
            selectedApplicationId={selectedApplicationId}
            selectedApplications={selectedApplications}
            onSelectionChange={setSelectedApplications}
            showBulkSelection={showBulkSelection}
          />
        )}
      </div>

      {/* Pagination */}
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
