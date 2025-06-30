
import { User, Phone, Building2, MapPin } from "lucide-react";
import { Application } from "@/types/application";
import { formatCurrency } from "@/utils/formatters";

interface ApplicationDetailsProps {
  application: Application;
  selectedEmiMonth?: string | null;
}

const ApplicationDetails = ({ application, selectedEmiMonth }: ApplicationDetailsProps) => {
  // Log context for debugging month-specific data display
  console.log('ApplicationDetails - Month Context:', {
    selectedEmiMonth,
    applicationId: application.applicant_id,
    applicationDemandDate: application.demand_date,
    applicationName: application.applicant_name
  });

  return (
    <div className="space-y-2">
      {/* Primary applicant info */}
      <div className="flex items-start gap-2">
        <User className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">
            {application.applicant_name}
          </p>
          <p className="text-xs text-gray-500">
            ID: {application.applicant_id}
          </p>
        </div>
      </div>

      {/* Contact info */}
      {application.applicant_mobile && (
        <div className="flex items-center gap-2">
          <Phone className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600 truncate">
            {application.applicant_mobile}
          </span>
        </div>
      )}

      {/* Repayment and EMI info */}
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-gray-400" />
          <span className="text-gray-600 truncate" title={`Repayment: ${application.repayment}`}>
            Rep: {application.repayment}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-gray-600 truncate font-medium" title={`EMI: ${formatCurrency(application.emi_amount)}`}>
            {formatCurrency(application.emi_amount)}
          </span>
        </div>
      </div>

      {/* Assignment info */}
      <div className="text-xs text-gray-500 space-y-0.5">
        <div>RM: {application.rm_name}</div>
        {application.collection_rm && application.collection_rm !== 'N/A' && (
          <div>Collection RM: {application.collection_rm}</div>
        )}
        <div>Team Lead: {application.team_lead}</div>
        <div>Branch: {application.branch_name}</div>
      </div>
    </div>
  );
};

export default ApplicationDetails;
