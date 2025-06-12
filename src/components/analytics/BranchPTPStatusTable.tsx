
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
import { useBranchPTPData } from '@/hooks/useBranchPTPData';
import SortableTableHeader from './shared/SortableTableHeader';
import ExpandableRow from './shared/ExpandableRow';
import ClickableTableCell from './shared/ClickableTableCell';

interface BranchPTPStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'branch_name' | 'total';

const BranchPTPStatusTable = ({ applications, onDrillDown }: BranchPTPStatusTableProps) => {
  const ptpData = useBranchPTPData(applications);
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

  const handleCellClick = (branchName: string, rmName: string | null, ptpCriteria: string) => {
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName || undefined,
      status_type: 'ptp_analysis',
      ptp_criteria: ptpCriteria
    });
  };

  const getValue = (item: any, field: SortField) => {
    switch (field) {
      case 'branch_name': return item.branch_name;
      case 'total': return item.total_stats.total;
      default: return 0;
    }
  };

  const sortedData = getSortedData(ptpData, getValue);

  // Calculate totals for each PTP status
  const totals = ptpData.reduce((acc, branch) => ({
    overdue: acc.overdue + branch.total_stats.overdue,
    today: acc.today + branch.total_stats.today,
    tomorrow: acc.tomorrow + branch.total_stats.tomorrow,
    future: acc.future + branch.total_stats.future,
    no_ptp_set: acc.no_ptp_set + branch.total_stats.no_ptp_set,
    total: acc.total + branch.total_stats.total,
  }), { overdue: 0, today: 0, tomorrow: 0, future: 0, no_ptp_set: 0, total: 0 });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">PTP Status by Branch & RM</CardTitle>
            <CardDescription className="text-xs">
              Shows the count of applications by their Promise-to-Pay (PTP) dates across branches and RMs. Excludes applications with 'Paid' status. Click any number to drill down and see the detailed applications.
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
                <TableHead className="text-center min-w-20">Overdue</TableHead>
                <TableHead className="text-center min-w-16">Today</TableHead>
                <TableHead className="text-center min-w-20">Tomorrow</TableHead>
                <TableHead className="text-center min-w-16">Future</TableHead>
                <TableHead className="text-center min-w-24">No PTP Set</TableHead>
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
                      value={branch.total_stats.overdue}
                      onClick={() => handleCellClick(branch.branch_name, null, 'overdue')}
                      className="text-red-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.today}
                      onClick={() => handleCellClick(branch.branch_name, null, 'today')}
                      className="text-blue-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.tomorrow}
                      onClick={() => handleCellClick(branch.branch_name, null, 'tomorrow')}
                      className="text-orange-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.future}
                      onClick={() => handleCellClick(branch.branch_name, null, 'future')}
                      className="text-green-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.no_ptp_set}
                      onClick={() => handleCellClick(branch.branch_name, null, 'no_ptp_set')}
                      className="text-gray-600"
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
                        value={rm.overdue}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'overdue')}
                        className="text-red-600"
                      />
                      <ClickableTableCell
                        value={rm.today}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'today')}
                        className="text-blue-600"
                      />
                      <ClickableTableCell
                        value={rm.tomorrow}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'tomorrow')}
                        className="text-orange-600"
                      />
                      <ClickableTableCell
                        value={rm.future}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'future')}
                        className="text-green-600"
                      />
                      <ClickableTableCell
                        value={rm.no_ptp_set}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'no_ptp_set')}
                        className="text-gray-600"
                      />
                    </TableRow>
                  ))}
                </>
              ))}
              
              {ptpData.length > 0 && (
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
                    value={totals.overdue}
                    onClick={() => handleCellClick('', null, 'overdue')}
                    className="font-bold text-red-600"
                  />
                  <ClickableTableCell
                    value={totals.today}
                    onClick={() => handleCellClick('', null, 'today')}
                    className="font-bold text-blue-600"
                  />
                  <ClickableTableCell
                    value={totals.tomorrow}
                    onClick={() => handleCellClick('', null, 'tomorrow')}
                    className="font-bold text-orange-600"
                  />
                  <ClickableTableCell
                    value={totals.future}
                    onClick={() => handleCellClick('', null, 'future')}
                    className="font-bold text-green-600"
                  />
                  <ClickableTableCell
                    value={totals.no_ptp_set}
                    onClick={() => handleCellClick('', null, 'no_ptp_set')}
                    className="font-bold text-gray-600"
                  />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {ptpData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm font-medium">No PTP status data available</p>
            <p className="text-xs mt-2">Data will appear when applications have PTP dates set (excluding fully paid applications)</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPTPStatusTable;
