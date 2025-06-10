
import { Application } from "@/types/application";
import OptimizedMobileTable from "./tables/mobile/OptimizedMobileTable";

interface MobileOptimizedTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  selectedApplicationId?: string;
}

const MobileOptimizedTable = (props: MobileOptimizedTableProps) => {
  return <OptimizedMobileTable {...props} />;
};

export default MobileOptimizedTable;
