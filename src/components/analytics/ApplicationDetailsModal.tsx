import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { Application } from '@/types/application';
import { DrillDownFilter } from '@/pages/Analytics';
import ApplicationDetailsPanel from '@/components/ApplicationDetailsPanel';
import ApplicationDetailsHeader from './modal/ApplicationDetailsHeader';
import ApplicationDetailsContent from './modal/ApplicationDetailsContent';

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

  console.log('Modal applications count:', applications.length);
  console.log('Filter:', filter);

  return (
    <>
      <Dialog open={isOpen && !selectedApplication} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="border-b pb-4 px-6 pt-6">
            <ApplicationDetailsHeader 
              applicationsCount={applications.length}
              filter={filter}
              applications={applications}
            />
          </DialogHeader>

          <div className="flex-1 overflow-hidden px-6 pb-6">
            <ApplicationDetailsContent
              applications={applications}
              onApplicationSelect={handleApplicationSelect}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Application Details Panel with proper side panel positioning */}
      {selectedApplication && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleApplicationClose}
          />
          {/* Panel */}
          <div className="fixed inset-y-0 right-0 w-full sm:w-96 lg:w-[500px] z-50">
            <ApplicationDetailsPanel
              application={selectedApplication}
              onClose={handleApplicationClose}
              onSave={handleApplicationUpdated}
              onDataChanged={() => {
                // Handle data changes if needed
                console.log('Application data changed');
              }}
            />
          </div>
        </>
      )}
    </>
  );
};

export default ApplicationDetailsModal;
