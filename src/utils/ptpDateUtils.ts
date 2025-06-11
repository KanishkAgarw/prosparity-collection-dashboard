
import { format, isToday, isTomorrow, isBefore, isAfter, startOfDay } from 'date-fns';

export type PtpDateCategory = 'overdue' | 'today' | 'tomorrow' | 'future' | 'no_date';

export const categorizePtpDate = (ptpDateStr?: string | null): PtpDateCategory => {
  if (!ptpDateStr) return 'no_date';
  
  try {
    const ptpDate = new Date(ptpDateStr);
    const today = startOfDay(new Date());
    
    if (isToday(ptpDate)) return 'today';
    if (isTomorrow(ptpDate)) return 'tomorrow';
    if (isBefore(ptpDate, today)) return 'overdue';
    if (isAfter(ptpDate, today)) return 'future';
    return 'no_date';
  } catch {
    return 'no_date';
  }
};

export const getPtpDateCategoryLabel = (category: PtpDateCategory): string => {
  const labels = {
    'overdue': 'Overdue PTP',
    'today': "Today's PTP",
    'tomorrow': "Tomorrow's PTP", 
    'future': 'Future PTP',
    'no_date': 'No PTP'
  };
  return labels[category];
};

export const getPtpDateCategoryColor = (category: PtpDateCategory): string => {
  const colors = {
    'overdue': 'text-red-600',
    'today': 'text-blue-600',
    'tomorrow': 'text-orange-600',
    'future': 'text-green-600',
    'no_date': 'text-gray-500'
  };
  return colors[category];
};

export const getAllPtpDateCategories = (): PtpDateCategory[] => {
  return ['overdue', 'today', 'tomorrow', 'future', 'no_date'];
};
