
import { Application } from "@/types/application";
import OptimizedApplicationsTable from "./tables/OptimizedApplicationsTable";

interface ApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  onApplicationDeleted?: () => void;
  selectedApplicationId?: string;
  selectedApplications?: Application[];
  onSelectionChange?: (applications: Application[]) => void;
  showBulkSelection?: boolean;
}

const ApplicationsTable = (props: ApplicationsTableProps) => {
  return <OptimizedApplicationsTable {...props} />;
};

export default ApplicationsTable;
