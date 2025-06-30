
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
  // Get the calling status from batched data
  const callingStatus = batchedContactStatus?.calling_status || 'Not Called';
  
  // Get status color and icon based on calling status
  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'customer funded the account':
        return { color: 'bg-green-600 text-white', icon: PhoneCall };
      case 'customer will fund the account on a future date':
        return { color: 'bg-blue-600 text-white', icon: PhoneCall };
      case 'cash collected':
        return { color: 'bg-green-700 text-white', icon: PhoneCall };
      case 'cash will be collected on a future date':
        return { color: 'bg-blue-700 text-white', icon: PhoneCall };
      case 'spoken – no commitment':
        return { color: 'bg-yellow-600 text-white', icon: Phone };
      case 'refused / unable to fund':
        return { color: 'bg-red-600 text-white', icon: PhoneOff };
      case 'no response':
        return { color: 'bg-gray-600 text-white', icon: PhoneOff };
      case 'not called':
      default:
        return { color: 'bg-gray-400 text-white', icon: Phone };
    }
  };

  const { color, icon: StatusIcon } = getStatusDisplay(callingStatus);

  return (
    <div className="flex items-center gap-2">
      <StatusIcon className="h-4 w-4 text-gray-500" />
      <div className="space-y-1">
        <Badge className={`${color} text-xs px-2 py-1`}>
          {callingStatus}
        </Badge>
        {batchedContactStatus?.contact_type && (
          <div className="text-xs text-gray-500 capitalize">
            {batchedContactStatus.contact_type}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallStatusDisplay;
