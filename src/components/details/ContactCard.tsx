
import { Application } from "@/types/application";
import CallButton from "../CallButton";
import CallStatusSelector from "../CallStatusSelector";

interface ContactCardProps {
  title: string;
  name: string;
  mobile?: string;
  currentStatus?: string;
  onStatusChange: (status: string) => void;
}

const ContactCard = ({ title, name, mobile, currentStatus, onStatusChange }: ContactCardProps) => {
  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
          <p className="text-sm text-gray-600 break-words">{name}</p>
          {mobile && (
            <p className="text-xs text-gray-500 break-all">{mobile}</p>
          )}
        </div>
        <CallButton 
          name="Call" 
          phone={mobile}
          variant="outline"
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Status:</span>
        <CallStatusSelector
          currentStatus={currentStatus}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
};

export default ContactCard;
