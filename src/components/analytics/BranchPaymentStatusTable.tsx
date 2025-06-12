
import { Application } from '@/types/application';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { DrillDownFilter } from '@/pages/Analytics';
import { useTableSorting } from '@/hooks/useTableSorting';
import { useBranchPaymentData } from '@/hooks/useBranchPaymentData';
import SortableTableHeader from './shared/SortableTableHeader';
import ExpandableRow from './shared/ExpandableRow';
import ClickableTableCell from './shared/ClickableTableCell';

interface BranchPaymentStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'branch_name' | 'total';

const BranchPaymentStatusTable = ({ applications, onDrillDown }: BranchPaymentStatusTableProps) => {
  const paymentData = useBranchPaymentData(applications);
  const { sortField, sortDirection, handleSort, getSortedData } = useTableSorting<SortField>('total', 'desc');
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

  const handleCellClick = (branchName: string, rmName: string | null, statusType: string) => {
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName || undefined,
      status_type: statusType
    });
  };

  const getValue = (item: any, field: SortField) => {
    switch (field) {
      case 'branch_name': return item.branch_name;
      case 'total': return item.total_stats.total;
      default: return 0;
    }
  };

  const sortedData = getSortedData(paymentData, getValue);

  // Calculate totals for each status
  const totals = paymentData.reduce((acc, branch) => ({
    unpaid: acc.unpaid + branch.total_stats.unpaid,
    partially_paid: acc.partially_paid + branch.total_stats.partially_paid,
    paid_pending_approval: acc.paid_pending_approval + branch.total_stats.paid_pending_approval,
    paid: acc.paid + branch.total_stats.paid,
    others: acc.others + branch.total_stats.others,
    total: acc.total + branch.total_stats.total,
  }), { unpaid: 0, partially_paid: 0, paid_pending_approval: 0, paid: 0, others: 0, total: 0 });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Payment Status by Branch & RM</CardTitle>
            <CardDescription className="text-xs">
              Shows the count of applications in each payment status category across branches and RMs. Click any number to drill down and see the detailed applications.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader 
                  label="Branch / RM" 
                  field="branch_name" 
                  onSort={handleSort}
                  className="w-48 sticky left-0 bg-background"
                />
                <SortableTableHeader 
                  label="Total" 
                  field="total" 
                  onSort={handleSort}
                  className="text-center w-20"
                />
                <TableHead className="text-center min-w-20">Unpaid</TableHead>
                <TableHead className="text-center min-w-20">Partially Paid</TableHead>
                <TableHead className="text-center min-w-24">Paid (Pending Approval)</TableHead>
                <TableHead className="text-center min-w-16">Paid</TableHead>
                <TableHead className="text-center min-w-16">Others</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((branch) => (
                <>
                  <TableRow key={branch.branch_name} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-sm sticky left-0 bg-background">
                      <ExpandableRow
                        isExpanded={expandedBranches.has(branch.branch_name)}
                        onToggle={() => toggleBranch(branch.branch_name)}
                        label={branch.branch_name}
                      />
                    </TableCell>
                    <ClickableTableCell
                      value={branch.total_stats.total}
                      onClick={() => handleCellClick(branch.branch_name, null, 'total')}
                    />
                    <ClickableTableCell
                      value={branch.total_stats.unpaid}
                      onClick={() => handleCellClick(branch.branch_name, null, 'unpaid')}
                    />
                    <ClickableTableCell
                      value={branch.total_stats.partially_paid}
                      onClick={() => handleCellClick(branch.branch_name, null, 'partially_paid')}
                    />
                    <ClickableTableCell
                      value={branch.total_stats.paid_pending_approval}
                      onClick={() => handleCellClick(branch.branch_name, null, 'paid_pending_approval')}
                    />
                    <ClickableTableCell
                      value={branch.total_stats.paid}
                      onClick={() => handleCellClick(branch.branch_name, null, 'paid')}
                    />
                    <ClickableTableCell
                      value={branch.total_stats.others}
                      onClick={() => handleCellClick(branch.branch_name, null, 'others')}
                    />
                  </TableRow>
                  
                  {expandedBranches.has(branch.branch_name) && branch.rm_stats.map((rm) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="bg-muted/30">
                      <TableCell className="text-sm pl-8 sticky left-0 bg-muted/30">
                        {rm.rm_name}
                      </TableCell>
                      <ClickableTableCell
                        value={rm.total}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                      />
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
                    </TableRow>
                  ))}
                </>
              ))}
              
              {paymentData.length > 0 && (
                <TableRow className="bg-muted/50 font-medium border-t-2">
                  <TableCell className="font-bold text-sm sticky left-0 bg-muted/50">
                    Total
                  </TableCell>
                  <ClickableTableCell
                    value={totals.total}
                    onClick={() => handleCellClick('', null, 'total')}
                    className="font-bold"
                  />
                  <ClickableTableCell
                    value={totals.unpaid}
                    onClick={() => handleCellClick('', null, 'unpaid')}
                    className="font-bold"
                  />
                  <ClickableTableCell
                    value={totals.partially_paid}
                    onClick={() => handleCellClick('', null, 'partially_paid')}
                    className="font-bold"
                  />
                  <ClickableTableCell
                    value={totals.paid_pending_approval}
                    onClick={() => handleCellClick('', null, 'paid_pending_approval')}
                    className="font-bold"
                  />
                  <ClickableTableCell
                    value={totals.paid}
                    onClick={() => handleCellClick('', null, 'paid')}
                    className="font-bold"
                  />
                  <ClickableTableCell
                    value={totals.others}
                    onClick={() => handleCellClick('', null, 'others')}
                    className="font-bold"
                  />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {paymentData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm font-medium">No payment status data available</p>
            <p className="text-xs mt-2">Data will appear when applications with different payment statuses are loaded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPaymentStatusTable;
