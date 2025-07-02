
import { memo } from "react";
import { Application } from "@/types/application";
import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "@/components/tables/StatusBadge";
import { formatPtpDateForDisplay, categorizePtpDate, getPtpDateCategoryColor } from "@/utils/ptpDateUtils";

interface ApplicationCardProps {
  application: Application;
  onClick: (application: Application) => void;
  isSelected?: boolean;
  selectedEmiMonth?: string | null;
}

const ApplicationCard = memo(({
  application,
  onClick,
  isSelected,
  selectedEmiMonth
}: ApplicationCardProps) => {
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
        <div className="grid grid-cols-6 gap-4 items-center">
          {/* Application Details */}
          <div className="col-span-1">
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900 text-sm">
                {application.applicant_name}
              </h3>
              <p className="text-xs text-gray-500">ID: {application.applicant_id}</p>
              <div className="text-xs text-gray-600 space-y-0.5">
                <div>Branch: <span className="font-medium">{application.branch_name}</span></div>
                <div>TL: <span className="font-medium">{application.team_lead}</span></div>
                <div>RM: <span className="font-medium">{application.rm_name}</span></div>
              </div>
            </div>
          </div>

          {/* EMI Amount */}
          <div className="col-span-1 text-center">
            <div className="space-y-1">
              <div className="text-lg font-bold text-gray-900">
                ₹{application.emi_amount?.toLocaleString() || '0'}
              </div>
              {selectedEmiMonth && (
                <div className="text-xs text-gray-500">
                  EMI for {selectedEmiMonth}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="col-span-1 text-center">
            <StatusBadge status={application.lms_status} />
          </div>

          {/* PTP Date */}
          <div className="col-span-1 text-center">
            {application.ptp_date ? (
              <div className={`text-sm font-medium ${ptpColorClass}`}>
                {formatPtpDateForDisplay(application.ptp_date)}
              </div>
            ) : (
              <div className="text-sm text-gray-400">No PTP Date</div>
            )}
          </div>

          {/* Calling Status */}
          <div className="col-span-1 text-center">
            <div className="text-sm text-gray-600">
              {application.latest_calling_status || application.applicant_calling_status || 'Not Called'}
            </div>
          </div>

          {/* Recent Comments */}
          <div className="col-span-1">
            <div className="space-y-1">
              <span className="text-xs text-gray-500 block">Recent Comments</span>
              {application.recent_comments && application.recent_comments.length > 0 ? (
                <div className="space-y-1 max-h-16 overflow-y-auto">
                  {application.recent_comments.slice(0, 2).map((comment, index) => (
                    <div key={index} className="text-xs">
                      <div className="font-medium text-gray-700 truncate">
                        {comment.user_name || 'Unknown'}:
                      </div>
                      <p className="text-gray-600 text-xs leading-tight line-clamp-1">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No comments</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ApplicationCard.displayName = "ApplicationCard";

export default ApplicationCard;
