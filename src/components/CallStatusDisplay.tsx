
import { Phone } from "lucide-react";
import { CircleCheck, CircleX, Circle } from "lucide-react";
import { Application } from "@/types/application";
import type { BatchContactStatus } from "@/hooks/useBatchContactCallingStatus";

interface CallStatusDisplayProps {
  application: Application;
  selectedMonth?: string | null;
  batchedContactStatus?: BatchContactStatus;
}

const CallStatusDisplay = ({ application, selectedMonth, batchedContactStatus }: CallStatusDisplayProps) => {
  // Get the calling status from batched data, fallback to application's latest_calling_status
  const overallCallingStatus = batchedContactStatus?.calling_status || application.latest_calling_status || 'Not Called';
  
  // Categorize status into one of three types for icon mapping
  const getStatusCategory = (status: string): 'not-called' | 'unsuccessful' | 'answered' => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'not called') {
      return 'not-called';
    }
    
    if (statusLower === 'no response' || statusLower === 'refused / unable to fund') {
      return 'unsuccessful';
    }
    
    // All other statuses (customer funded, cash collected, will fund, will collect, spoken no commitment)
    return 'answered';
  };

  // Get icon and color based on status category
  const getStatusIcon = (status: string) => {
    const category = getStatusCategory(status);
    
    switch (category) {
      case 'not-called':
        return { Icon: Circle, color: 'text-gray-400' };
      case 'unsuccessful':
        return { Icon: CircleX, color: 'text-red-500' };
      case 'answered':
        return { Icon: CircleCheck, color: 'text-green-500' };
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
            <span className="text-gray-600 w-16">Applicant:</span>
            {(() => {
              const { Icon, color } = getStatusIcon(batchedContactStatus.applicant.status);
              return <Icon className={`h-3 w-3 ${color}`} />;
            })()}
            <span className="text-gray-700">{batchedContactStatus.applicant.status}</span>
          </div>
        )}
        
        {/* Co-Applicant Status */}
        {batchedContactStatus?.coApplicant && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600 w-16">Co-Applicant:</span>
            {(() => {
              const { Icon, color } = getStatusIcon(batchedContactStatus.coApplicant.status);
              return <Icon className={`h-3 w-3 ${color}`} />;
            })()}
            <span className="text-gray-700">{batchedContactStatus.coApplicant.status}</span>
          </div>
        )}
        
        {/* Reference Status */}
        {batchedContactStatus?.reference && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600 w-16">Reference:</span>
            {(() => {
              const { Icon, color } = getStatusIcon(batchedContactStatus.reference.status);
              return <Icon className={`h-3 w-3 ${color}`} />;
            })()}
            <span className="text-gray-700">{batchedContactStatus.reference.status}</span>
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
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-600">Overall:</span>
          {(() => {
            const { Icon, color } = getStatusIcon(overallCallingStatus);
            return <Icon className={`h-3 w-3 ${color}`} />;
          })()}
          <span className="text-gray-700">{overallCallingStatus}</span>
        </div>
      </div>
    </div>
  );
};

export default CallStatusDisplay;
