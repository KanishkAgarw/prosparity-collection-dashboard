import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MonthSelectorProps {
  availableMonths: string[];
  availableMonthsFormatted?: string[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  loading?: boolean;
}

const MonthSelector = ({ 
  availableMonths, 
  availableMonthsFormatted,
  selectedMonth, 
  onMonthChange, 
  loading = false 
}: MonthSelectorProps) => {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  // Use formatted months for display if available, otherwise use raw months
  const displayMonths = availableMonthsFormatted || availableMonths;

  // Update current month index when selectedMonth or availableMonths change
  useEffect(() => {
    console.log('MonthSelector: Updating current month index');
    console.log('Available months:', availableMonths);
    console.log('Selected month:', selectedMonth);
    
    const index = availableMonths.findIndex(month => month === selectedMonth);
    console.log('Found index:', index);
    
    if (index >= 0) {
      setCurrentMonthIndex(index);
    } else if (availableMonths.length > 0) {
      // If selectedMonth is not found, default to the last month
      const defaultIndex = availableMonths.length - 1;
      console.log('Setting default index:', defaultIndex);
      setCurrentMonthIndex(defaultIndex);
      onMonthChange(availableMonths[defaultIndex]);
    }
  }, [selectedMonth, availableMonths, onMonthChange]);

  const handlePreviousMonth = () => {
    if (currentMonthIndex > 0) {
      const newIndex = currentMonthIndex - 1;
      console.log('Previous month: index', newIndex, 'month', availableMonths[newIndex]);
      setCurrentMonthIndex(newIndex);
      onMonthChange(availableMonths[newIndex]);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < availableMonths.length - 1) {
      const newIndex = currentMonthIndex + 1;
      console.log('Next month: index', newIndex, 'month', availableMonths[newIndex]);
      setCurrentMonthIndex(newIndex);
      onMonthChange(availableMonths[newIndex]);
    }
  };

  const handleSelectChange = (value: string) => {
    console.log('Select change: value', value);
    // Find the index of the formatted value in displayMonths
    const displayIndex = displayMonths.findIndex(month => month === value);
    console.log('Display index:', displayIndex);
    
    if (displayIndex >= 0) {
      // Use the corresponding raw month value
      const rawMonth = availableMonths[displayIndex];
      console.log('Setting raw month:', rawMonth);
      setCurrentMonthIndex(displayIndex);
      onMonthChange(rawMonth);
    }
  };

  if (availableMonths.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-gray-500">
        <Calendar className="h-4 w-4 mr-2" />
        No monthly data available
      </div>
    );
  }

  // Get the formatted value for the currently selected month
  const selectedMonthDisplay = displayMonths[currentMonthIndex] || selectedMonth;

  console.log('MonthSelector render:', {
    availableMonths,
    selectedMonth,
    currentMonthIndex,
    selectedMonthDisplay,
    displayMonths
  });

  return (
    <div className="flex items-center justify-between p-4 border-b bg-gray-50">
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Month:</span>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousMonth}
          disabled={currentMonthIndex === 0 || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Select
          value={selectedMonthDisplay}
          onValueChange={handleSelectChange}
          disabled={loading}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue>{selectedMonthDisplay}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {displayMonths.map((month, index) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          disabled={currentMonthIndex === availableMonths.length - 1 || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-xs text-gray-500">
        {currentMonthIndex + 1} of {availableMonths.length}
      </div>
    </div>
  );
};

export default MonthSelector; 