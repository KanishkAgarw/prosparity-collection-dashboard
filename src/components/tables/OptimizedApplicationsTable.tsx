
import { memo, useEffect, useState } from "react";
import { Application } from "@/types/application";
import OptimizedTableHeader from "./OptimizedTableHeader";
import ApplicationRow from "./ApplicationRow";
import { Table, TableBody } from "@/components/ui/table";
import { useBatchComments } from "@/hooks/useBatchComments";
import { useBatchFieldStatus } from "@/hooks/useBatchFieldStatus";
import { useBatchPtpDates } from "@/hooks/useBatchPtpDates";
import { useBatchContactCallingStatus } from "@/hooks/useBatchContactCallingStatus";

interface OptimizedApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  onApplicationDeleted?: () => void;
  selectedApplicationId?: string;
  selectedEmiMonth?: string | null;
}

const OptimizedApplicationsTable = memo(({
  applications,
  onRowClick,
  selectedApplicationId,
  selectedEmiMonth
}: OptimizedApplicationsTableProps) => {
  // Batch loading hooks
  const { comments, loading: commentsLoading, fetchBatchComments } = useBatchComments(selectedEmiMonth);
  const { loading: statusLoading, fetchBatchFieldStatus } = useBatchFieldStatus();
  const { loading: ptpLoading, fetchBatchPtpDates } = useBatchPtpDates();
  const { loading: contactLoading, fetchBatchContactStatus } = useBatchContactCallingStatus();

  // Batch data state
  const [batchedData, setBatchedData] = useState<{
    statuses: Record<string, string>;
    ptpDates: Record<string, string | null>;
    contactStatuses: Record<string, any>;
  }>({
    statuses: {},
    ptpDates: {},
    contactStatuses: {}
  });

  // Extract application IDs for batch loading
  const applicationIds = applications.map(app => app.applicant_id);

  // Load all batch data when applications or selectedEmiMonth changes
  useEffect(() => {
    const loadBatchData = async () => {
      if (applicationIds.length === 0) return;

      console.log('=== LOADING BATCH DATA FOR VISIBLE APPLICATIONS ===');
      console.log('Applications:', applicationIds.length);
      console.log('Selected EMI Month:', selectedEmiMonth);

      try {
        // Load all data in parallel
        const [statusData, ptpData, contactData] = await Promise.all([
          fetchBatchFieldStatus(applicationIds, selectedEmiMonth),
          fetchBatchPtpDates(applicationIds, selectedEmiMonth),
          fetchBatchContactStatus(applicationIds, selectedEmiMonth)
        ]);

        // Also load comments
        await fetchBatchComments(applicationIds);

        setBatchedData({
          statuses: statusData,
          ptpDates: ptpData,
          contactStatuses: contactData
        });

        console.log('✅ Batch data loading complete');
      } catch (error) {
        console.error('❌ Error loading batch data:', error);
      }
    };

    loadBatchData();
  }, [applicationIds.join(','), selectedEmiMonth, fetchBatchFieldStatus, fetchBatchPtpDates, fetchBatchContactStatus, fetchBatchComments]);

  const isLoading = commentsLoading || statusLoading || ptpLoading || contactLoading;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <OptimizedTableHeader />
          <TableBody>
            {applications.map((application) => (
              <ApplicationRow
                key={application.id}
                application={application}
                selectedApplicationId={selectedApplicationId}
                onRowClick={onRowClick}
                selectedEmiMonth={selectedEmiMonth}
                // Pass batched data as props
                batchedStatus={batchedData.statuses[application.applicant_id] || 'Unpaid'}
                batchedPtpDate={batchedData.ptpDates[application.applicant_id] || null}
                batchedContactStatus={batchedData.contactStatuses[application.applicant_id]}
                batchedComments={comments[application.applicant_id] || []}
                isLoading={isLoading}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      
      {applications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium text-gray-500">No applications found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
});

OptimizedApplicationsTable.displayName = "OptimizedApplicationsTable";

export default OptimizedApplicationsTable;
