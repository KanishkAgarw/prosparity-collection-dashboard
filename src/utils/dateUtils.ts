

// Simplified utility functions for handling standardized DATE columns

// Convert EMI month format (Jun-25) to YYYY-MM format (2025-06)
export const convertEmiMonthToYearMonth = (emiMonth: string): string => {
  if (!emiMonth || emiMonth === 'all') return emiMonth;
  
  try {
    // Handle "Jun-25" format
    if (emiMonth.match(/^[A-Za-z]{3}-\d{2}$/)) {
      const [monthAbbr, yearShort] = emiMonth.split('-');
      const year = `20${yearShort}`; // Convert 25 to 2025
      
      // Convert month abbreviation to number
      const monthMap: { [key: string]: string } = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      
      const month = monthMap[monthAbbr];
      if (month) {
        return `${year}-${month}`;
      }
    }
    
    // If already in YYYY-MM format, return as is
    if (emiMonth.match(/^\d{4}-\d{2}$/)) {
      return emiMonth;
    }
    
    return emiMonth;
  } catch (error) {
    console.error('Error converting EMI month format:', error);
    return emiMonth;
  }
};

export const normalizeEmiMonth = (emiMonth: string | Date): string => {
  if (!emiMonth) return '';
  
  // If it's already a Date object, format it
  if (emiMonth instanceof Date) {
    return emiMonth.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
  }
  
  // If it's a string in YYYY-MM format, return as is
  if (typeof emiMonth === 'string' && emiMonth.match(/^\d{4}-\d{2}$/)) {
    return emiMonth;
  }
  
  // If it's a date string, extract YYYY-MM
  if (typeof emiMonth === 'string' && emiMonth.match(/^\d{4}-\d{2}-\d{2}/)) {
    return emiMonth.substring(0, 7);
  }
  
  return emiMonth.toString();
};

// Convert YYYY-MM to the 5th day of that month (EMI date)
export const monthToEmiDate = (yearMonth: string): string => {
  if (!yearMonth || !yearMonth.match(/^\d{4}-\d{2}$/)) {
    return yearMonth;
  }
  return `${yearMonth}-05`;
};

// Get the first and last day of a month for date range queries
export const getMonthDateRange = (yearMonth: string): { start: string; end: string } => {
  if (!yearMonth || !yearMonth.match(/^\d{4}-\d{2}$/)) {
    return { start: yearMonth, end: yearMonth };
  }
  
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of the month
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
};

// Group database dates by normalized month
export const groupDatesByMonth = (dates: string[]): Record<string, string[]> => {
  const groups: Record<string, string[]> = {};
  
  dates.forEach(date => {
    const normalized = normalizeEmiMonth(date);
    if (!groups[normalized]) {
      groups[normalized] = [];
    }
    groups[normalized].push(date);
  });
  
  return groups;
};
