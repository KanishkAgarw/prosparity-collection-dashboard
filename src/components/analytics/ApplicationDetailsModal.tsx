
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, MapPin } from 'lucide-react';
import { Application } from '@/types/application';
import { DrillDownFilter } from '@/pages/Analytics';
import ApplicationDetailsPanel from '@/components/ApplicationDetailsPanel';
import OptimizedApplicationsTable from '@/components/tables/OptimizedApplicationsTable';

interface ApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  filter: DrillDownFilter | null;
}

const ApplicationDetailsModal = ({ isOpen, onClose, applications, filter }: ApplicationDetailsModalProps) => {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const handleApplicationSelect = (app: Application) => {
    setSelectedApplication(app);
  };

  const handleApplicationClose = () => {
    setSelectedApplication(null);
  };

  const handleApplicationUpdated = (updatedApp: Application) => {
    setSelectedApplication(updatedApp);
    // In a real app, you'd also update the applications list
  };

  const getFilterDescription = () => {
    if (!filter) return '';
    
    let description = `Applications in ${filter.branch_name}`;
    if (filter.rm_name) {
      description += ` (RM: ${filter.rm_name})`;
    }
    
    switch (filter.status_type) {
      case 'unpaid':
        return `${description} with Unpaid status`;
      case 'partially_paid':
        return `${description} with Partially Paid status`;
      case 'paid_pending_approval':
        return `${description} with Paid (Pending Approval) status`;
      case 'paid':
        return `${description} with Paid status`;
      case 'others':
        return `${description} with Other statuses`;
      case 'overdue':
        return `${description} with Overdue PTPs`;
      case 'today':
        return `${description} with Today's PTPs`;
      case 'tomorrow':
        return `${description} with Tomorrow's PTPs`;
      case 'future':
        return `${description} with Future PTPs`;
      case 'no_ptp_set':
        return `${description} with No PTP set`;
      default:
        return description;
    }
  };

  console.log('Modal applications count:', applications.length);
  console.log('Filter:', filter);

  return (
    <>
      <Dialog open={isOpen && !selectedApplication} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="border-b pb-4 px-6 pt-6">
            <div className="space-y-3">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Application Details
              </DialogTitle>
              <DialogDescription className="text-lg">
                {getFilterDescription()}
              </DialogDescription>
              <div className="flex items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium text-lg">{applications.length} applications</span>
                </div>
                {filter?.branch_name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span className="text-lg">{filter.branch_name}</span>
                  </div>
                )}
                {filter?.rm_name && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="text-lg">{filter.rm_name}</span>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-6 pb-6">
            {applications.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center space-y-4">
                <div>
                  <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900">No applications found</h3>
                  <p className="text-gray-500">No applications match the selected criteria.</p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <OptimizedApplicationsTable
                  applications={applications}
                  onRowClick={handleApplicationSelect}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Application Details Panel */}
      {selectedApplication && (
        <ApplicationDetailsPanel
          application={selectedApplication}
          onClose={handleApplicationClose}
          onSave={handleApplicationUpdated}
          onDataChanged={() => {
            // Handle data changes if needed
            console.log('Application data changed');
          }}
        />
      )}
    </>
  );
};

export default ApplicationDetailsModal;
