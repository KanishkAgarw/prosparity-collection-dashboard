
import { memo } from "react";
import { Application } from "@/types/application";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/tables/StatusBadge";
import { formatPtpDateForDisplay, categorizePtpDate, getPtpDateCategoryColor } from "@/utils/ptpDateUtils";

interface MobileApplicationCardProps {
  application: Application;
  onClick: (application: Application) => void;
  isSelected?: boolean;
  selectedEmiMonth?: string | null;
}

const MobileApplicationCard = memo(({
  application,
  onClick,
  isSelected,
  selectedEmiMonth
}: MobileApplicationCardProps) => {
  const ptpCategory = categorizePtpDate(application.ptp_date);
  const ptpColorClass = getPtpDateCategoryColor(ptpCategory);

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md border ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:border-gray-300'
      }`}
      onClick={() => onClick(application)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Application Details & EMI Amount */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                {application.applicant_name}
              </h3>
              <p className="text-xs text-gray-500">ID: {application.applicant_id}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                ₹{application.emi_amount?.toLocaleString() || '0'}
              </div>
              {selectedEmiMonth && (
                <div className="text-xs text-gray-500">
                  {selectedEmiMonth}
                </div>
              )}
            </div>
          </div>

          {/* Status & PTP Date */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Status</span>
              <StatusBadge status={application.lms_status} />
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 block mb-1">PTP Date</span>
              {application.ptp_date ? (
                <div className={`text-sm font-medium ${ptpColorClass}`}>
                  {formatPtpDateForDisplay(application.ptp_date)}
                </div>
              ) : (
                <div className="text-sm text-gray-400">No PTP Date</div>
              )}
            </div>
          </div>

          {/* Calling Status & Team Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Calling Status:</span>
              <p className="font-medium text-gray-700">{application.latest_calling_status || application.applicant_calling_status || 'Not Called'}</p>
            </div>
            <div>
              <span className="text-gray-500">Branch:</span>
              <p className="font-medium text-gray-700 truncate">{application.branch_name}</p>
            </div>
          </div>

          {/* Recent Comments */}
          <div>
            <span className="text-xs text-gray-500 block mb-1">Recent Comments</span>
            {application.recent_comments && application.recent_comments.length > 0 ? (
              <div className="space-y-1 max-h-12 overflow-y-auto">
                {application.recent_comments.slice(0, 2).map((comment, index) => (
                  <div key={index} className="text-xs">
                    <span className="font-medium text-gray-700">
                      {comment.user_name || 'Unknown'}:
                    </span>
                    <span className="text-gray-600 ml-1">
                      {comment.content}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No comments</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MobileApplicationCard.displayName = "MobileApplicationCard";

export default MobileApplicationCard;
