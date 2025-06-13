
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface PlanVsAchievementDatePickerProps {
  selectedDateTime: Date | null;
  onDateTimeChange: (dateTime: Date | null) => void;
}

const PlanVsAchievementDatePicker = ({ selectedDateTime, onDateTimeChange }: PlanVsAchievementDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeValue, setTimeValue] = useState(
    selectedDateTime ? format(selectedDateTime, 'HH:mm') : '00:00'
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      const newDateTime = new Date(date);
      newDateTime.setHours(hours, minutes, 0, 0);
      onDateTimeChange(newDateTime);
    } else {
      onDateTimeChange(null);
    }
  };

  const handleTimeChange = (time: string) => {
    setTimeValue(time);
    if (selectedDateTime) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setHours(hours, minutes, 0, 0);
      onDateTimeChange(newDateTime);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Select Criteria for Plan vs Achievement Report</Label>
      <div className="text-xs text-gray-600 mb-2">
        Find applications where:
        <br />• PTP date is set to the selected date
        <br />• PTP was created on or before the selected date/time
      </div>
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-start text-left font-normal flex-1"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDateTime ? format(selectedDateTime, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDateTime || undefined}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <Input
            type="time"
            value={timeValue}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-24"
          />
        </div>
      </div>
      {selectedDateTime && (
        <div className="text-xs text-gray-600 p-2 bg-blue-50 rounded">
          <strong>Report will include:</strong>
          <br />
          Applications with PTP date = <strong>{format(selectedDateTime, 'PPP')}</strong>
          <br />
          Where PTP was set on or before <strong>{format(selectedDateTime, 'PPP')} at {format(selectedDateTime, 'HH:mm')}</strong>
        </div>
      )}
    </div>
  );
};

export default PlanVsAchievementDatePicker;
