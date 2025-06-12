
import { FileText, Users, MapPin } from 'lucide-react';
import { DrillDownFilter } from '@/pages/Analytics';
import ModalFilterDescription from './ModalFilterDescription';

interface ApplicationDetailsHeaderProps {
  applicationsCount: number;
  filter: DrillDownFilter | null;
}

const ApplicationDetailsHeader = ({ applicationsCount, filter }: ApplicationDetailsHeaderProps) => {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold text-gray-900">
        Application Details
      </h2>
      <p className="text-lg">
        <ModalFilterDescription filter={filter} />
      </p>
      <div className="flex items-center gap-6 text-gray-600">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span className="font-medium text-lg">{applicationsCount} applications</span>
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
  );
};

export default ApplicationDetailsHeader;
