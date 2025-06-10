
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface DateRangePickerProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

const DateRangePicker = ({ dateRange, onDateRangeChange }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to });
      setIsOpen(false);
    }
  };

  const quickRanges = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
    { label: "Last 6 months", days: 180 },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="p-3 border-r">
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick ranges</p>
              {quickRanges.map((range) => (
                <Button
                  key={range.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    const to = new Date();
                    const from = new Date(Date.now() - range.days * 24 * 60 * 60 * 1000);
                    onDateRangeChange({ from, to });
                    setIsOpen(false);
                  }}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
          <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
