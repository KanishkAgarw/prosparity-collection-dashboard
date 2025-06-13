
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const { getAvailableDates, loading } = useHistoricalAnalytics();

  useEffect(() => {
    const loadAvailableDates = async () => {
      const dates = await getAvailableDates();
      setAvailableDates(dates);
    };
    
    loadAvailableDates();
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      onDateChange(dateStr);
    } else {
      onDateChange(undefined);
    }
    setOpen(false);
  };

  const handleGenerateSnapshot = () => {
    if (selectedDate && onGenerateSnapshot) {
      onGenerateSnapshot(selectedDate);
    }
  };

  const isHistoricalMode = !!selectedDate;
  const hasSnapshotForDate = selectedDate ? availableDates.includes(selectedDate) : false;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(new Date(selectedDate), 'PPP')
              ) : (
                <span>Select historical date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate ? new Date(selectedDate) : undefined}
              onSelect={handleDateSelect}
              disabled={(date) => date > new Date()}
              initialFocus
            />
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
