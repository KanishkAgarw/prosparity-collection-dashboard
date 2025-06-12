
import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Application } from "@/types/application";
import { formatEmiMonth, formatCurrency, formatPtpDate } from "@/utils/formatters";
import StatusBadge from "./StatusBadge";
import ApplicationDetails from "./ApplicationDetails";
import CallStatusDisplay from "../CallStatusDisplay";
import CommentsDisplay from "./CommentsDisplay";

interface ApplicationRowProps {
  application: Application;
  selectedApplicationId?: string;
  onRowClick: (application: Application) => void;
}

const ApplicationRow = memo(({ 
  application, 
  selectedApplicationId, 
  onRowClick
}: ApplicationRowProps) => {
  const handleRowClick = (e: React.MouseEvent) => {
    onRowClick(application);
  };

  return (
    <TableRow 
      className={`cursor-pointer transition-colors ${
        selectedApplicationId === application.id 
          ? 'bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100' 
          : 'hover:bg-gray-50'
      }`}
      onClick={handleRowClick}
    >
      <TableCell className="py-3">
        <ApplicationDetails application={application} />
      </TableCell>
      
      <TableCell className="font-medium text-blue-600">
        {formatCurrency(application.emi_amount)}
      </TableCell>
      
      <TableCell>
        <StatusBadge status={application.field_status || 'Unpaid'} />
      </TableCell>
      
      <TableCell className={`${application.ptp_date ? 'text-blue-600 font-medium' : 'text-gray-400'} whitespace-nowrap`}>
        {application.ptp_date ? formatPtpDate(application.ptp_date) : 'Not Set'}
      </TableCell>
      
      <TableCell className="text-sm">
        <CallStatusDisplay application={application} />
      </TableCell>
      
      <TableCell className="max-w-[200px]">
        <CommentsDisplay comments={application.recent_comments} />
      </TableCell>
    </TableRow>
  );
});

ApplicationRow.displayName = "ApplicationRow";

export default ApplicationRow;
