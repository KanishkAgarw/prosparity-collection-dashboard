
import { format } from "date-fns";

export const formatEmiMonth = (dateStr?: string) => {
  if (!dateStr) return "NA";
  try {
    let date: Date;
    
    // Check if it's an Excel serial number (numeric string)
    const numericValue = parseFloat(dateStr);
    if (!isNaN(numericValue) && numericValue > 40000 && numericValue < 50000) {
      // Excel serial date: days since January 1, 1900
      // Excel incorrectly treats 1900 as a leap year, so we need to adjust
      const excelEpoch = new Date(1900, 0, 1);
      const adjustedDays = numericValue - 2; // Adjust for Excel's leap year bug
      date = new Date(excelEpoch.getTime() + adjustedDays * 24 * 60 * 60 * 1000);
    } else if (dateStr.includes('-') && dateStr.length === 7) {
      // Format like "2024-01" -> convert to "2024-01-01"
      date = new Date(`${dateStr}-01`);
    } else if (dateStr.includes('-') && dateStr.length === 10) {
      // Format like "2024-01-15"
      date = new Date(dateStr);
    } else {
      // Try parsing as is
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) {
      return dateStr; // Return original if parsing fails
    }
    
    return format(date, 'MMM-yy');
  } catch {
    return dateStr; // Return original if formatting fails
  }
};

export const formatPhoneLink = (phone?: string) => {
  if (!phone) return null;
  // Remove any non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  return `tel:${cleanPhone}`;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPtpDate = (ptpDate?: string) => {
  if (!ptpDate) return "NA";
  try {
    return format(new Date(ptpDate), 'dd-MMM-yy');
  } catch {
    return "NA";
  }
};

export const formatMapLink = (address?: string) => {
  if (!address) return null;
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
};
