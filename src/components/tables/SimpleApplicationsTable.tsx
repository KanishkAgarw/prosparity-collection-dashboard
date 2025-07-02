
import { memo } from "react";
import { Application } from "@/types/application";
import ApplicationCard from "@/components/cards/ApplicationCard";
import MobileApplicationCard from "@/components/cards/MobileApplicationCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface SimpleApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  selectedApplicationId?: string;
  selectedEmiMonth?: string | null;
}

const SimpleApplicationsTable = memo(({
  applications,
  onRowClick,
  selectedApplicationId,
  selectedEmiMonth
}: SimpleApplicationsTableProps) => {
  const isMobile = useIsMobile();

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium text-gray-500">No applications found</p>
        <p className="text-sm text-gray-400">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Column Headers for Desktop */}
      {!isMobile && (
        <div className="grid grid-cols-6 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
          <div>Application Details</div>
          <div className="text-center">EMI Amount</div>
          <div className="text-center">Status</div>
          <div className="text-center">PTP Date</div>
          <div className="text-center">Calling Status</div>
          <div>Recent Comments</div>
        </div>
      )}
      
      {applications.map((application) => (
        isMobile ? (
          <MobileApplicationCard
            key={application.id}
            application={application}
            onClick={onRowClick}
            isSelected={selectedApplicationId === application.id}
            selectedEmiMonth={selectedEmiMonth}
          />
        ) : (
          <ApplicationCard
            key={application.id}
            application={application}
            onClick={onRowClick}
            isSelected={selectedApplicationId === application.id}
            selectedEmiMonth={selectedEmiMonth}
          />
        )
      ))}
    </div>
  );
});

SimpleApplicationsTable.displayName = "SimpleApplicationsTable";

export default SimpleApplicationsTable;
