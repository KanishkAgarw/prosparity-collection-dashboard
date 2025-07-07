
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Application } from '@/types/application';
import { useBranchPTPData, type BranchPTPStatus } from '@/hooks/useBranchPTPData';
import ClickableTableCell from './shared/ClickableTableCell';
import { DrillDownFilter } from '@/pages/Analytics';

interface BranchPTPStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

const BranchPTPStatusTable = ({ applications, onDrillDown }: BranchPTPStatusTableProps) => {
  const [selectedEmiMonth, setSelectedEmiMonth] = useState<string>('All');
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  
  const { data: branchPtpData, loading, error } = useBranchPTPData(
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

  const handleCellClick = (branchName: string, rmName: string | undefined, ptpCriteria: string) => {
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName,
      status_type: 'total', // For PTP we use total as base
      ptp_criteria: ptpCriteria,
      selectedEmiMonth: selectedEmiMonth // Pass the selected month
    });
  };

  const totals = branchPtpData.reduce(
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branch PTP Status Analysis</CardTitle>
          <CardDescription>
            PTP status breakdown by branch and collection RM (excludes Paid applications)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading PTP data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branch PTP Status Analysis</CardTitle>
          <CardDescription>
            PTP status breakdown by branch and collection RM (excludes Paid applications)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p className="text-lg font-medium">Error loading PTP data</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch PTP Status Analysis</CardTitle>
        <CardDescription>
          PTP status breakdown by branch and collection RM for {selectedEmiMonth === 'All' ? 'all months' : selectedEmiMonth} (excludes Paid applications)
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
        {branchPtpData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No PTP data available for the selected month
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium w-8"></TableHead>
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
                {branchPtpData.map((branch) => (
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
                        value={branch.total_stats.overdue}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'overdue')}
                      />
                      <ClickableTableCell
                        value={branch.total_stats.today}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'today')}
                      />
                      <ClickableTableCell
                        value={branch.total_stats.tomorrow}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'tomorrow')}
                      />
                      <ClickableTableCell
                        value={branch.total_stats.future}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'future')}
                      />
                      <ClickableTableCell
                        value={branch.total_stats.no_ptp_set}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'no_ptp_set')}
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
                          value={rm.overdue}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'overdue')}
                        />
                        <ClickableTableCell
                          value={rm.today}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'today')}
                        />
                        <ClickableTableCell
                          value={rm.tomorrow}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'tomorrow')}
                        />
                        <ClickableTableCell
                          value={rm.future}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'future')}
                        />
                        <ClickableTableCell
                          value={rm.no_ptp_set}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'no_ptp_set')}
                        />
                        <ClickableTableCell
                          value={rm.total}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                        />
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                {branchPtpData.length > 0 && (
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell></TableCell>
                    <TableCell className="font-bold">Grand Total</TableCell>
                    <TableCell className="text-center font-bold">{totals.overdue}</TableCell>
                    <TableCell className="text-center font-bold">{totals.today}</TableCell>
                    <TableCell className="text-center font-bold">{totals.tomorrow}</TableCell>
                    <TableCell className="text-center font-bold">{totals.future}</TableCell>
                    <TableCell className="text-center font-bold">{totals.no_ptp_set}</TableCell>
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

export default BranchPTPStatusTable;
