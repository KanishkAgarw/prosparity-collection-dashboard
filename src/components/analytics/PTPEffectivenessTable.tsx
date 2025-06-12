
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

interface PTPEffectivenessTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

const PTPEffectivenessTable = ({ applications, onDrillDown }: PTPEffectivenessTableProps) => {
  const { effectivenessBranchData } = useBranchAnalyticsData(applications);
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

  const handleCellClick = (branchName: string, rmName: string | undefined, statusType: string) => {
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName,
      status_type: statusType
    });
  };

  const calculatePercentage = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%';
    return `${Math.round((numerator / denominator) * 100)}%`;
  };

  const totals = effectivenessBranchData.reduce(
    (acc, branch) => ({
      total_ptps: acc.total_ptps + branch.totals.total_ptps,
      honored_ptps: acc.honored_ptps + branch.totals.honored_ptps,
      broken_ptps: acc.broken_ptps + branch.totals.broken_ptps,
    }),
    { total_ptps: 0, honored_ptps: 0, broken_ptps: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">PTP Effectiveness by Branch</CardTitle>
        <CardDescription className="text-lg">
          Analysis of PTP promise keeping behavior across branches and RMs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-lg w-48">Branch/RM</TableHead>
                <TableHead className="font-semibold text-lg text-center w-32">Total PTPs</TableHead>
                <TableHead className="font-semibold text-lg text-center w-32">Honored</TableHead>
                <TableHead className="font-semibold text-lg text-center w-32">Broken</TableHead>
                <TableHead className="font-semibold text-lg text-center w-32">Effectiveness</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {effectivenessBranchData.map((branch) => (
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
                      className="text-center text-base cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                    >
                      {branch.totals.total_ptps}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors font-medium text-green-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'paid')}
                    >
                      {branch.totals.honored_ptps}
                    </TableCell>
                    <TableCell 
                      className="text-center text-base cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-red-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'overdue')}
                    >
                      {branch.totals.broken_ptps}
                    </TableCell>
                    <TableCell className="text-center text-base font-semibold">
                      {calculatePercentage(branch.totals.honored_ptps, branch.totals.total_ptps)}
                    </TableCell>
                  </TableRow>
                  
                  {expandedBranches.has(branch.branch_name) && branch.rms.map((rm) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="bg-muted/25 hover:bg-muted/40">
                      <TableCell className="text-base pl-8">
                        {rm.rm_name}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                      >
                        {rm.total_ptps}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors text-green-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid')}
                      >
                        {rm.honored_ptps}
                      </TableCell>
                      <TableCell 
                        className="text-center text-base cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors text-red-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'overdue')}
                      >
                        {rm.broken_ptps}
                      </TableCell>
                      <TableCell className="text-center text-base font-medium">
                        {calculatePercentage(rm.honored_ptps, rm.total_ptps)}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              
              {effectivenessBranchData.length > 0 && (
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={1} className="font-bold text-base">Total</TableCell>
                  <TableCell className="text-center font-bold text-base">{totals.total_ptps}</TableCell>
                  <TableCell className="text-center font-bold text-base text-green-600">{totals.honored_ptps}</TableCell>
                  <TableCell className="text-center font-bold text-base text-red-600">{totals.broken_ptps}</TableCell>
                  <TableCell className="text-center font-bold text-base">
                    {calculatePercentage(totals.honored_ptps, totals.total_ptps)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {effectivenessBranchData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">No data available for PTP effectiveness analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PTPEffectivenessTable;
