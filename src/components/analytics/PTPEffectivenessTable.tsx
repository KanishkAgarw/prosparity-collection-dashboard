
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
import { ChevronRight, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';
import { DrillDownFilter } from '@/pages/Analytics';

interface PTPEffectivenessTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'branch_name' | 'rm_name' | 'total_ptps' | 'honored_ptps' | 'broken_ptps' | 'effectiveness';
type SortDirection = 'asc' | 'desc';

const PTPEffectivenessTable = ({ applications, onDrillDown }: PTPEffectivenessTableProps) => {
  const { effectivenessBranchData } = useBranchAnalyticsData(applications);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('branch_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [rmSortField, setRmSortField] = useState<SortField>('rm_name');
  const [rmSortDirection, setRmSortDirection] = useState<SortDirection>('asc');

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
      setSortDirection('asc');
    }
  };

  const handleRmSort = (field: SortField) => {
    if (rmSortField === field) {
      setRmSortDirection(rmSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setRmSortField(field);
      setRmSortDirection('asc');
    }
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

  const sortedBranchData = [...effectivenessBranchData].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'branch_name':
        aValue = a.branch_name;
        bValue = b.branch_name;
        break;
      case 'total_ptps':
        aValue = a.totals.total_ptps;
        bValue = b.totals.total_ptps;
        break;
      case 'honored_ptps':
        aValue = a.totals.honored_ptps;
        bValue = b.totals.honored_ptps;
        break;
      case 'broken_ptps':
        aValue = a.totals.broken_ptps;
        bValue = b.totals.broken_ptps;
        break;
      case 'effectiveness':
        aValue = a.totals.total_ptps > 0 ? (a.totals.honored_ptps / a.totals.total_ptps) * 100 : 0;
        bValue = b.totals.total_ptps > 0 ? (b.totals.honored_ptps / b.totals.total_ptps) * 100 : 0;
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const getSortedRms = (rms: any[]) => {
    return [...rms].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (rmSortField) {
        case 'branch_name':
        case 'rm_name':
          aValue = a.rm_name;
          bValue = b.rm_name;
          break;
        case 'total_ptps':
          aValue = a.total_ptps;
          bValue = b.total_ptps;
          break;
        case 'honored_ptps':
          aValue = a.honored_ptps;
          bValue = b.honored_ptps;
          break;
        case 'broken_ptps':
          aValue = a.broken_ptps;
          bValue = b.broken_ptps;
          break;
        case 'effectiveness':
          aValue = a.total_ptps > 0 ? (a.honored_ptps / a.total_ptps) * 100 : 0;
          bValue = b.total_ptps > 0 ? (b.honored_ptps / b.total_ptps) * 100 : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return rmSortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return rmSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
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
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">PTP Effectiveness by Branch</CardTitle>
            <CardDescription className="text-xs">
              Analysis of PTP promise keeping behavior across branches and RMs
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium text-xs w-40">
                  <button
                    onClick={() => handleSort('branch_name')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    Branch/RM
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-xs text-center w-24">
                  <button
                    onClick={() => handleSort('total_ptps')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Total PTPs
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-xs text-center w-24">
                  <button
                    onClick={() => handleSort('honored_ptps')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Paid on PTP
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-xs text-center w-24">
                  <button
                    onClick={() => handleSort('broken_ptps')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Paid after PTP
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-xs text-center w-32">
                  <button
                    onClick={() => handleSort('effectiveness')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Unpaid and Others
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBranchData.map((branch) => (
                <>
                  <TableRow key={branch.branch_name} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-xs">
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
                      className="text-center text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                    >
                      {branch.totals.total_ptps}
                    </TableCell>
                    <TableCell 
                      className="text-center text-xs cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors font-medium text-green-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'paid')}
                    >
                      {branch.totals.honored_ptps}
                    </TableCell>
                    <TableCell 
                      className="text-center text-xs cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-red-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'overdue')}
                    >
                      {branch.totals.broken_ptps}
                    </TableCell>
                    <TableCell className="text-center text-xs font-medium">
                      {branch.totals.total_ptps - branch.totals.honored_ptps - branch.totals.broken_ptps}
                    </TableCell>
                  </TableRow>
                  
                  {expandedBranches.has(branch.branch_name) && getSortedRms(branch.rms).map((rm) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="bg-muted/25 hover:bg-muted/40">
                      <TableCell className="text-xs pl-8">
                        {rm.rm_name}
                      </TableCell>
                      <TableCell 
                        className="text-center text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                      >
                        {rm.total_ptps}
                      </TableCell>
                      <TableCell 
                        className="text-center text-xs cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors text-green-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid')}
                      >
                        {rm.honored_ptps}
                      </TableCell>
                      <TableCell 
                        className="text-center text-xs cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors text-red-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'overdue')}
                      >
                        {rm.broken_ptps}
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium">
                        {rm.total_ptps - rm.honored_ptps - rm.broken_ptps}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              
              {effectivenessBranchData.length > 0 && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={1} className="font-bold text-xs">Total</TableCell>
                  <TableCell className="text-center font-bold text-xs">{totals.total_ptps}</TableCell>
                  <TableCell className="text-center font-bold text-xs text-green-600">{totals.honored_ptps}</TableCell>
                  <TableCell className="text-center font-bold text-xs text-red-600">{totals.broken_ptps}</TableCell>
                  <TableCell className="text-center font-bold text-xs">
                    {totals.total_ptps - totals.honored_ptps - totals.broken_ptps}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {effectivenessBranchData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-xs">No data available for PTP effectiveness analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PTPEffectivenessTable;
