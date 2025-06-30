
import { memo, useEffect, useState, useCallback } from "react";
import { Application } from "@/types/application";
import TableHeader from "./TableHeader";
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

  // Batch data state with proper initialization
  const [batchedData, setBatchedData] = useState<{
    statuses: Record<string, string>;
    ptpDates: Record<string, string | null>;
    contactStatuses: Record<string, any>;
  }>({
    statuses: {},
    ptpDates: {},
    contactStatuses: {}
  });

  // Loading state to track batch data loading
  const [batchDataLoading, setBatchDataLoading] = useState(false);

  // Extract application IDs for batch loading
  const applicationIds = applications.map(app => app.applicant_id);
  const applicationIdsString = applicationIds.join(',');

  // Clear batch data when applications change (important for search clearing)
  const clearBatchData = useCallback(() => {
    setBatchedData({
      statuses: {},
      ptpDates: {},
      contactStatuses: {}
    });
  }, []);

  // Load all batch data when applications or selectedEmiMonth changes
  const loadBatchData = useCallback(async () => {
    if (applicationIds.length === 0) {
      clearBatchData();
      return;
    }

    console.log('=== LOADING BATCH DATA FOR VISIBLE APPLICATIONS ===');
    console.log('Applications:', applicationIds.length);
    console.log('Selected EMI Month:', selectedEmiMonth);
    console.log('Application IDs:', applicationIds.slice(0, 5), '...'); // Log first 5 for debugging

    setBatchDataLoading(true);

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
      console.log('Loaded statuses for:', Object.keys(statusData).length, 'applications');
      console.log('Loaded PTP dates for:', Object.keys(ptpData).length, 'applications');
      console.log('Loaded contact statuses for:', Object.keys(contactData).length, 'applications');
    } catch (error) {
      console.error('❌ Error loading batch data:', error);
      // Clear data on error to ensure clean state
      clearBatchData();
    } finally {
      setBatchDataLoading(false);
    }
  }, [applicationIdsString, selectedEmiMonth, fetchBatchFieldStatus, fetchBatchPtpDates, fetchBatchContactStatus, fetchBatchComments, clearBatchData]);

  // Effect to load batch data when dependencies change
  useEffect(() => {
    // Clear existing data first to ensure fresh load
    clearBatchData();
    
    // Small delay to ensure state is cleared before loading new data
    const timeoutId = setTimeout(() => {
      loadBatchData();
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [loadBatchData]);

  // Combined loading state
  const isLoading = commentsLoading || statusLoading || ptpLoading || contactLoading || batchDataLoading;

  console.log('=== OPTIMIZED TABLE RENDER ===');
  console.log('Applications count:', applications.length);
  console.log('Is loading:', isLoading);
  console.log('Batch data keys:', {
    statuses: Object.keys(batchedData.statuses).length,
    ptpDates: Object.keys(batchedData.ptpDates).length,
    contactStatuses: Object.keys(batchedData.contactStatuses).length,
    comments: Object.keys(comments).length
  });

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader />
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
      
      {applications.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium text-gray-500">No applications found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      )}

      {isLoading && applications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-500">Loading applications...</p>
        </div>
      )}
    </div>
  );
});

OptimizedApplicationsTable.displayName = "OptimizedApplicationsTable";

export default OptimizedApplicationsTable;
