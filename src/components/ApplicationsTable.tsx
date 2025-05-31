
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatEmiMonth, formatCurrency, formatPtpDate } from "@/utils/formatters";
import { Application } from "@/types/application";
import CallStatusDisplay from "./CallStatusDisplay";

interface ApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  onApplicationDeleted?: () => void;
  selectedApplicationId?: string;
}

const getStatusBadge = (status: string) => {
  const variants = {
    'Paid': 'bg-green-100 text-green-800 border-green-200',
    'Unpaid': 'bg-red-100 text-red-800 border-red-200',
    'Partially Paid': 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };
  
  return (
    <Badge className={`${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200'} border text-xs px-1 py-0`}>
      {status}
    </Badge>
  );
};

const formatLenderName = (lenderName: string) => {
  if (lenderName === 'Vivriti Capital Limited') {
    return 'Vivriti';
  }
  return lenderName;
};

const ApplicationsTable = React.memo(({ applications, onRowClick, selectedApplicationId }: ApplicationsTableProps) => {
  return (
    <div className="w-full overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="w-1/3 px-2 py-3 text-left">Details</TableHead>
              <TableHead className="w-20 px-2 py-3 text-center">EMI</TableHead>
              <TableHead className="w-20 px-2 py-3 text-center">Status</TableHead>
              <TableHead className="w-20 px-2 py-3 text-center">PTP</TableHead>
              <TableHead className="w-24 px-2 py-3 text-center">Call</TableHead>
              <TableHead className="w-1/4 px-2 py-3 text-left">Comments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow 
                key={app.id} 
                className={`cursor-pointer transition-colors border-b border-gray-100 ${
                  selectedApplicationId === app.id 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onRowClick(app)}
              >
                <TableCell className="px-2 py-3 w-1/3">
                  <div className="space-y-1">
                    <div className="font-semibold text-blue-900 text-sm truncate">{app.applicant_name}</div>
                    <div className="text-xs text-gray-600 truncate">
                      <span className="font-medium">ID:</span> {app.applicant_id}
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">EMI:</span> {formatEmiMonth(app.demand_date)}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      <span className="font-medium">Branch:</span> {app.branch_name}
                    </div>
                    <div className="text-xs text-gray-600 grid grid-cols-1 gap-1">
                      <div className="truncate">
                        <span className="font-medium">TL:</span> {app.team_lead}
                      </div>
                      <div className="truncate">
                        <span className="font-medium">RM:</span> {app.rm_name}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      <span className="font-medium">Dealer:</span> {app.dealer_name}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      <span className="font-medium">Lender:</span> {formatLenderName(app.lender_name)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-2 py-3 w-20 text-center">
                  <div className="font-medium text-blue-600 text-xs">{formatCurrency(app.emi_amount)}</div>
                </TableCell>
                <TableCell className="px-2 py-3 w-20 text-center">{getStatusBadge(app.status)}</TableCell>
                <TableCell className="px-2 py-3 w-20 text-center">
                  <div className={`text-xs ${app.ptp_date ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    {formatPtpDate(app.ptp_date)}
                  </div>
                </TableCell>
                <TableCell className="px-2 py-3 w-24 text-center">
                  <div className="text-xs">
                    <CallStatusDisplay application={app} />
                  </div>
                </TableCell>
                <TableCell className="px-2 py-3 w-1/4">
                  <div className="space-y-1 max-w-full">
                    {app.recent_comments && app.recent_comments.length > 0 ? (
                      app.recent_comments.slice(0, 2).map((comment, index) => (
                        <div key={index} className="text-xs p-1 rounded bg-gray-50 border-l-2 border-blue-200">
                          <div className="font-medium text-blue-700 mb-1 truncate">{comment.user_name}</div>
                          <div className="text-gray-600 break-words line-clamp-2">{comment.content}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 italic">No comments</div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

ApplicationsTable.displayName = 'ApplicationsTable';

export default ApplicationsTable;
