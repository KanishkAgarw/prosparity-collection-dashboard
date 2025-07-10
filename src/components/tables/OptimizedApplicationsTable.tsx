import { memo, useEffect, useState, useCallback } from "react";
import { Application } from "@/types/application";
import TableHeader from "./TableHeader";
import ApplicationRow from "./ApplicationRow";
import { Table, TableBody } from "@/components/ui/table";
import { useCentralizedDataManager } from "@/hooks/useCentralizedDataManager";

interface OptimizedApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  onApplicationDeleted?: () => void;
  selectedApplicationId?: string;
  selectedEmiMonth?: string | null;
  preloadedStatusData?: Record<string, string>;
}

const OptimizedApplicationsTable = memo(({
  applications,
  onRowClick,
  selectedApplicationId,
  selectedEmiMonth,
  preloadedStatusData
}: OptimizedApplicationsTableProps) => {
  
  const { data, loading, error, fetchAllData, clearData } = useCentralizedDataManager(selectedEmiMonth);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Extract application IDs for batch loading
  const applicationIds = applications.map(app => app.applicant_id);
  const applicationIdsString = applicationIds.join(',');

  // Load all batch data when applications or selectedEmiMonth changes
  const loadBatchData = useCallback(async () => {
    if (applicationIds.length === 0) {
      clearData();
      return;
    }

    console.log('=== LOADING OPTIMIZED BATCH DATA ===');
    console.log('Applications:', applicationIds.length);
    console.log('Selected EMI Month:', selectedEmiMonth);

    try {
      await fetchAllData(applicationIds, {
        selectedEmiMonth,
        priority: isInitialLoad ? 'high' : 'medium'
      });

      console.log('✅ Optimized batch data loading complete');
    } catch (error) {
      console.error('❌ Error loading optimized batch data:', error);
    } finally {
      setIsInitialLoad(false);
    }
  }, [applicationIdsString, selectedEmiMonth, fetchAllData, clearData, isInitialLoad]);

  // Effect to load batch data when dependencies change
  useEffect(() => {
    // Clear existing data first to ensure fresh load
    clearData();
    
    // Small delay to ensure state is cleared before loading new data
    const timeoutId = setTimeout(() => {
      loadBatchData();
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [loadBatchData]);

  console.log('=== OPTIMIZED TABLE RENDER ===');
  console.log('Applications count:', applications.length);
  console.log('Is loading:', loading);
  console.log('Has error:', !!error);
  console.log('Batch data keys:', {
    statuses: Object.keys(data.statuses).length,
    ptpDates: Object.keys(data.ptpDates).length,
    contactStatuses: Object.keys(data.contactStatuses).length,
    comments: Object.keys(data.comments).length
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
                // Pass batched data as props - use preloaded data if available
                batchedStatus={preloadedStatusData?.[application.applicant_id] || data.statuses[application.applicant_id] || 'Unpaid'}
                batchedPtpDate={data.ptpDates[application.applicant_id] || null}
                batchedContactStatus={data.contactStatuses[application.applicant_id]}
                batchedComments={data.comments[application.applicant_id] || []}
                isLoading={loading}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      
      {error && (
        <div className="text-center py-8 text-red-600 bg-red-50">
          <p className="text-lg font-medium">Error loading data</p>
          <p className="text-sm">{error.message}</p>
          <button 
            onClick={loadBatchData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}
      
      {applications.length === 0 && !loading && !error && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium text-gray-500">No applications found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      )}

      {loading && applications.length === 0 && (
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
