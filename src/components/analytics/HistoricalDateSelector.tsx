
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useHistoricalAnalytics } from '@/hooks/useHistoricalAnalytics';

interface HistoricalDateSelectorProps {
  selectedDate?: string;
  onDateChange: (date: string | undefined) => void;
  onGenerateSnapshot?: (date: string) => void;
}

const HistoricalDateSelector = ({ 
  selectedDate, 
  onDateChange, 
  onGenerateSnapshot 
}: HistoricalDateSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState('00:00');
  const { getAvailableDates, loading } = useHistoricalAnalytics();

  useEffect(() => {
    const loadAvailableDates = async () => {
      const dates = await getAvailableDates();
      setAvailableDates(dates);
    };
    
    loadAvailableDates();
  }, []);

  useEffect(() => {
    // Extract time from selected date if it includes time
    if (selectedDate && selectedDate.includes('T')) {
      const dateTime = new Date(selectedDate);
      setSelectedTime(format(dateTime, 'HH:mm'));
    }
  }, [selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Combine selected date with selected time
      const [hours, minutes] = selectedTime.split(':');
      const dateWithTime = new Date(date);
      dateWithTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const dateTimeStr = format(dateWithTime, "yyyy-MM-dd'T'HH:mm:ss");
      onDateChange(dateTimeStr);
    } else {
      onDateChange(undefined);
    }
    setOpen(false);
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    
    // Update the selected date with new time if a date is already selected
    if (selectedDate) {
      const currentDate = selectedDate.includes('T') 
        ? new Date(selectedDate) 
        : new Date(selectedDate + 'T00:00:00');
      
      const [hours, minutes] = time.split(':');
      currentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const dateTimeStr = format(currentDate, "yyyy-MM-dd'T'HH:mm:ss");
      onDateChange(dateTimeStr);
    }
  };

  const handleGenerateSnapshot = () => {
    if (selectedDate && onGenerateSnapshot) {
      // For snapshot generation, use just the date part
      const dateOnly = selectedDate.split('T')[0];
      onGenerateSnapshot(dateOnly);
    }
  };

  const isHistoricalMode = !!selectedDate;
  const dateOnly = selectedDate ? selectedDate.split('T')[0] : undefined;
  const hasSnapshotForDate = dateOnly ? availableDates.includes(dateOnly) : false;

  const getDisplayDate = () => {
    if (!selectedDate) return undefined;
    
    try {
      const date = new Date(selectedDate);
      return date;
    } catch {
      return undefined;
    }
  };

  const formatDisplayText = () => {
    if (!selectedDate) return "Select historical date & time";
    
    try {
      const date = new Date(selectedDate);
      return format(date, 'PPP p'); // Date and time format
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDisplayText()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="space-y-4 p-4">
              <Calendar
                mode="single"
                selected={getDisplayDate()}
                onSelect={handleDateSelect}
                disabled={(date) => date > new Date()}
                initialFocus
                className="pointer-events-auto"
              />
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {selectedDate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDateChange(undefined)}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isHistoricalMode && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Historical View
            </Badge>

            {!hasSnapshotForDate && onGenerateSnapshot && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSnapshot}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                Generate Snapshot
              </Button>
            )}

            {hasSnapshotForDate && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                Snapshot Available
              </Badge>
            )}
          </div>
        )}

        {!isHistoricalMode && (
          <Badge variant="default" className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Live Data
          </Badge>
        )}
      </div>
    </div>
  );
};

export default HistoricalDateSelector;
