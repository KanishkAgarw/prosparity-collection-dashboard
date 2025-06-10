
import { format, isToday, isBefore, isAfter, addDays, startOfDay } from 'date-fns';

export type PtpDateCategory = 'today' | 'overdue' | 'upcoming' | 'future' | 'no_date';

export const categorizePtpDate = (ptpDateStr?: string | null): PtpDateCategory => {
  if (!ptpDateStr) return 'no_date';
  
  try {
    const ptpDate = new Date(ptpDateStr);
    const today = startOfDay(new Date());
    const sevenDaysFromNow = addDays(today, 7);
    
    if (isToday(ptpDate)) return 'today';
    if (isBefore(ptpDate, today)) return 'overdue';
    if (isBefore(ptpDate, sevenDaysFromNow)) return 'upcoming';
    return 'future';
  } catch {
    return 'no_date';
  }
};

export const getPtpDateCategoryLabel = (category: PtpDateCategory): string => {
  const labels = {
    'today': "Today's PTPs",
    'overdue': 'Overdue PTPs',
    'upcoming': 'Upcoming PTPs (7 days)',
    'future': 'Future PTPs (7+ days)',
    'no_date': 'No PTP Date Set'
  };
  return labels[category];
};

export const getPtpDateCategoryColor = (category: PtpDateCategory): string => {
  const colors = {
    'today': 'text-blue-600',
    'overdue': 'text-red-600',
    'upcoming': 'text-orange-600',
    'future': 'text-green-600',
    'no_date': 'text-gray-500'
  };
  return colors[category];
};

export const getAllPtpDateCategories = (): PtpDateCategory[] => {
  return ['today', 'overdue', 'upcoming', 'future', 'no_date'];
};
