
import { FileText } from 'lucide-react';
import { Application } from '@/types/application';
import OptimizedApplicationsTable from '@/components/tables/OptimizedApplicationsTable';

interface ApplicationDetailsContentProps {
  applications: Application[];
  onApplicationSelect: (app: Application) => void;
}

const ApplicationDetailsContent = ({ applications, onApplicationSelect }: ApplicationDetailsContentProps) => {
  if (applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center space-y-4">
        <div>
          <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900">No applications found</h3>
          <p className="text-gray-500">No applications match the selected criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <OptimizedApplicationsTable
        applications={applications}
        onRowClick={onApplicationSelect}
      />
    </div>
  );
};

export default ApplicationDetailsContent;
