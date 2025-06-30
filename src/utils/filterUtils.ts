
import type { LastMonthBounceCategory } from "@/types/filters";
import type { PtpDateCategory } from "@/utils/ptpDateUtils";

export const formatRepayment = (repayment: any): string => {
  if (repayment === null || repayment === undefined) return 'Unknown';
  
  // Convert to number if it's a string
  const numValue = typeof repayment === 'string' ? parseFloat(repayment) : repayment;
  
  if (isNaN(numValue)) return 'Unknown';
  
  // Format as currency
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(numValue);
};

export const categorizeLastMonthBounce = (lastMonthBounce: number | null | undefined): LastMonthBounceCategory => {
  if (lastMonthBounce === null || lastMonthBounce === undefined) {
    return 'Not paid';
  }
  
  const days = Number(lastMonthBounce);
  
  if (isNaN(days)) return 'Not paid';
  if (days === 0) return 'Paid on time';
  if (days >= 1 && days <= 5) return '1-5 days late';
  if (days >= 6 && days <= 15) return '6-15 days late';
  if (days > 15) return '15+ days late';
  
  return 'Not paid';
};

export const isValidLastMonthBounceCategory = (value: string): value is LastMonthBounceCategory => {
  const validCategories: LastMonthBounceCategory[] = [
    'Not paid',
    'Paid on time', 
    '1-5 days late',
    '6-15 days late',
    '15+ days late'
  ];
  return validCategories.includes(value as LastMonthBounceCategory);
};

export const isValidPtpDateCategory = (value: string): value is PtpDateCategory => {
  const validCategories: PtpDateCategory[] = [
    'overdue',
    'today',
    'tomorrow', 
    'future',
    'no_date'
  ];
  return validCategories.includes(value as PtpDateCategory);
};

export const getAllLastMonthBounceCategories = (): LastMonthBounceCategory[] => {
  return [
    'Not paid',
    'Paid on time',
    '1-5 days late', 
    '6-15 days late',
    '15+ days late'
  ];
};
