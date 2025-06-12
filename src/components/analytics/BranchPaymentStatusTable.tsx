
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
  const { branchData } = useBranchAnalyticsData(applications);
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

  const totals = branchData.reduce(
    (acc, branch) => ({
      unpaid: acc.unpaid + branch.totals.unpaid,
      partially_paid: acc.partially_paid + branch.totals.partially_paid,
      paid_pending_approval: acc.paid_pending_approval + branch.totals.paid_pending_approval,
      paid: acc.paid + branch.totals.paid,
      others: acc.others + branch.totals.others,
      total: acc.total + branch.totals.total,
    }),
    { unpaid: 0, partially_paid: 0, paid_pending_approval: 0, paid: 0, others: 0, total: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Payment Status by Branch</CardTitle>
        <CardDescription className="text-lg">
          Click any number to view details. Expand branches for RM breakdown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-lg w-48">Branch/RM</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Unpaid</TableHead>
                <TableHead className="font-semibold text-lg text-center w-32">Partially Paid</TableHead>
                <TableHead className="font-semibold text-lg text-center w-40">Paid (Pending Approval)</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Paid</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Others</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchData.map((branch) => (
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
                      className="text-center text-base cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors font-medium"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'unpaid')}
                    >
                      {branch.totals.unpaid}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-yellow-50 hover:text-yellow-700 transition-colors font-medium"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'partially_paid')}
                    >
                      {branch.totals.partially_paid}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'paid_pending_approval')}
                    >
                      {branch.totals.paid_pending_approval}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors font-medium"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'paid')}
                    >
                      {branch.totals.paid}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-gray-50 hover:text-gray-700 transition-colors font-medium"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'others')}
                    >
                      {branch.totals.others}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-purple-50 hover:text-purple-700 transition-colors font-semibold"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                    >
                      {branch.totals.total}
                    </TableCell>
                  </TableRow>
                  
                  {expandedBranches.has(branch.branch_name) && branch.rms.map((rm) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="bg-muted/25 hover:bg-muted/40">
                      <TableCell className="text-base pl-8">
                        {rm.rm_name}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'unpaid')}
                      >
                        {rm.unpaid}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'partially_paid')}
                      >
                        {rm.partially_paid}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid_pending_approval')}
                      >
                        {rm.paid_pending_approval}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors"
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
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-purple-50 hover:text-purple-700 transition-colors font-medium"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                      >
                        {rm.total}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              
              {branchData.length > 0 && (
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={1} className="font-bold text-base">Total</TableCell>
                  <TableCell className="text-center font-bold text-base">{totals.unpaid}</TableCell>
                  <TableCell className="text-center font-bold text-base">{totals.partially_paid}</TableCell>
                  <TableCell className="text-center font-bold text-base">{totals.paid_pending_approval}</TableCell>
                  <TableCell className="text-center font-bold text-base">{totals.paid}</TableCell>
                  <TableCell className="text-center font-bold text-base">{totals.others}</TableCell>
                  <TableCell className="text-center font-bold text-base">{totals.total}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {branchData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">No data available for payment status analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPaymentStatusTable;
