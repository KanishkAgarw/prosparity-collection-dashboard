import { Application } from '@/types/application';
import { useBranchAnalyticsData } from '@/hooks/useBranchAnalyticsData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { DrillDownFilter } from '@/pages/Analytics';

interface BranchPaymentStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

const BranchPaymentStatusTable = ({ applications, onDrillDown }: BranchPaymentStatusTableProps) => {
  const { branchPaymentStatusData } = useBranchAnalyticsData(applications);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());

  const toggleBranch = (branchName: string) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(branchName)) {
      newExpanded.delete(branchName);
    } else {
      newExpanded.add(branchName);
    }
    setExpandedBranches(newExpanded);
  };

  const handleCellClick = (branchName: string, rmName: string | undefined, statusType: string) => {
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName,
      status_type: statusType
    });
  };

  const calculatePercentage = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%';
    return `${Math.round((numerator / denominator) * 100)}%`;
  };

  const totals = branchPaymentStatusData.reduce(
    (acc, branch) => ({
      total: acc.total + branch.total_stats.total,
      unpaid: acc.unpaid + branch.total_stats.unpaid,
      partially_paid: acc.partially_paid + branch.total_stats.partially_paid,
      paid_pending_approval: acc.paid_pending_approval + branch.total_stats.paid_pending_approval,
      paid: acc.paid + branch.total_stats.paid,
      others: acc.others + branch.total_stats.others,
    }),
    { total: 0, unpaid: 0, partially_paid: 0, paid_pending_approval: 0, paid: 0, others: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Payment Status by Branch</CardTitle>
        <CardDescription className="text-lg">
          Breakdown of application payment statuses across branches and RMs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-lg w-48">Branch/RM</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Total</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Unpaid</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Partial</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Pending</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Paid</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Others</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchPaymentStatusData.map((branch) => (
                <>
                  <TableRow key={branch.branch_name} className="hover:bg-muted/50">
                    <TableCell className="font-semibold text-base">
                      <button
                        onClick={() => toggleBranch(branch.branch_name)}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        {expandedBranches.has(branch.branch_name) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {branch.branch_name}
                      </button>
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                    >
                      {branch.total_stats.total}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-red-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'unpaid')}
                    >
                      {branch.total_stats.unpaid}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-yellow-50 hover:text-yellow-700 transition-colors font-medium text-yellow-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'partially_paid')}
                    >
                      {branch.total_stats.partially_paid}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-orange-50 hover:text-orange-700 transition-colors font-medium text-orange-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'paid_pending_approval')}
                    >
                      {branch.total_stats.paid_pending_approval}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors font-medium text-green-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'paid')}
                    >
                      {branch.total_stats.paid}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-gray-50 hover:text-gray-700 transition-colors font-medium"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'others')}
                    >
                      {branch.total_stats.others}
                    </TableCell>
                  </TableRow>
                  
                  {expandedBranches.has(branch.branch_name) && branch.rm_stats.map((rm) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="bg-muted/25 hover:bg-muted/40">
                      <TableCell className="text-base pl-8">
                        {rm.rm_name}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                      >
                        {rm.total}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors text-red-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'unpaid')}
                      >
                        {rm.unpaid}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-yellow-50 hover:text-yellow-700 transition-colors text-yellow-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'partially_paid')}
                      >
                        {rm.partially_paid}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-orange-50 hover:text-orange-700 transition-colors text-orange-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid_pending_approval')}
                      >
                        {rm.paid_pending_approval}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors text-green-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid')}
                      >
                        {rm.paid}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'others')}
                      >
                        {rm.others}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              
              {branchPaymentStatusData.length > 0 && (
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={1} className="font-bold text-base">Total</TableCell>
                  <TableCell className="text-center font-bold text-base">{totals.total}</TableCell>
                  <TableCell className="text-center font-bold text-base text-red-600">{totals.unpaid}</TableCell>
                  <TableCell className="text-center font-bold text-base text-yellow-600">{totals.partially_paid}</TableCell>
                  <TableCell className="text-center font-bold text-base text-orange-600">{totals.paid_pending_approval}</TableCell>
                  <TableCell className="text-center font-bold text-base text-green-600">{totals.paid}</TableCell>
                  <TableCell className="text-center font-bold text-base">{totals.others}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {branchPaymentStatusData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">No data available for payment status analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPaymentStatusTable;
