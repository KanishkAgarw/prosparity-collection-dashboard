
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Block - Application Details */}
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {application.applicant_name}
              </h3>
              <p className="text-xs text-gray-500">ID: {application.applicant_id}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">EMI:</span>
                <span className="font-medium text-sm">
                  ₹{application.emi_amount?.toLocaleString() || '0'}
                </span>
                {selectedEmiMonth && (
                  <span className="text-xs text-gray-500">({selectedEmiMonth})</span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>
                  <span className="text-gray-500">Branch:</span>
                  <p className="font-medium text-gray-700 truncate">{application.branch_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">TL:</span>
                  <p className="font-medium text-gray-700 truncate">{application.team_lead}</p>
                </div>
                <div>
                  <span className="text-gray-500">RM:</span>
                  <p className="font-medium text-gray-700 truncate">{application.rm_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Collection RM:</span>
                  <p className="font-medium text-gray-700 truncate">{application.collection_rm || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Dealer:</span>
                  <p className="font-medium text-gray-700 truncate">{application.dealer_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Lender:</span>
                  <p className="font-medium text-gray-700 truncate">{application.lender_name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Block - Status and PTP Date */}
          <div className="space-y-3">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Status</span>
              <StatusBadge status={application.lms_status} />
            </div>
            
            {application.ptp_date && (
              <div>
                <span className="text-xs text-gray-500 block mb-1">PTP Date</span>
                <div className={`text-sm font-medium ${ptpColorClass}`}>
                  {formatPtpDateForDisplay(application.ptp_date)}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Principal:</span>
                <p className="font-medium">₹{application.principle_due?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <span className="text-gray-500">Interest:</span>
                <p className="font-medium">₹{application.interest_due?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>

          {/* Right Block - Recent Comments */}
          <div className="space-y-2">
            <span className="text-xs text-gray-500 block">Recent Comments</span>
            {application.recent_comments && application.recent_comments.length > 0 ? (
              <div className="space-y-2 max-h-20 overflow-y-auto">
                {application.recent_comments.slice(0, 2).map((comment, index) => (
                  <div key={index} className="text-xs">
                    <div className="flex items-start gap-1">
                      <span className="font-medium text-gray-700 text-xs">
                        {comment.user_name || 'Unknown'}:
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs leading-tight mt-1 line-clamp-2">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No recent comments</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ApplicationCard.displayName = "ApplicationCard";

export default ApplicationCard;
