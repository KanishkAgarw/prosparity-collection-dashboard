
// Utility functions for handling mixed date formats in the database

export const normalizeEmiMonth = (emiMonth: string): string => {
  if (!emiMonth) return '';
  
  // Check if it's an Excel serial number (numeric string)
  const numericValue = parseFloat(emiMonth);
  if (!isNaN(numericValue) && numericValue > 25000 && numericValue < 100000) {
    // Excel serial date conversion - Excel epoch starts Jan 1, 1900
    // Excel has a bug where it treats 1900 as a leap year, so we need to account for that
    const excelEpoch = new Date(1900, 0, 1);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    // Subtract 2 to account for Excel's leap year bug and 0-indexing
    const date = new Date(excelEpoch.getTime() + (numericValue - 2) * millisecondsPerDay);
    return date.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
  }
  
  // If it's already in YYYY-MM format, return as is
  if (emiMonth.match(/^\d{4}-\d{2}$/)) {
    return emiMonth;
  }
  
  // If it's in YYYY-MM-DD format, extract YYYY-MM
  if (emiMonth.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return emiMonth.substring(0, 7);
  }
  
  return emiMonth;
};

// Convert normalized month (YYYY-MM) to all possible database representations
export const getMonthVariations = (normalizedMonth: string): string[] => {
  if (!normalizedMonth || !normalizedMonth.match(/^\d{4}-\d{2}$/)) {
    return [normalizedMonth];
  }

  const variations = [normalizedMonth];
  
  // Add the 5th day of the month format (YYYY-MM-05) since EMI dates fall on 5th
  variations.push(`${normalizedMonth}-05`);
  
  // Calculate Excel serial number for the 5th day of the month
  const [year, month] = normalizedMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 5); // month - 1 because JS months are 0-indexed, day 5 for EMI date
  
  // Convert to Excel serial number
  const excelEpoch = new Date(1900, 0, 1);
  const diffInMs = date.getTime() - excelEpoch.getTime();
  const diffInDays = Math.floor(diffInMs / (24 * 60 * 60 * 1000));
  // Add 2 to account for Excel's leap year bug
  const excelSerial = diffInDays + 2;
  
  variations.push(excelSerial.toString());
  
  console.log(`Month variations for ${normalizedMonth}:`, variations);
  
  return variations;
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
