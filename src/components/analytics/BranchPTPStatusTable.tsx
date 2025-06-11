
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

interface BranchPTPStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

const BranchPTPStatusTable = ({ applications, onDrillDown }: BranchPTPStatusTableProps) => {
  const { branchPtpStatusData } = useBranchAnalyticsData(applications);
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
      className={`text-center hover:bg-blue-50 hover:text-blue-600 rounded px-1 py-0.5 transition-colors ${className}`}
    >
      {value}
    </button>
  );

  const totals = branchPtpStatusData.reduce(
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
        <CardTitle>PTP Status by Branch and RM</CardTitle>
        <CardDescription>
          PTP date analysis for unpaid applications (excludes fully paid cases). Click on any number to view detailed applications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Branch / RM</TableHead>
                <TableHead className="font-medium text-center">Overdue</TableHead>
                <TableHead className="font-medium text-center">Today</TableHead>
                <TableHead className="font-medium text-center">Tomorrow</TableHead>
                <TableHead className="font-medium text-center">Future</TableHead>
                <TableHead className="font-medium text-center">No PTP Set</TableHead>
                <TableHead className="font-medium text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchPtpStatusData.map((branch) => (
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
                        value={branch.total_stats.overdue}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'overdue', 'overdue')}
                        className="font-medium text-red-600"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellButton
                        value={branch.total_stats.today}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'today', 'today')}
                        className="font-medium text-blue-600"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellButton
                        value={branch.total_stats.tomorrow}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'tomorrow', 'tomorrow')}
                        className="font-medium text-orange-600"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellButton
                        value={branch.total_stats.future}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'future', 'future')}
                        className="font-medium text-green-600"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellButton
                        value={branch.total_stats.no_ptp_set}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'no_ptp_set', 'no_ptp_set')}
                        className="font-medium text-gray-600"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <CellButton
                        value={branch.total_stats.total}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'total', 'total')}
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
                          value={rm.overdue}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'overdue', 'overdue')}
                          className="text-red-600"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <CellButton
                          value={rm.today}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'today', 'today')}
                          className="text-blue-600"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <CellButton
                          value={rm.tomorrow}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'tomorrow', 'tomorrow')}
                          className="text-orange-600"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <CellButton
                          value={rm.future}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'future', 'future')}
                          className="text-green-600"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <CellButton
                          value={rm.no_ptp_set}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'no_ptp_set', 'no_ptp_set')}
                          className="text-gray-600"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <CellButton
                          value={rm.total}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total', 'total')}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}

              {/* Grand Total Row */}
              {branchPtpStatusData.length > 0 && (
                <TableRow className="bg-muted font-bold border-t-2">
                  <TableCell className="font-bold">Grand Total</TableCell>
                  <TableCell className="text-center font-bold text-red-600">{totals.overdue}</TableCell>
                  <TableCell className="text-center font-bold text-blue-600">{totals.today}</TableCell>
                  <TableCell className="text-center font-bold text-orange-600">{totals.tomorrow}</TableCell>
                  <TableCell className="text-center font-bold text-green-600">{totals.future}</TableCell>
                  <TableCell className="text-center font-bold text-gray-600">{totals.no_ptp_set}</TableCell>
                  <TableCell className="text-center font-bold">{totals.total}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {branchPtpStatusData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No data available for PTP status analysis
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPTPStatusTable;
