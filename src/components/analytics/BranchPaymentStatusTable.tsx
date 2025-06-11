
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
import { ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react';
import { DrillDownFilter } from '@/pages/Analytics';

interface BranchPaymentStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'branch' | 'unpaid' | 'partially_paid' | 'paid_pending_approval' | 'paid' | 'others' | 'total';
type SortDirection = 'asc' | 'desc';

const BranchPaymentStatusTable = ({ applications, onDrillDown }: BranchPaymentStatusTableProps) => {
  const { branchPaymentStatusData } = useBranchAnalyticsData(applications);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const toggleBranch = (branchName: string) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(branchName)) {
      newExpanded.delete(branchName);
    } else {
      newExpanded.add(branchName);
    }
    setExpandedBranches(newExpanded);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...branchPaymentStatusData].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    if (sortField === 'branch') {
      aValue = a.branch_name;
      bValue = b.branch_name;
    } else {
      aValue = a.total_stats[sortField];
      bValue = b.total_stats[sortField];
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

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
      className={`text-center hover:bg-blue-50 hover:text-blue-600 rounded px-1 py-0.5 transition-colors w-full ${className}`}
    >
      {value}
    </button>
  );

  const SortableHeader = ({ 
    field, 
    children, 
    className = "" 
  }: { 
    field: SortField; 
    children: React.ReactNode; 
    className?: string; 
  }) => (
    <TableHead className={`cursor-pointer hover:bg-gray-50 ${className}`} onClick={() => handleSort(field)}>
      <div className="flex items-center justify-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  const totals = sortedData.reduce(
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Payment Status by Branch</CardTitle>
        <CardDescription className="text-sm">
          Click any number to view details. Expand branches for RM breakdown.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <SortableHeader field="branch" className="min-w-[120px]">Branch/RM</SortableHeader>
                <SortableHeader field="unpaid" className="w-16 text-center">Unpaid</SortableHeader>
                <SortableHeader field="partially_paid" className="w-16 text-center">Part. Paid</SortableHeader>
                <SortableHeader field="paid_pending_approval" className="w-20 text-center">Pend. Appr.</SortableHeader>
                <SortableHeader field="paid" className="w-16 text-center">Paid</SortableHeader>
                <SortableHeader field="others" className="w-16 text-center">Others</SortableHeader>
                <SortableHeader field="total" className="w-16 text-center">Total</SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((branch) => (
                <>
                  {/* Branch Total Row */}
                  <TableRow key={branch.branch_name} className="bg-gray-50 font-medium text-sm">
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBranch(branch.branch_name)}
                          className="h-5 w-5 p-0"
                        >
                          {expandedBranches.has(branch.branch_name) ? 
                            <ChevronDown className="h-3 w-3" /> : 
                            <ChevronRight className="h-3 w-3" />
                          }
                        </Button>
                        <span className="font-bold text-xs truncate">{branch.branch_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <CellButton
                        value={branch.total_stats.unpaid}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'unpaid')}
                        className="font-medium text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <CellButton
                        value={branch.total_stats.partially_paid}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'partially_paid')}
                        className="font-medium text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <CellButton
                        value={branch.total_stats.paid_pending_approval}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'paid_pending_approval')}
                        className="font-medium text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <CellButton
                        value={branch.total_stats.paid}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'paid')}
                        className="font-medium text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <CellButton
                        value={branch.total_stats.others}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'others')}
                        className="font-medium text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <CellButton
                        value={branch.total_stats.total}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                        className="font-medium text-xs"
                      />
                    </TableCell>
                  </TableRow>

                  {/* RM Rows (when expanded) */}
                  {expandedBranches.has(branch.branch_name) && branch.rm_stats.map((rm) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="border-l-4 border-l-blue-200 text-sm">
                      <TableCell className="pl-8 py-1 text-xs truncate">{rm.rm_name}</TableCell>
                      <TableCell className="text-center py-1">
                        <CellButton
                          value={rm.unpaid}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'unpaid')}
                          className="text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <CellButton
                          value={rm.partially_paid}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'partially_paid')}
                          className="text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <CellButton
                          value={rm.paid_pending_approval}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid_pending_approval')}
                          className="text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <CellButton
                          value={rm.paid}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid')}
                          className="text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <CellButton
                          value={rm.others}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'others')}
                          className="text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <CellButton
                          value={rm.total}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                          className="text-xs"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}

              {/* Grand Total Row */}
              {sortedData.length > 0 && (
                <TableRow className="bg-muted font-bold border-t-2 text-sm">
                  <TableCell className="font-bold py-2 text-xs">Grand Total</TableCell>
                  <TableCell className="text-center font-bold text-xs">{totals.unpaid}</TableCell>
                  <TableCell className="text-center font-bold text-xs">{totals.partially_paid}</TableCell>
                  <TableCell className="text-center font-bold text-xs">{totals.paid_pending_approval}</TableCell>
                  <TableCell className="text-center font-bold text-xs">{totals.paid}</TableCell>
                  <TableCell className="text-center font-bold text-xs">{totals.others}</TableCell>
                  <TableCell className="text-center font-bold text-xs">{totals.total}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {sortedData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No data available for payment status analysis
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPaymentStatusTable;
