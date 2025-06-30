
import { Phone, PhoneCall, PhoneOff } from "lucide-react";
import { Application } from "@/types/application";
import { Badge } from "@/components/ui/badge";
import type { BatchContactStatus } from "@/hooks/useBatchContactCallingStatus";

interface CallStatusDisplayProps {
  application: Application;
  selectedMonth?: string | null;
  batchedContactStatus?: BatchContactStatus;
}

const CallStatusDisplay = ({ application, selectedMonth, batchedContactStatus }: CallStatusDisplayProps) => {
  // Get the calling status from batched data, fallback to application's latest_calling_status
  const overallCallingStatus = batchedContactStatus?.calling_status || application.latest_calling_status || 'Not Called';
  
  // Get status color based on calling status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'customer funded the account':
        return 'bg-green-600 text-white';
      case 'customer will fund the account on a future date':
        return 'bg-blue-600 text-white';
      case 'cash collected':
        return 'bg-green-700 text-white';
      case 'cash will be collected on a future date':
        return 'bg-blue-700 text-white';
      case 'spoken – no commitment':
        return 'bg-yellow-600 text-white';
      case 'refused / unable to fund':
        return 'bg-red-600 text-white';
      case 'no response':
        return 'bg-gray-600 text-white';
      case 'not called':
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="text-xs font-medium text-gray-700">
        Calling Status
      </div>
      
      {/* Individual Contact Statuses */}
      <div className="space-y-1">
        {/* Applicant Status */}
        {batchedContactStatus?.applicant && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600 w-20">Applicant:</span>
            <Badge className={`${getStatusColor(batchedContactStatus.applicant.status)} text-xs px-2 py-1`}>
              {batchedContactStatus.applicant.status}
            </Badge>
          </div>
        )}
        
        {/* Co-Applicant Status */}
        {batchedContactStatus?.coApplicant && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600 w-20">Co-Applicant:</span>
            <Badge className={`${getStatusColor(batchedContactStatus.coApplicant.status)} text-xs px-2 py-1`}>
              {batchedContactStatus.coApplicant.status}
            </Badge>
          </div>
        )}
        
        {/* Reference Status */}
        {batchedContactStatus?.reference && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600 w-20">Reference:</span>
            <Badge className={`${getStatusColor(batchedContactStatus.reference.status)} text-xs px-2 py-1`}>
              {batchedContactStatus.reference.status}
            </Badge>
          </div>
        )}
        
        {/* If no individual statuses available, show a fallback */}
        {!batchedContactStatus?.applicant && !batchedContactStatus?.coApplicant && !batchedContactStatus?.reference && (
          <div className="text-xs text-gray-500">
            No contact status data available
          </div>
        )}
      </div>
      
      {/* Overall Calling Status */}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-gray-500" />
          <Badge className={`${getStatusColor(overallCallingStatus)} text-xs px-2 py-1`}>
            {overallCallingStatus}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default CallStatusDisplay;
