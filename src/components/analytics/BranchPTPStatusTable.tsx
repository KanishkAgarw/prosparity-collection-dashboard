
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

interface BranchPTPStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'branch' | 'overdue' | 'today' | 'tomorrow' | 'future' | 'no_ptp_set' | 'total';
type SortDirection = 'asc' | 'desc';

const BranchPTPStatusTable = ({ applications, onDrillDown }: BranchPTPStatusTableProps) => {
  const { branchPtpStatusData } = useBranchAnalyticsData(applications);
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

  const sortedData = [...branchPtpStatusData].sort((a, b) => {
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
    statusType: string,
    ptpCriteria: string
  ) => {
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName,
      status_type: statusType,
      ptp_criteria: ptpCriteria
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">PTP Status by Branch</CardTitle>
        <CardDescription className="text-sm">
          PTP analysis for unpaid applications. Click any number for details.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <SortableHeader field="branch" className="min-w-[120px]">Branch/RM</SortableHeader>
                <SortableHeader field="overdue" className="w-16 text-center">Overdue</SortableHeader>
                <SortableHeader field="today" className="w-16 text-center">Today</SortableHeader>
                <SortableHeader field="tomorrow" className="w-16 text-center">Tomorrow</SortableHeader>
                <SortableHeader field="future" className="w-16 text-center">Future</SortableHeader>
                <SortableHeader field="no_ptp_set" className="w-16 text-center">No PTP</SortableHeader>
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
                        value={branch.total_stats.overdue}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'overdue', 'overdue')}
                        className="font-medium text-red-600 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <CellButton
                        value={branch.total_stats.today}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'today', 'today')}
                        className="font-medium text-blue-600 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <CellButton
                        value={branch.total_stats.tomorrow}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'tomorrow', 'tomorrow')}
                        className="font-medium text-orange-600 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <CellButton
                        value={branch.total_stats.future}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'future', 'future')}
                        className="font-medium text-green-600 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <CellButton
                        value={branch.total_stats.no_ptp_set}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'no_ptp_set', 'no_ptp_set')}
                        className="font-medium text-gray-600 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <CellButton
                        value={branch.total_stats.total}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'total', 'total')}
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
                          value={rm.overdue}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'overdue', 'overdue')}
                          className="text-red-600 text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <CellButton
                          value={rm.today}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'today', 'today')}
                          className="text-blue-600 text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <CellButton
                          value={rm.tomorrow}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'tomorrow', 'tomorrow')}
                          className="text-orange-600 text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <CellButton
                          value={rm.future}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'future', 'future')}
                          className="text-green-600 text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <CellButton
                          value={rm.no_ptp_set}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'no_ptp_set', 'no_ptp_set')}
                          className="text-gray-600 text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <CellButton
                          value={rm.total}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total', 'total')}
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
                  <TableCell className="text-center font-bold text-red-600 text-xs">{totals.overdue}</TableCell>
                  <TableCell className="text-center font-bold text-blue-600 text-xs">{totals.today}</TableCell>
                  <TableCell className="text-center font-bold text-orange-600 text-xs">{totals.tomorrow}</TableCell>
                  <TableCell className="text-center font-bold text-green-600 text-xs">{totals.future}</TableCell>
                  <TableCell className="text-center font-bold text-gray-600 text-xs">{totals.no_ptp_set}</TableCell>
                  <TableCell className="text-center font-bold text-xs">{totals.total}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {sortedData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No data available for PTP status analysis
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPTPStatusTable;
