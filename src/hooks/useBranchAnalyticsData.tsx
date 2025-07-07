
import { useBranchPaymentData } from './useBranchPaymentData';
import { useBranchPTPData } from './useBranchPTPData';
import { Application } from '@/types/application';

export * from './useBranchPaymentData';
export * from './useBranchPTPData';

export const useBranchAnalyticsData = (applications: Application[], selectedEmiMonth?: string) => {
  const branchPaymentStatusData = useBranchPaymentData(applications, selectedEmiMonth);
  const branchPtpStatusData = useBranchPTPData(applications, selectedEmiMonth);

  return {
    branchPaymentStatusData,
    branchPtpStatusData,
  };
};
