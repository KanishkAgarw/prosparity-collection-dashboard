
import { memo } from "react";
import { Application } from "@/types/application";
import MobileApplicationCard from "./MobileApplicationCard";

interface OptimizedMobileTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  selectedApplicationId?: string;
  selectedEmiMonth?: string | null;
}

const OptimizedMobileTable = memo(({
  applications,
  onRowClick,
  selectedApplicationId,
  selectedEmiMonth
}: OptimizedMobileTableProps) => {
  
  return (
    <div className="space-y-3 p-1">
      {applications.map((application) => (
        <MobileApplicationCard
          key={application.id}
          application={application}
          onRowClick={onRowClick}
          selectedApplicationId={selectedApplicationId || ''}
          selectedMonth={selectedEmiMonth}
        />
      ))}
      
      {applications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium text-gray-500">No applications found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
});

OptimizedMobileTable.displayName = "OptimizedMobileTable";

export default OptimizedMobileTable;
