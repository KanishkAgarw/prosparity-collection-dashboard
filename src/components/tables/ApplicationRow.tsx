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
      className={`cursor-pointer transition-colors align-top ${
        selectedApplicationId === application.id
          ? 'bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100'
          : 'hover:bg-gray-50'
      }`}
      onClick={handleRowClick}
    >
      {/* Application Details */}
      <TableCell className="py-4 align-top w-[24%]">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-blue-800">{application.applicant_name}</span>
          <span className="text-xs text-gray-700">ID: {application.applicant_id}</span>
          <span className="text-xs text-gray-700">EMI Month: {formatEmiMonth(application.demand_date)}</span>
          <span className="text-xs text-gray-700">Branch: {application.branch_name}</span>
          <span className="text-xs text-gray-700">TL: {application.team_lead}</span>
          <span className="text-xs text-gray-700">RM: {application.rm_name}</span>
          {application.collection_rm && (
            <span className="text-xs text-gray-700">Collection RM: {application.collection_rm}</span>
          )}
          <span className="text-xs text-gray-700">Dealer: {application.dealer_name}</span>
          <span className="text-xs text-gray-700">Lender: {application.lender_name}</span>
        </div>
      </TableCell>

      {/* EMI Amount */}
      <TableCell className="py-4 align-top text-blue-600 font-semibold text-base w-[10%]">
        {formatCurrency(application.emi_amount)}
      </TableCell>

      {/* Status */}
      <TableCell className="py-4 align-top w-[10%]">
        <StatusBadge status={batchedStatus} />
      </TableCell>

      {/* PTP Date */}
      <TableCell className="py-4 align-top w-[12%]">
        <span className={batchedPtpDate && formatPtpDate(batchedPtpDate) !== "Not Set" ? "text-blue-600 font-medium underline" : "text-gray-400"}>
          {batchedPtpDate ? formatPtpDate(batchedPtpDate) : "Not Set"}
        </span>
      </TableCell>

      {/* Calling Status */}
      <TableCell className="py-4 align-top w-[14%]">
        <CallStatusDisplay
          application={application}
          selectedMonth={selectedEmiMonth}
          batchedContactStatus={batchedContactStatus}
        />
      </TableCell>

      {/* Recent Comments */}
      <TableCell className="py-4 align-top w-[20%]">
        <CommentsDisplay
          comments={batchedComments}
          hasComments={batchedComments.length > 0}
        />
      </TableCell>
    </TableRow>
  );
});

ApplicationRow.displayName = "ApplicationRow";

export default ApplicationRow;
