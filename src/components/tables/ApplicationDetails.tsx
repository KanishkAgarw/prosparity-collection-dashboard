
import { memo } from "react";
import { TableCell } from "@/components/ui/table";
import { Application } from "@/types/application";
import CallButton from "../CallButton";

interface ApplicationDetailsProps {
  application: Application;
}

const ApplicationDetails = memo(({ application }: ApplicationDetailsProps) => {
  return (
    <>
      <div className="space-y-1">
        <div className="font-medium text-gray-900">{application.applicant_name}</div>
        <div className="text-xs text-gray-500">ID: {application.applicant_id}</div>
        
        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
          <div>
            <span className="text-gray-500">Branch:</span>
            <div className="font-medium">{application.branch_name}</div>
          </div>
          <div>
            <span className="text-gray-500">Team Lead:</span>
            <div className="font-medium">{application.team_lead}</div>
          </div>
          <div>
            <span className="text-gray-500">RM:</span>
            <div className="font-medium">{application.rm_name}</div>
          </div>
          <div>
            <span className="text-gray-500">Dealer:</span>
            <div className="font-medium truncate" title={application.dealer_name}>
              {application.dealer_name}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Lender:</span>
            <div className="font-medium truncate" title={application.lender_name}>
              {application.lender_name === 'Vivriti Capital Limited' ? 'Vivriti' : application.lender_name}
            </div>
          </div>
          {application.collection_rm && (
            <div>
              <span className="text-gray-500">Collection RM:</span>
              <div className="font-medium">{application.collection_rm}</div>
            </div>
          )}
        </div>

        {application.applicant_mobile && (
          <div className="mt-2 flex items-center gap-2">
            <CallButton 
              name="Call" 
              phone={application.applicant_mobile}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
            />
            <span className="text-xs text-gray-600">{application.applicant_mobile}</span>
          </div>
        )}
      </div>
    </>
  );
});

ApplicationDetails.displayName = "ApplicationDetails";

export default ApplicationDetails;
