
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CallStatusSelectorProps {
  currentStatus?: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

const CALLING_STATUS_OPTIONS = [
  { value: "Not Called", color: "text-gray-600" },
  { value: "Called - Unsuccessful", color: "text-red-600" },
  { value: "Called - Answered", color: "text-green-600" }
];

const CallStatusSelector = ({ currentStatus, onStatusChange, disabled }: CallStatusSelectorProps) => {
  const currentOption = CALLING_STATUS_OPTIONS.find(opt => opt.value === currentStatus) || CALLING_STATUS_OPTIONS[0];

  return (
    <Select 
      value={currentStatus || "Not Called"} 
      onValueChange={onStatusChange}
      disabled={disabled}
    >
      <SelectTrigger className={`w-40 h-8 text-xs ${currentOption.color}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CALLING_STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className={`text-xs ${option.color}`}>
            {option.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CallStatusSelector;
