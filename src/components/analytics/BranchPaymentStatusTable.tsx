
import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

  const handleCellClick = (
    branchName: string, 
    rmName: string | undefined, 
    statusType: string
  ) => {
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName,
      status_type: statusType
    });
  };

  const CellButton = ({ 
    value, 
    onClick, 
    className = "" 
  }: { 
    value: number; 
    onClick: () => void; 
    className?: string; 
  }) => (
    <button
      onClick={onClick}
      className={`text-center hover:bg-blue-50 hover:text-blue-600 rounded px-1 py-0.5 transition-colors ${className}`}
    >
      {value}
    </button>
  );

  const totals = branchPaymentStatusData.reduce(
    (acc, branch) => ({
      unpaid: acc.unpaid + branch.total_stats.unpaid,
      partially_paid: acc.partially_paid + branch.total_stats.partially_paid,
      paid_pending_approval: acc.paid_pending_approval + branch.total_stats.paid_pending_approval,
      paid: acc.paid + branch.total_stats.paid,
      others: acc.others + branch.total_stats.others,
      total: acc.total + branch.total_stats.total,
    }),
    { unpaid: 0, partially_paid: 0, paid_pending_approval: 0, paid: 0, others: 0, total: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status by Branch and RM</CardTitle>
        <CardDescription>
          Click on any number to view detailed applications. Expand branches to see RM-level breakdown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Branch / RM</TableHead>
                <TableHead className="font-medium text-center">Unpaid</TableHead>
                <TableHead className="font-medium text-center">Partially Paid</TableHead>
                <TableHead className="font-medium text-center">Paid (Pending Approval)</TableHead>
                <TableHead className="font-medium text-center">Paid</TableHead>
                <TableHead className="font-medium text-center">Others</TableHead>
                <TableHead className="font-medium text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchPaymentStatusData.map((branch) => (
                <>
                  {/* Branch Total Row */}
                  <TableRow key={branch.branch_name} className="bg-gray-50 font-medium">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBranch(branch.branch_name)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedBranches.has(branch.branch_name) ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                        <span className="font-bold">{branch.branch_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <CellButton
                        value={branch.total_stats.unpaid}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'unpaid')}
                        className="font-medium"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellButton
                        value={branch.total_stats.partially_paid}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'partially_paid')}
                        className="font-medium"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellButton
                        value={branch.total_stats.paid_pending_approval}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'paid_pending_approval')}
                        className="font-medium"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellButton
                        value={branch.total_stats.paid}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'paid')}
                        className="font-medium"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellButton
                        value={branch.total_stats.others}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'others')}
                        className="font-medium"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellButton
                        value={branch.total_stats.total}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                        className="font-medium"
                      />
                    </TableCell>
                  </TableRow>

                  {/* RM Rows (when expanded) */}
                  {expandedBranches.has(branch.branch_name) && branch.rm_stats.map((rm) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="border-l-4 border-l-blue-200">
                      <TableCell className="pl-12">{rm.rm_name}</TableCell>
                      <TableCell className="text-center">
                        <CellButton
                          value={rm.unpaid}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'unpaid')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <CellButton
                          value={rm.partially_paid}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'partially_paid')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <CellButton
                          value={rm.paid_pending_approval}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid_pending_approval')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <CellButton
                          value={rm.paid}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <CellButton
                          value={rm.others}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'others')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <CellButton
                          value={rm.total}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}

              {/* Grand Total Row */}
              {branchPaymentStatusData.length > 0 && (
                <TableRow className="bg-muted font-bold border-t-2">
                  <TableCell className="font-bold">Grand Total</TableCell>
                  <TableCell className="text-center font-bold">{totals.unpaid}</TableCell>
                  <TableCell className="text-center font-bold">{totals.partially_paid}</TableCell>
                  <TableCell className="text-center font-bold">{totals.paid_pending_approval}</TableCell>
                  <TableCell className="text-center font-bold">{totals.paid}</TableCell>
                  <TableCell className="text-center font-bold">{totals.others}</TableCell>
                  <TableCell className="text-center font-bold">{totals.total}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {branchPaymentStatusData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No data available for payment status analysis
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPaymentStatusTable;
