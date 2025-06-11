
import { format, isToday, isBefore, startOfDay } from 'date-fns';

export type PtpDateCategory = 'today' | 'overdue' | 'upcoming' | 'no_date';

export const categorizePtpDate = (ptpDateStr?: string | null): PtpDateCategory => {
  if (!ptpDateStr) return 'no_date';
  
  try {
    const ptpDate = new Date(ptpDateStr);
    const today = startOfDay(new Date());
    
    if (isToday(ptpDate)) return 'today';
    if (isBefore(ptpDate, today)) return 'overdue';
    // All future dates (beyond today) are now "upcoming"
    return 'upcoming';
  } catch {
    return 'no_date';
  }
};

export const getPtpDateCategory = categorizePtpDate;

export const getPtpDateCategoryLabel = (category: PtpDateCategory): string => {
  const labels = {
    'today': "Today's PTP",
    'overdue': 'Overdue PTP',
    'upcoming': 'Upcoming PTPs',
    'no_date': 'No PTP set'
  };
  return labels[category];
};

export const getPtpDateCategoryColor = (category: PtpDateCategory): string => {
  const colors = {
    'today': 'text-blue-600',
    'overdue': 'text-red-600',
    'upcoming': 'text-orange-600',
    'no_date': 'text-gray-500'
  };
  return colors[category];
};

export const getAllPtpDateCategories = (): PtpDateCategory[] => {
  return ['today', 'overdue', 'upcoming', 'no_date'];
};

export const getPtpDateOptions = (): string[] => {
  return getAllPtpDateCategories().map(category => getPtpDateCategoryLabel(category));
};
