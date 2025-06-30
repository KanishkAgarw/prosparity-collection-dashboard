
import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Application } from "@/types/application";
import { formatEmiMonth, formatCurrency, formatPtpDate } from "@/utils/formatters";
import StatusBadge from "./StatusBadge";
import ApplicationDetails from "./ApplicationDetails";
import CallStatusDisplay from "../CallStatusDisplay";
import CommentsDisplay from "./CommentsDisplay";
import type { BatchComment } from "@/hooks/useBatchComments";
import type { BatchContactStatus } from "@/hooks/useBatchContactCallingStatus";

interface ApplicationRowProps {
  application: Application;
  selectedApplicationId?: string;
  onRowClick: (application: Application) => void;
  selectedEmiMonth?: string | null;
  // Batched data props
  batchedStatus?: string;
  batchedPtpDate?: string | null;
  batchedContactStatus?: BatchContactStatus;
  batchedComments?: BatchComment[];
  isLoading?: boolean;
}

const ApplicationRow = memo(({ 
  application, 
  selectedApplicationId, 
  onRowClick,
  selectedEmiMonth,
  batchedStatus = 'Unpaid',
  batchedPtpDate = null,
  batchedContactStatus,
  batchedComments = [],
  isLoading = false
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
        {isLoading ? (
          <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <StatusBadge status={batchedStatus} />
        )}
      </TableCell>
      
      <TableCell className={`${batchedPtpDate ? 'text-blue-600 font-medium' : 'text-gray-400'} whitespace-nowrap`}>
        {isLoading ? (
          <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          batchedPtpDate ? formatPtpDate(batchedPtpDate) : 'Not Set'
        )}
      </TableCell>

      <TableCell className="text-sm text-center">
        {isLoading ? (
          <div className="h-4 w-20 bg-gray-200 animate-pulse rounded mx-auto"></div>
        ) : (
          <span className={`px-2 py-1 text-xs rounded-full ${
            batchedContactStatus?.latest === 'Called - Answered' ? 'bg-green-100 text-green-800' :
            batchedContactStatus?.latest === 'Called - No Response' ? 'bg-red-100 text-red-800' :
            batchedContactStatus?.latest === 'Customer Funded the Account' ? 'bg-blue-100 text-blue-800' :
            batchedContactStatus?.latest === 'PTP Given' ? 'bg-yellow-100 text-yellow-800' :
            batchedContactStatus?.latest === 'Rude Customer' ? 'bg-red-100 text-red-800' :
            batchedContactStatus?.latest === 'Wrong Number' ? 'bg-gray-100 text-gray-800' :
            'bg-gray-100 text-gray-600'
          }`}>
            {batchedContactStatus?.latest || 'No Calls'}
          </span>
        )}
      </TableCell>
      
      <TableCell className="text-sm">
        {isLoading ? (
          <div className="space-y-1">
            <div className="h-3 w-16 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-3 w-20 bg-gray-200 animate-pulse rounded"></div>
          </div>
        ) : (
          <CallStatusDisplay 
            application={application} 
            selectedMonth={selectedEmiMonth}
            batchedContactStatus={batchedContactStatus}
          />
        )}
      </TableCell>
      
      <TableCell className="max-w-[200px]">
        {isLoading ? (
          <div className="space-y-1">
            <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
          </div>
        ) : (
          <CommentsDisplay 
            comments={batchedComments}
            hasComments={batchedComments.length > 0}
          />
        )}
      </TableCell>
    </TableRow>
  );
});

ApplicationRow.displayName = "ApplicationRow";

export default ApplicationRow;
