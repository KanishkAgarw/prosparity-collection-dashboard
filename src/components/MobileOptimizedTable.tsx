
import { Application } from "@/types/application";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Eye } from "lucide-react";
import { formatCurrency, formatPtpDate } from "@/utils/formatters";
import CallButton from "./CallButton";
import CallStatusDisplay from "./CallStatusDisplay";

interface MobileOptimizedTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  selectedApplicationId?: string;
}

const MobileOptimizedTable = ({ 
  applications, 
  onRowClick, 
  selectedApplicationId 
}: MobileOptimizedTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Unpaid': return 'bg-red-100 text-red-800 border-red-200';
      case 'Partially Paid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const truncateText = (text: string, maxLength: number = 20) => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  };

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <Card 
          key={app.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
            selectedApplicationId === app.id ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-lg'
          }`}
          onClick={() => onRowClick(app)}
        >
          <CardContent className="p-4">
            {/* Header Row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {app.applicant_name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  ID: {app.applicant_id}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Badge className={`text-xs px-2 py-1 ${getStatusColor(app.status)}`}>
                  {app.status}
                </Badge>
                <Eye className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Financial Info */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs">EMI Amount</span>
                <p className="font-medium">{formatCurrency(app.emi_amount)}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Total Due</span>
                <p className="font-medium text-red-600">
                  {formatCurrency((app.principle_due || 0) + (app.interest_due || 0))}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-3 w-3" />
                <span className="truncate">{app.applicant_mobile || 'N/A'}</span>
              </div>
              {app.applicant_mobile && (
                <CallButton 
                  name="Call" 
                  phone={app.applicant_mobile}
                  variant="outline"
                  size="sm"
                />
              )}
            </div>

            {/* Business Info */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
              <div>
                <span className="text-gray-400">Lender:</span>
                <p className="truncate">{app.lender_name === 'Vivriti Capital Limited' ? 'Vivriti' : app.lender_name}</p>
              </div>
              <div>
                <span className="text-gray-400">RM:</span>
                <p className="truncate">{app.rm_name}</p>
              </div>
              <div>
                <span className="text-gray-400">Dealer:</span>
                <p className="truncate">{truncateText(app.dealer_name, 15)}</p>
              </div>
              <div>
                <span className="text-gray-400">Branch:</span>
                <p className="truncate">{app.branch_name}</p>
              </div>
            </div>

            {/* PTP Date */}
            {app.ptp_date && (
              <div className="mb-3">
                <span className="text-xs text-gray-400">PTP Date:</span>
                <p className="text-sm font-medium text-blue-600">
                  {formatPtpDate(app.ptp_date)}
                </p>
              </div>
            )}

            {/* Call Status */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Call Status:</span>
                <CallStatusDisplay application={app} />
              </div>
            </div>

            {/* Recent Comments */}
            {app.rm_comments && (
              <div className="mt-3 pt-3 border-t">
                <span className="text-xs text-gray-400">Comments:</span>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {app.rm_comments}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MobileOptimizedTable;
