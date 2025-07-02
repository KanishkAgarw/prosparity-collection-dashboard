
import { memo } from "react";
import { Application } from "@/types/application";
import ApplicationCard from "@/components/cards/ApplicationCard";

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
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          onClick={onRowClick}
          isSelected={selectedApplicationId === application.id}
          selectedEmiMonth={selectedEmiMonth}
        />
      ))}
    </div>
  );
});

SimpleApplicationsTable.displayName = "SimpleApplicationsTable";

export default SimpleApplicationsTable;
