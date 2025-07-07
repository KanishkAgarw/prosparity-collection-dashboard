
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Application } from '@/types/application';
import { useBranchPaymentData, type BranchPaymentStatus } from '@/hooks/useBranchPaymentData';
import ClickableTableCell from './shared/ClickableTableCell';
import { DrillDownFilter } from '@/pages/Analytics';

interface BranchPaymentStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

const BranchPaymentStatusTable = ({ applications, onDrillDown }: BranchPaymentStatusTableProps) => {
  const [selectedEmiMonth, setSelectedEmiMonth] = useState<string>('All');
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  
  const { data: branchPaymentData, loading, error } = useBranchPaymentData(
    applications, 
    selectedEmiMonth === 'All' ? undefined : selectedEmiMonth
  );

  const toggleBranchExpansion = (branchName: string) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(branchName)) {
      newExpanded.delete(branchName);
    } else {
      newExpanded.add(branchName);
    }
    setExpandedBranches(newExpanded);
  };

  const availableMonths = ['All', 'Jun-25', 'Jul-25'];

  const handleCellClick = (branchName: string, rmName: string | undefined, statusType: string) => {
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName,
      status_type: statusType,
      selectedEmiMonth: selectedEmiMonth // Pass the selected month
    });
  };

  const totals = branchPaymentData.reduce(
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branch Payment Status Analysis</CardTitle>
          <CardDescription>
            Payment status breakdown by branch and collection RM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading payment data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branch Payment Status Analysis</CardTitle>
          <CardDescription>
            Payment status breakdown by branch and collection RM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p className="text-lg font-medium">Error loading payment data</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch Payment Status Analysis</CardTitle>
        <CardDescription>
          Payment status breakdown by branch and collection RM for {selectedEmiMonth === 'All' ? 'all months' : selectedEmiMonth}
        </CardDescription>
        <div className="flex gap-4 items-center">
          <Select value={selectedEmiMonth} onValueChange={setSelectedEmiMonth}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select EMI Month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {branchPaymentData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payment data available for the selected month
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium w-8"></TableHead>
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
                {branchPaymentData.map((branch) => (
                  <React.Fragment key={branch.branch_name}>
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBranchExpansion(branch.branch_name)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedBranches.has(branch.branch_name) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-bold">{branch.branch_name}</TableCell>
                      <ClickableTableCell
                        value={branch.total_stats.unpaid}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'unpaid')}
                      />
                      <ClickableTableCell
                        value={branch.total_stats.partially_paid}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'partially_paid')}
                      />
                      <ClickableTableCell
                        value={branch.total_stats.paid_pending_approval}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'paid_pending_approval')}
                      />
                      <ClickableTableCell
                        value={branch.total_stats.paid}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'paid')}
                      />
                      <ClickableTableCell
                        value={branch.total_stats.others}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'others')}
                      />
                      <ClickableTableCell
                        value={branch.total_stats.total}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                      />
                    </TableRow>
                    {expandedBranches.has(branch.branch_name) && branch.rm_stats.map((rm) => (
                      <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="pl-8">
                        <TableCell></TableCell>
                        <TableCell className="pl-8 text-muted-foreground">└ {rm.rm_name}</TableCell>
                        <ClickableTableCell
                          value={rm.unpaid}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'unpaid')}
                        />
                        <ClickableTableCell
                          value={rm.partially_paid}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'partially_paid')}
                        />
                        <ClickableTableCell
                          value={rm.paid_pending_approval}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid_pending_approval')}
                        />
                        <ClickableTableCell
                          value={rm.paid}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid')}
                        />
                        <ClickableTableCell
                          value={rm.others}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'others')}
                        />
                        <ClickableTableCell
                          value={rm.total}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                        />
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                {branchPaymentData.length > 0 && (
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell></TableCell>
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
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPaymentStatusTable;
