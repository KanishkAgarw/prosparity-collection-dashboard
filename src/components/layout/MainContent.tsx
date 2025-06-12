
import { useState } from "react";
import { Application } from "@/types/application";
import ApplicationsTable from "@/components/ApplicationsTable";
import MobileOptimizedTable from "@/components/MobileOptimizedTable";
import PaginationControls from "@/components/PaginationControls";
import PendingApprovals from "@/components/PendingApprovals";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useIsMobile } from "@/hooks/use-mobile";

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

  return (
    <div className="space-y-6">
      {/* Admin Controls */}
      {isAdmin && (
        <div className="space-y-4">
          {/* Pending Approvals */}
          <PendingApprovals onUpdate={() => window.location.reload()} />
          
          {/* Applications Management Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Applications Management</h3>
          </div>
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
