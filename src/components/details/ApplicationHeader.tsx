
import { User } from "lucide-react";
import { Application } from "@/types/application";
import { formatEmiMonth, formatCurrency } from "@/utils/formatters";

interface ApplicationHeaderProps {
  application: Application;
}

const ApplicationHeader = ({ application }: ApplicationHeaderProps) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base sm:text-lg text-blue-900 break-words">{application.applicant_name}</h3>
          <p className="text-xs sm:text-sm text-blue-700 break-words">EMI Month: {formatEmiMonth(application.demand_date)}</p>
          <p className="text-xs sm:text-sm text-blue-600 mt-1">EMI Due: {formatCurrency(application.emi_amount)}</p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationHeader;
