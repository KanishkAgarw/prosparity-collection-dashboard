
import { memo, useEffect, useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Application } from "@/types/application";
import { formatEmiMonth, formatCurrency, formatPtpDate } from "@/utils/formatters";
import StatusBadge from "./StatusBadge";
import ApplicationDetails from "./ApplicationDetails";
import CallStatusDisplay from "../CallStatusDisplay";
import CommentsDisplay from "./CommentsDisplay";
import { useFieldStatus } from "@/hooks/useFieldStatus";
import { useMonthlyApplicationData } from "@/hooks/useMonthlyApplicationData";
import { usePtpDates } from "@/hooks/usePtpDates";
import { useComments } from "@/hooks/useComments";

interface ApplicationRowProps {
  application: Application;
  selectedApplicationId?: string;
  onRowClick: (application: Application) => void;
  selectedEmiMonth?: string | null;
}

const ApplicationRow = memo(({ 
  application, 
  selectedApplicationId, 
  onRowClick,
  selectedEmiMonth
}: ApplicationRowProps) => {
  const { monthlyData, availableMonths } = useMonthlyApplicationData(application.applicant_id);
  
  // Use the selected EMI month directly - this is the key fix
  const monthToShow = selectedEmiMonth || application.demand_date;

  console.log('ApplicationRow - Application ID:', application.applicant_id);
  console.log('ApplicationRow - Selected EMI Month:', selectedEmiMonth);
  console.log('ApplicationRow - Month to show data for:', monthToShow);

  // Fetch per-month status using the selected month
  const { fetchFieldStatus } = useFieldStatus();
  const [status, setStatus] = useState<string>('Unpaid');
  useEffect(() => {
    const fetchStatus = async () => {
      if (monthToShow) {
        console.log(`Fetching field status for ${application.applicant_id} and month ${monthToShow}`);
        const statusMap = await fetchFieldStatus([application.applicant_id], monthToShow);
        const newStatus = statusMap[application.applicant_id] || 'Unpaid';
        console.log(`Field status result for ${application.applicant_id}:`, newStatus);
        setStatus(newStatus);
      }
    };
    fetchStatus();
  }, [application.applicant_id, monthToShow, fetchFieldStatus]);

  // Fetch per-month PTP date using the selected month
  const { fetchPtpDate } = usePtpDates();
  const [ptpDate, setPtpDate] = useState<string | null>(null);
  useEffect(() => {
    const fetchPtp = async () => {
      if (monthToShow) {
        console.log(`Fetching PTP date for ${application.applicant_id} and month ${monthToShow}`);
        const date = await fetchPtpDate(application.applicant_id, monthToShow);
        console.log(`PTP date result for ${application.applicant_id}:`, date);
        setPtpDate(date);
      }
    };
    fetchPtp();
  }, [application.applicant_id, monthToShow, fetchPtpDate]);

  // Fetch per-month comments using the selected month
  const { comments, fetchComments } = useComments(monthToShow);
  useEffect(() => {
    if (monthToShow) {
      console.log(`Fetching comments for ${application.applicant_id} and month ${monthToShow}`);
      fetchComments(application.applicant_id);
    }
  }, [application.applicant_id, monthToShow, fetchComments]);

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
        <StatusBadge status={status} />
      </TableCell>
      
      <TableCell className={`${ptpDate ? 'text-blue-600 font-medium' : 'text-gray-400'} whitespace-nowrap`}>
        {ptpDate ? formatPtpDate(ptpDate) : 'Not Set'}
      </TableCell>
      
      <TableCell className="text-sm">
        <CallStatusDisplay application={application} selectedMonth={monthToShow} />
      </TableCell>
      
      <TableCell className="max-w-[200px]">
        <CommentsDisplay comments={comments} />
      </TableCell>
    </TableRow>
  );
});

ApplicationRow.displayName = "ApplicationRow";

export default ApplicationRow;
