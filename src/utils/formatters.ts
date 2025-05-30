
import { format } from "date-fns";

export const formatEmiMonth = (dateStr?: string) => {
  if (!dateStr) return "NA";
  try {
    // Handle different date formats
    let date: Date;
    if (dateStr.includes('-') && dateStr.length === 7) {
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
