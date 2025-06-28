
import { memo } from "react";
import { Application } from "@/types/application";
import MobileApplicationCard from "./MobileApplicationCard";

interface OptimizedMobileTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  selectedApplicationId?: string;
}

const OptimizedMobileTable = memo(({ 
  applications, 
  onRowClick, 
  selectedApplicationId 
}: OptimizedMobileTableProps) => {
  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <MobileApplicationCard
          key={app.id}
          application={app}
          onRowClick={onRowClick}
          selectedApplicationId={selectedApplicationId}
        />
      ))}
    </div>
  );
});

OptimizedMobileTable.displayName = "OptimizedMobileTable";

export default OptimizedMobileTable;
