
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
    <div className="space-y-3">
      {/* Primary applicant info */}
      <div className="flex items-start gap-3">
        <User className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-900 truncate text-base">
            {application.applicant_name}
          </p>
          <p className="text-sm text-gray-600 font-medium">
            {application.applicant_id}
          </p>
        </div>
      </div>

      {/* Contact info */}
      {application.applicant_mobile && (
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700 truncate">
            {application.applicant_mobile}
          </span>
        </div>
      )}

      {/* Repayment and EMI info */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="text-gray-700 truncate font-medium" title={`Repayment: ${application.repayment}`}>
            Rep: {application.repayment}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-gray-700 truncate font-semibold" title={`EMI: ${formatCurrency(application.emi_amount)}`}>
            {formatCurrency(application.emi_amount)}
          </span>
        </div>
      </div>

      {/* Assignment info */}
      <div className="text-sm text-gray-600 space-y-1">
        <div><span className="font-medium">RM:</span> {application.rm_name}</div>
        {application.collection_rm && application.collection_rm !== 'N/A' && (
          <div><span className="font-medium">Collection RM:</span> {application.collection_rm}</div>
        )}
        <div><span className="font-medium">Team Lead:</span> {application.team_lead}</div>
        <div><span className="font-medium">Branch:</span> {application.branch_name}</div>
      </div>
    </div>
  );
};

export default ApplicationDetails;
