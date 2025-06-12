
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
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { DrillDownFilter } from '@/pages/Analytics';

interface BranchPTPStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

const BranchPTPStatusTable = ({ applications, onDrillDown }: BranchPTPStatusTableProps) => {
  const { ptpBranchData } = useBranchAnalyticsData(applications);
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

  const handleCellClick = (branchName: string, rmName: string | undefined, statusType: string, ptpCriteria?: string) => {
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName,
      status_type: statusType,
      ptp_criteria: ptpCriteria
    });
  };

  const totals = ptpBranchData.reduce(
    (acc, branch) => ({
      overdue: acc.overdue + branch.totals.overdue,
      today: acc.today + branch.totals.today,
      tomorrow: acc.tomorrow + branch.totals.tomorrow,
      future: acc.future + branch.totals.future,
      no_ptp_set: acc.no_ptp_set + branch.totals.no_ptp_set,
      total: acc.total + branch.totals.total,
    }),
    { overdue: 0, today: 0, tomorrow: 0, future: 0, no_ptp_set: 0, total: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">PTP Status by Branch</CardTitle>
        <CardDescription className="text-lg">
          PTP date analysis for unpaid applications (excludes fully paid cases)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-lg w-48">Branch/RM</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Overdue</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Today</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Tomorrow</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Future</TableHead>
                <TableHead className="font-semibold text-lg text-center w-32">No PTP Set</TableHead>
                <TableHead className="font-semibold text-lg text-center w-24">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ptpBranchData.map((branch) => (
                <>
                  <TableRow key={branch.branch_name} className="hover:bg-muted/50">
                    <TableCell className="font-semibold text-base">
                      <button
                        onClick={() => toggleBranch(branch.branch_name)}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                      >
                        {expandedBranches.has(branch.branch_name) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {branch.branch_name}
                      </button>
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-red-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'overdue', 'overdue')}
                    >
                      {branch.totals.overdue}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium text-blue-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'today', 'today')}
                    >
                      {branch.totals.today}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-orange-50 hover:text-orange-700 transition-colors font-medium text-orange-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'tomorrow', 'tomorrow')}
                    >
                      {branch.totals.tomorrow}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors font-medium text-green-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'future', 'future')}
                    >
                      {branch.totals.future}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-gray-50 hover:text-gray-700 transition-colors font-medium text-gray-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'no_ptp_set', 'no_ptp_set')}
                    >
                      {branch.totals.no_ptp_set}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-purple-50 hover:text-purple-700 transition-colors font-semibold"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                    >
                      {branch.totals.total}
                    </TableCell>
                  </TableRow>
                  
                  {expandedBranches.has(branch.branch_name) && branch.rms.map((rm) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="bg-muted/25 hover:bg-muted/40">
                      <TableCell className="text-base pl-8">
                        {rm.rm_name}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors text-red-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'overdue', 'overdue')}
                      >
                        {rm.overdue}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors text-blue-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'today', 'today')}
                      >
                        {rm.today}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-orange-50 hover:text-orange-700 transition-colors text-orange-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'tomorrow', 'tomorrow')}
                      >
                        {rm.tomorrow}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors text-green-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'future', 'future')}
                      >
                        {rm.future}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-gray-50 hover:text-gray-700 transition-colors text-gray-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'no_ptp_set', 'no_ptp_set')}
                      >
                        {rm.no_ptp_set}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-purple-50 hover:text-purple-700 transition-colors font-medium"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                      >
                        {rm.total}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              
              {ptpBranchData.length > 0 && (
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={1} className="font-bold text-base">Total</TableCell>
                  <TableCell className="text-center font-bold text-base text-red-600">{totals.overdue}</TableCell>
                  <TableCell className="text-center font-bold text-base text-blue-600">{totals.today}</TableCell>
                  <TableCell className="text-center font-bold text-base text-orange-600">{totals.tomorrow}</TableCell>
                  <TableCell className="text-center font-bold text-base text-green-600">{totals.future}</TableCell>
                  <TableCell className="text-center font-bold text-base text-gray-600">{totals.no_ptp_set}</TableCell>
                  <TableCell className="text-center font-bold text-base">{totals.total}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {ptpBranchData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">No data available for PTP status analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPTPStatusTable;
