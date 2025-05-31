
import { Application } from "@/types/application";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, User, Building, MapPin } from "lucide-react";
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
          <CardContent className="p-3">
            {/* Header Row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-gray-900 truncate">
                  {app.applicant_name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  ID: {app.applicant_id}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <Badge className={`text-xs px-2 py-1 ${getStatusColor(app.status)}`}>
                  {app.status}
                </Badge>
                <Eye className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Financial Info */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <span className="text-xs text-blue-600 font-medium">EMI Amount</span>
                <p className="text-sm font-bold text-blue-800">{formatCurrency(app.emi_amount)}</p>
              </div>
              <div className="bg-red-50 p-2 rounded-lg">
                <span className="text-xs text-red-600 font-medium">Due Amount</span>
                <p className="text-sm font-bold text-red-800">
                  {formatCurrency((app.principle_due || 0) + (app.interest_due || 0))}
                </p>
              </div>
            </div>

            {/* Contact & Action Row */}
            <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                <CallStatusDisplay application={app} />
              </div>
              {app.applicant_mobile && (
                <CallButton 
                  name="Call" 
                  phone={app.applicant_mobile}
                  variant="default"
                  size="sm"
                />
              )}
            </div>

            {/* Business Info */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3 text-gray-400" />
                <div>
                  <span className="text-gray-500">Lender:</span>
                  <p className="font-medium truncate">{app.lender_name === 'Vivriti Capital Limited' ? 'Vivriti' : app.lender_name}</p>
                </div>
              </div>
              <div>
                <span className="text-gray-500">RM:</span>
                <p className="font-medium truncate">{app.rm_name}</p>
              </div>
              <div>
                <span className="text-gray-500">Dealer:</span>
                <p className="font-medium truncate">{truncateText(app.dealer_name, 15)}</p>
              </div>
              <div>
                <span className="text-gray-500">Branch:</span>
                <p className="font-medium truncate">{app.branch_name}</p>
              </div>
            </div>

            {/* PTP Date */}
            {app.ptp_date && (
              <div className="mb-3 p-2 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <span className="text-xs text-yellow-700 font-medium">PTP Date:</span>
                <p className="text-sm font-bold text-yellow-800">
                  {formatPtpDate(app.ptp_date)}
                </p>
              </div>
            )}

            {/* Recent Comments */}
            {app.recent_comments && app.recent_comments.length > 0 && (
              <div className="border-t pt-3">
                <span className="text-xs text-gray-500 font-medium">Recent Comments:</span>
                <div className="mt-2 space-y-2">
                  {app.recent_comments.slice(0, 2).map((comment, index) => (
                    <div key={index} className="bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                      <div className="text-xs font-medium text-blue-700 mb-1">{comment.user_name}</div>
                      <p className="text-xs text-gray-700 line-clamp-2">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MobileOptimizedTable;
