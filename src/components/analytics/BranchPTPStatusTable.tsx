
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
  const [selectedEmiMonth, setSelectedEmiMonth] = useState<string>('Jul-25');
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  
  const { data: branchPtpData, loading, error } = useBranchPTPData(
    applications, 
    selectedEmiMonth
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

  const availableMonths = ['Jun-25', 'Jul-25'];

  const handleCellClick = (branchName: string, rmName: string | undefined, ptpCriteria: string) => {
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName,
      status_type: 'total', // For PTP we use total as base
      ptp_criteria: ptpCriteria,
      selectedEmiMonth: selectedEmiMonth
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
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle>Branch PTP Status Analysis</CardTitle>
            <CardDescription>
              PTP status breakdown by branch and collection RM for {selectedEmiMonth} (excludes Paid applications)
            </CardDescription>
          </div>
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
                  <TableHead className="font-medium w-48">Branch / RM</TableHead>
                  <TableHead className="font-medium text-center w-20">Overdue</TableHead>
                  <TableHead className="font-medium text-center w-16">Today</TableHead>
                  <TableHead className="font-medium text-center w-20">Tomorrow</TableHead>
                  <TableHead className="font-medium text-center w-16">Future</TableHead>
                  <TableHead className="font-medium text-center w-24">No PTP Set</TableHead>
                  <TableHead className="font-medium text-center w-16">Total</TableHead>
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
                      <TableCell className="font-bold text-sm">{branch.branch_name}</TableCell>
                      <ClickableTableCell
                        value={branch.total_stats.overdue}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'overdue')}
                        className="text-red-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.today}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'today')}
                        className="text-blue-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.tomorrow}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'tomorrow')}
                        className="text-orange-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.future}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'future')}
                        className="text-green-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.no_ptp_set}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'no_ptp_set')}
                        className="text-gray-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.total}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                        className="text-purple-600 font-bold"
                      />
                    </TableRow>
                    {expandedBranches.has(branch.branch_name) && branch.rm_stats.map((rm) => (
                      <TableRow key={`${branch.branch_name}-${rm.rm_name}`}>
                        <TableCell></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center pl-4">
                            <span className="mr-2 text-gray-400">├─</span>
                            <span className="font-medium">{rm.rm_name}</span>
                          </div>
                        </TableCell>
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
                        <ClickableTableCell
                          value={rm.total}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                          className="text-purple-600 font-medium"
                        />
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                {branchPtpData.length > 0 && (
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell></TableCell>
                    <TableCell className="font-bold text-sm">Grand Total</TableCell>
                    <ClickableTableCell
                      value={totals.overdue}
                      onClick={() => handleCellClick('', undefined, 'overdue')}
                      className="text-red-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.today}
                      onClick={() => handleCellClick('', undefined, 'today')}
                      className="text-blue-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.tomorrow}
                      onClick={() => handleCellClick('', undefined, 'tomorrow')}
                      className="text-orange-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.future}
                      onClick={() => handleCellClick('', undefined, 'future')}
                      className="text-green-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.no_ptp_set}
                      onClick={() => handleCellClick('', undefined, 'no_ptp_set')}
                      className="text-gray-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.total}
                      onClick={() => handleCellClick('', undefined, 'total')}
                      className="text-purple-600 font-bold"
                    />
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
