
import { useBranchPaymentData } from './useBranchPaymentData';
import { useBranchPTPData } from './useBranchPTPData';
import { Application } from '@/types/application';

export * from './useBranchPaymentData';
export * from './useBranchPTPData';

export const useBranchAnalyticsData = (applications: Application[]) => {
  const branchPaymentStatusData = useBranchPaymentData(applications);
  const branchPtpStatusData = useBranchPTPData(applications);

  return {
    branchPaymentStatusData,
    branchPtpStatusData,
  };
};
