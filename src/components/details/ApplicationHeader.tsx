
import { CircleUser } from "lucide-react";
import { Application } from "@/types/application";
import { formatCurrency, formatEmiMonth } from "@/utils/formatters";

interface ApplicationHeaderProps {
  application: Application;
}

const ApplicationHeader = ({ application }: ApplicationHeaderProps) => {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
        <CircleUser className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
          {application.applicant_name}
        </h3>
        <div className="space-y-1 text-xs sm:text-sm text-gray-600">
          <div>
            <span className="font-medium">EMI Month:</span> {formatEmiMonth(application.demand_date)}
          </div>
          <div>
            <span className="font-medium">EMI Due:</span> {formatCurrency(application.emi_amount)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationHeader;
