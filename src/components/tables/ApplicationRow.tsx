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
  selectedMonth: string;
}

const ApplicationRow = memo(({ 
  application, 
  selectedApplicationId, 
  onRowClick,
  selectedMonth
}: ApplicationRowProps) => {
  const { monthlyData, availableMonths } = useMonthlyApplicationData(application.applicant_id);
  const monthToShow = selectedMonth || availableMonths[availableMonths.length - 1];
  const monthData = monthlyData.find(item => item.demand_date === monthToShow) || {};

  // Fetch per-month status
  const { fetchFieldStatus } = useFieldStatus();
  const [status, setStatus] = useState<string>('Unpaid');
  useEffect(() => {
    const fetchStatus = async () => {
      const statusMap = await fetchFieldStatus([application.applicant_id], monthToShow);
      setStatus(statusMap[application.applicant_id] || 'Unpaid');
    };
    fetchStatus();
  }, [application.applicant_id, monthToShow, fetchFieldStatus]);

  // Fetch per-month PTP date
  const { fetchPtpDate } = usePtpDates();
  const [ptpDate, setPtpDate] = useState<string | null>(null);
  useEffect(() => {
    const fetchPtp = async () => {
      const date = await fetchPtpDate(application.applicant_id, monthToShow);
      setPtpDate(date);
    };
    fetchPtp();
  }, [application.applicant_id, monthToShow, fetchPtpDate]);

  // Fetch per-month comments
  const { comments, fetchComments } = useComments(monthToShow);
  useEffect(() => {
    fetchComments(application.applicant_id);
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
        <ApplicationDetails application={{ ...application, ...monthData }} />
      </TableCell>
      
      <TableCell className="font-medium text-blue-600">
        {formatCurrency(monthData.emi_amount || application.emi_amount)}
      </TableCell>
      
      <TableCell>
        <StatusBadge status={status} />
      </TableCell>
      
      <TableCell className={`${ptpDate ? 'text-blue-600 font-medium' : 'text-gray-400'} whitespace-nowrap`}>
        {ptpDate ? formatPtpDate(ptpDate) : 'Not Set'}
      </TableCell>
      
      <TableCell className="text-sm">
        <CallStatusDisplay application={{...application, ...monthData}} selectedMonth={monthToShow} />
      </TableCell>
      
      <TableCell className="max-w-[200px]">
        <CommentsDisplay comments={comments} />
      </TableCell>
    </TableRow>
  );
});

ApplicationRow.displayName = "ApplicationRow";

export default ApplicationRow;
