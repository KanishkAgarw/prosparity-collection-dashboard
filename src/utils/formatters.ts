
import { format } from "date-fns";

export const formatEmiMonth = (dateStr?: string) => {
  if (!dateStr) return "NA";
  try {
    let date: Date;
    
    // Check if it's an Excel serial number (numeric string)
    const numericValue = parseFloat(dateStr);
    if (!isNaN(numericValue) && numericValue > 25000 && numericValue < 100000) {
      // Excel serial date conversion (Excel epoch starts Jan 1, 1900)
      // But Excel incorrectly treats 1900 as a leap year, so we subtract 2 days
      const excelEpoch = new Date(1900, 0, 1); // Jan 1, 1900
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      date = new Date(excelEpoch.getTime() + (numericValue - 2) * millisecondsPerDay);
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

export const formatMapLocation = (fiLocation?: string) => {
  if (!fiLocation) return null;
  
  // Remove "FI_PENDING " prefix if it exists
  const cleanLocation = fiLocation.replace(/^FI_PENDING\s+/i, '').trim();
  
  if (!cleanLocation) return null;
  
  // Create Google Maps URL
  const encodedLocation = encodeURIComponent(cleanLocation);
  return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
};
