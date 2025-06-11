
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Application } from '@/types/application';
import { DrillDownFilter } from '@/pages/Analytics';
import OptimizedApplicationsTable from '@/components/tables/OptimizedApplicationsTable';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useEnhancedExport } from '@/hooks/useEnhancedExport';

interface ApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  filter: DrillDownFilter | null;
}

const ApplicationDetailsModal = ({ 
  isOpen, 
  onClose, 
  applications, 
  filter 
}: ApplicationDetailsModalProps) => {
  const { exportToExcel } = useEnhancedExport();

  const getFilterDescription = (): string => {
    if (!filter) return '';
    
    let description = `Branch: ${filter.branch_name}`;
    
    if (filter.rm_name) {
      description += ` | RM: ${filter.rm_name}`;
    }
    
    // Convert status type to readable format
    const statusLabels: Record<string, string> = {
      'unpaid': 'Unpaid',
      'partially_paid': 'Partially Paid',
      'paid_pending_approval': 'Paid (Pending Approval)',
      'paid': 'Paid',
      'others': 'Others',
      'overdue': 'Overdue PTP',
      'today': "Today's PTP",
      'tomorrow': "Tomorrow's PTP",
      'future': 'Future PTP',
      'no_ptp_set': 'No PTP Set',
      'total': 'All Applications'
    };
    
    description += ` | Status: ${statusLabels[filter.status_type] || filter.status_type}`;
    
    return description;
  };

  const handleExport = () => {
    if (applications.length === 0) return;
    
    const filename = `analytics_drilldown_${filter?.branch_name?.replace(/\s+/g, '_')}_${filter?.status_type}_${new Date().getTime()}`;
    exportToExcel(applications, filename);
  };

  const handleRowClick = (application: Application) => {
    // You can add row click functionality here if needed
    console.log('Application clicked:', application.applicant_id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription className="mt-1">
                {getFilterDescription()}
              </DialogDescription>
              <div className="text-sm text-gray-600 mt-1">
                {applications.length} application{applications.length !== 1 ? 's' : ''} found
              </div>
            </div>
            {applications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-hidden">
          {applications.length > 0 ? (
            <div className="h-full">
              <OptimizedApplicationsTable
                applications={applications}
                onRowClick={handleRowClick}
                showBulkSelection={false}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No applications found for the selected criteria.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetailsModal;
