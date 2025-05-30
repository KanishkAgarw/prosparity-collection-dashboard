
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CallStatusSelectorProps {
  currentStatus?: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

const CALLING_STATUS_OPTIONS = [
  "Not Called",
  "Called - Answered", 
  "Called - Didn't Pick Up",
  "Called - Busy",
  "Called - Wrong Number",
  "Called - Not Reachable"
];

const CallStatusSelector = ({ currentStatus, onStatusChange, disabled }: CallStatusSelectorProps) => {
  return (
    <Select 
      value={currentStatus || "Not Called"} 
      onValueChange={onStatusChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-40 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CALLING_STATUS_OPTIONS.map((status) => (
          <SelectItem key={status} value={status} className="text-xs">
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CallStatusSelector;
