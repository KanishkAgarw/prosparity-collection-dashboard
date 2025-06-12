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
import { Application } from '@/types/application';

interface BranchPaymentStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'branch_name' | 'unpaid' | 'partially_paid' | 'paid_pending_approval' | 'paid' | 'others' | 'total';

const BranchPaymentStatusTable = ({ applications, onDrillDown }: BranchPaymentStatusTableProps) => {
  const branchPaymentStatusData = useBranchPaymentData(applications);
  const { sortField, sortDirection, handleSort, getSortedData } = useTableSorting<SortField>('total');
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
      case 'unpaid': return item.total_stats.unpaid;
      case 'partially_paid': return item.total_stats.partially_paid;
      case 'paid_pending_approval': return item.total_stats.paid_pending_approval;
      case 'paid': return item.total_stats.paid;
      case 'others': return item.total_stats.others;
      case 'total': return item.total_stats.total;
      default: return 0;
    }
  };

  const sortedData = getSortedData(branchPaymentStatusData, getValue);

  // Calculate grand totals
  const grandTotals = branchPaymentStatusData.reduce(
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
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Payment Status by Branch</CardTitle>
            <CardDescription className="text-xs">
              Overview of payment statuses across branches and RMs with drill-down capability
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader 
                  label="Branch / RM" 
                  field="branch_name" 
                  onSort={handleSort}
                  className="w-48"
                />
                <SortableTableHeader 
                  label="Unpaid" 
                  field="unpaid" 
                  onSort={handleSort}
                  className="text-center w-20"
                />
                <SortableTableHeader 
                  label="Partially Paid" 
                  field="partially_paid" 
                  onSort={handleSort}
                  className="text-center w-32"
                />
                <SortableTableHeader 
                  label="Paid (Pending)" 
                  field="paid_pending_approval" 
                  onSort={handleSort}
                  className="text-center w-32"
                />
                <SortableTableHeader 
                  label="Paid" 
                  field="paid" 
                  onSort={handleSort}
                  className="text-center w-20"
                />
                <SortableTableHeader 
                  label="Others" 
                  field="others" 
                  onSort={handleSort}
                  className="text-center w-20"
                />
                <SortableTableHeader 
                  label="Total" 
                  field="total" 
                  onSort={handleSort}
                  className="text-center w-20"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((branch) => (
                <>
                  <TableRow key={branch.branch_name} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-sm">
                      <ExpandableRow
                        isExpanded={expandedBranches.has(branch.branch_name)}
                        onToggle={() => toggleBranch(branch.branch_name)}
                        label={branch.branch_name}
                      />
                    </TableCell>
                    <ClickableTableCell
                      value={branch.total_stats.unpaid}
                      onClick={() => handleCellClick(branch.branch_name, null, 'unpaid')}
                      colorClass="text-red-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.partially_paid}
                      onClick={() => handleCellClick(branch.branch_name, null, 'partially_paid')}
                      colorClass="text-yellow-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.paid_pending_approval}
                      onClick={() => handleCellClick(branch.branch_name, null, 'paid_pending_approval')}
                      colorClass="text-purple-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.paid}
                      onClick={() => handleCellClick(branch.branch_name, null, 'paid')}
                      colorClass="text-green-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.others}
                      onClick={() => handleCellClick(branch.branch_name, null, 'others')}
                    />
                    <ClickableTableCell
                      value={branch.total_stats.total}
                      onClick={() => handleCellClick(branch.branch_name, null, 'total')}
                    />
                  </TableRow>
                  
                  {expandedBranches.has(branch.branch_name) && branch.rm_stats.map((rm) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="bg-muted/30">
                      <TableCell className="text-sm pl-8">
                        {rm.rm_name}
                      </TableCell>
                      <ClickableTableCell
                        value={rm.unpaid}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'unpaid')}
                        colorClass="text-red-600"
                      />
                      <ClickableTableCell
                        value={rm.partially_paid}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'partially_paid')}
                        colorClass="text-yellow-600"
                      />
                      <ClickableTableCell
                        value={rm.paid_pending_approval}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid_pending_approval')}
                        colorClass="text-purple-600"
                      />
                      <ClickableTableCell
                        value={rm.paid}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid')}
                        colorClass="text-green-600"
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
                </>
              ))}
              
              {branchPaymentStatusData.length > 0 && (
                <TableRow className="bg-muted/50 font-medium border-t-2">
                  <TableCell className="font-bold text-sm">Total</TableCell>
                  <ClickableTableCell
                    value={grandTotals.unpaid}
                    onClick={() => handleCellClick('', null, 'unpaid')}
                    colorClass="text-red-600 font-bold"
                  />
                  <ClickableTableCell
                    value={grandTotals.partially_paid}
                    onClick={() => handleCellClick('', null, 'partially_paid')}
                    colorClass="text-yellow-600 font-bold"
                  />
                  <ClickableTableCell
                    value={grandTotals.paid_pending_approval}
                    onClick={() => handleCellClick('', null, 'paid_pending_approval')}
                    colorClass="text-purple-600 font-bold"
                  />
                  <ClickableTableCell
                    value={grandTotals.paid}
                    onClick={() => handleCellClick('', null, 'paid')}
                    colorClass="text-green-600 font-bold"
                  />
                  <ClickableTableCell
                    value={grandTotals.others}
                    onClick={() => handleCellClick('', null, 'others')}
                    className="font-bold"
                  />
                  <ClickableTableCell
                    value={grandTotals.total}
                    onClick={() => handleCellClick('', null, 'total')}
                    className="font-bold"
                  />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {branchPaymentStatusData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No data available for payment status analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPaymentStatusTable;
