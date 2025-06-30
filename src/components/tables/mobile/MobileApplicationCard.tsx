
import { memo, useEffect, useState } from "react";
import { Application } from "@/types/application";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, User, Building, Phone } from "lucide-react";
import { formatCurrency, formatPtpDate } from "@/utils/formatters";
import CallButton from "../../CallButton";
import CallStatusDisplay from "../../CallStatusDisplay";
import { useFieldStatus } from "@/hooks/useFieldStatus";
import { useMonthlyApplicationData } from "@/hooks/useMonthlyApplicationData";
import { usePtpDates } from "@/hooks/usePtpDates";
import { useComments } from "@/hooks/useComments";
import { useBatchContactCallingStatus } from "@/hooks/useBatchContactCallingStatus";
import type { BatchContactStatus } from "@/hooks/useBatchContactCallingStatus";

interface MobileApplicationCardProps {
  application: Application;
  onRowClick: (application: Application) => void;
  selectedApplicationId?: string;
  selectedMonth: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
    case 'Unpaid': return 'bg-red-100 text-red-800 border-red-200';
    case 'Partially Paid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Cash Collected from Customer': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Customer Deposited to Bank': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getCallingStatusColor = (status: string) => {
  switch (status) {
    case 'Called - Answered': return 'bg-green-100 text-green-800';
    case 'Called - No Response': return 'bg-red-100 text-red-800';
    case 'Customer Funded the Account': return 'bg-blue-100 text-blue-800';
    case 'PTP Given': return 'bg-yellow-100 text-yellow-800';
    case 'Rude Customer': return 'bg-red-100 text-red-800';
    case 'Wrong Number': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const truncateText = (text: string, maxLength: number = 20) => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const MobileApplicationCard = memo(({ 
  application, 
  onRowClick, 
  selectedApplicationId,
  selectedMonth
}: MobileApplicationCardProps) => {
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

  // Fetch calling status
  const { fetchBatchContactStatus } = useBatchContactCallingStatus();
  const [callingStatus, setCallingStatus] = useState<BatchContactStatus>();
  useEffect(() => {
    const fetchCallingStatus = async () => {
      const statusMap = await fetchBatchContactStatus([application.applicant_id], monthToShow);
      setCallingStatus(statusMap[application.applicant_id]);
    };
    fetchCallingStatus();
  }, [application.applicant_id, monthToShow, fetchBatchContactStatus]);

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
        selectedApplicationId === application.id ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-lg'
      }`}
      onClick={() => onRowClick(application)}
    >
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-gray-900 truncate">
              {application.applicant_name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              ID: {application.applicant_id}
            </p>
          </div>
          <div className="flex flex-col gap-1 ml-3">
            <Badge className={`text-xs px-2 py-1 ${getStatusColor(status)}`}>
              {status}
            </Badge>
            <Eye className="h-4 w-4 text-gray-400 self-center" />
          </div>
        </div>

        {/* EMI Amount */}
        <div className="mb-3">
          <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
            <span className="text-xs text-blue-600 font-medium">EMI Amount</span>
            <p className="text-lg font-bold text-blue-800">{formatCurrency(monthData.emi_amount || application.emi_amount)}</p>
          </div>
        </div>

        {/* Calling Status */}
        {callingStatus?.latest && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-600" />
              <span className="text-xs text-gray-600 font-medium">Latest Call Status:</span>
            </div>
            <Badge className={`mt-1 text-xs px-2 py-1 ${getCallingStatusColor(callingStatus.latest)}`}>
              {callingStatus.latest}
            </Badge>
          </div>
        )}

        {/* Contact & Action Row */}
        <div className="flex items-center justify-between mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-600" />
            <CallStatusDisplay application={{...application, ...monthData}} selectedMonth={monthToShow} batchedContactStatus={callingStatus} />
          </div>
          {application.applicant_mobile && (
            <CallButton 
              name="Call" 
              phone={application.applicant_mobile}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5"
            />
          )}
        </div>

        {/* Business Info - Updated to 2x3 grid to include Collection RM */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3 text-gray-400" />
            <div>
              <span className="text-gray-500">Lender:</span>
              <p className="font-medium truncate text-gray-800">
                {application.lender_name === 'Vivriti Capital Limited' ? 'Vivriti' : application.lender_name}
              </p>
            </div>
          </div>
          <div>
            <span className="text-gray-500">RM:</span>
            <p className="font-medium truncate text-gray-800">{application.rm_name}</p>
          </div>
          <div>
            <span className="text-gray-500">Dealer:</span>
            <p className="font-medium truncate text-gray-800">{truncateText(application.dealer_name, 15)}</p>
          </div>
          <div>
            <span className="text-gray-500">Branch:</span>
            <p className="font-medium truncate text-gray-800">{application.branch_name}</p>
          </div>
          {application.collection_rm && (
            <>
              <div>
                <span className="text-gray-500">Collection RM:</span>
                <p className="font-medium truncate text-gray-800">{truncateText(application.collection_rm, 15)}</p>
              </div>
              <div></div> {/* Empty cell to maintain grid alignment */}
            </>
          )}
        </div>

        {/* PTP Date */}
        <div className={`${ptpDate ? 'mb-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400' : ''}`}>
          {ptpDate && (
            <>
              <span className="text-xs text-yellow-700 font-medium">PTP Date:</span>
              <p className="text-sm font-bold text-yellow-800">
                {formatPtpDate(ptpDate)}
              </p>
            </>
          )}
        </div>

        {/* Recent Comments */}
        {comments && comments.length > 0 && (
          <div className="border-t pt-3">
            <span className="text-xs text-gray-500 font-medium">Recent Comments:</span>
            <div className="mt-2 space-y-2">
              {comments.slice(0, 2).map((comment, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-2 border-blue-200">
                  <div className="text-xs font-semibold text-blue-700 mb-1">{comment.user_name}:</div>
                  <p className="text-xs text-gray-700 leading-relaxed">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MobileApplicationCard.displayName = "MobileApplicationCard";

export default MobileApplicationCard;
