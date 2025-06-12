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
import { Application } from '@/types/application';

interface BranchPTPStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'branch_name' | 'overdue' | 'today' | 'tomorrow' | 'future' | 'no_ptp_set' | 'total';

const BranchPTPStatusTable = ({ applications, onDrillDown }: BranchPTPStatusTableProps) => {
  const branchPtpStatusData = useBranchPTPData(applications);
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
      case 'overdue': return item.total_stats.overdue;
      case 'today': return item.total_stats.today;
      case 'tomorrow': return item.total_stats.tomorrow;
      case 'future': return item.total_stats.future;
      case 'no_ptp_set': return item.total_stats.no_ptp_set;
      case 'total': return item.total_stats.total;
      default: return 0;
    }
  };

  const sortedData = getSortedData(branchPtpStatusData, getValue);

  // Calculate grand totals
  const grandTotals = branchPtpStatusData.reduce(
    (acc, branch) => ({
      overdue: acc.overdue + branch.total_stats.overdue,
      today: acc.today + branch.total_stats.today,
      tomorrow: acc.tomorrow + branch.total_stats.tomorrow,
      future: acc.future + branch.total_stats.future,
      no_ptp_set: acc.no_ptp_set + branch.total_stats.no_ptp_set,
      total: acc.total + branch.total_stats.total,
    }),
    { overdue: 0, today: 0, tomorrow: 0, future: 0, no_ptp_set: 0, total: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">PTP Status by Branch</CardTitle>
            <CardDescription className="text-xs">
              Overview of PTP (Promise to Pay) statuses across branches and RMs with drill-down capability
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
                  label="Overdue" 
                  field="overdue" 
                  onSort={handleSort}
                  className="text-center w-24"
                />
                <SortableTableHeader 
                  label="Today" 
                  field="today" 
                  onSort={handleSort}
                  className="text-center w-24"
                />
                <SortableTableHeader 
                  label="Tomorrow" 
                  field="tomorrow" 
                  onSort={handleSort}
                  className="text-center w-24"
                />
                <SortableTableHeader 
                  label="Future" 
                  field="future" 
                  onSort={handleSort}
                  className="text-center w-24"
                />
                <SortableTableHeader 
                  label="No PTP Set" 
                  field="no_ptp_set" 
                  onSort={handleSort}
                  className="text-center w-24"
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
                      value={branch.total_stats.overdue}
                      onClick={() => handleCellClick(branch.branch_name, null, 'overdue')}
                      colorClass="text-red-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.today}
                      onClick={() => handleCellClick(branch.branch_name, null, 'today')}
                      colorClass="text-blue-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.tomorrow}
                      onClick={() => handleCellClick(branch.branch_name, null, 'tomorrow')}
                      colorClass="text-orange-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.future}
                      onClick={() => handleCellClick(branch.branch_name, null, 'future')}
                      colorClass="text-green-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.no_ptp_set}
                      onClick={() => handleCellClick(branch.branch_name, null, 'no_ptp_set')}
                      colorClass="text-gray-600"
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
                        value={rm.overdue}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'overdue')}
                        colorClass="text-red-600"
                      />
                      <ClickableTableCell
                        value={rm.today}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'today')}
                        colorClass="text-blue-600"
                      />
                      <ClickableTableCell
                        value={rm.tomorrow}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'tomorrow')}
                        colorClass="text-orange-600"
                      />
                      <ClickableTableCell
                        value={rm.future}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'future')}
                        colorClass="text-green-600"
                      />
                      <ClickableTableCell
                        value={rm.no_ptp_set}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'no_ptp_set')}
                        colorClass="text-gray-600"
                      />
                      <ClickableTableCell
                        value={rm.total}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                      />
                    </TableRow>
                  ))}
                </>
              ))}
              
              {branchPtpStatusData.length > 0 && (
                <TableRow className="bg-muted/50 font-medium border-t-2">
                  <TableCell className="font-bold text-sm">Total</TableCell>
                  <ClickableTableCell
                    value={grandTotals.overdue}
                    onClick={() => handleCellClick('', null, 'overdue')}
                    colorClass="text-red-600 font-bold"
                  />
                  <ClickableTableCell
                    value={grandTotals.today}
                    onClick={() => handleCellClick('', null, 'today')}
                    colorClass="text-blue-600 font-bold"
                  />
                  <ClickableTableCell
                    value={grandTotals.tomorrow}
                    onClick={() => handleCellClick('', null, 'tomorrow')}
                    colorClass="text-orange-600 font-bold"
                  />
                  <ClickableTableCell
                    value={grandTotals.future}
                    onClick={() => handleCellClick('', null, 'future')}
                    colorClass="text-green-600 font-bold"
                  />
                  <ClickableTableCell
                    value={grandTotals.no_ptp_set}
                    onClick={() => handleCellClick('', null, 'no_ptp_set')}
                    colorClass="text-gray-600 font-bold"
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
        
        {branchPtpStatusData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No data available for PTP status analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPTPStatusTable;
