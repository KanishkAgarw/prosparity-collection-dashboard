
import { Application } from '@/types/application';
import { useBranchAnalyticsData } from '@/hooks/useBranchAnalyticsData';
import { useExport } from '@/hooks/useExport';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronDown, ArrowUpDown, Download } from 'lucide-react';
import { useState } from 'react';
import { DrillDownFilter } from '@/pages/Analytics';
import { Button } from '@/components/ui/button';

interface BranchPTPStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'branch_name' | 'total' | 'overdue' | 'today' | 'tomorrow' | 'future' | 'no_ptp_set';
type SortDirection = 'asc' | 'desc';

const BranchPTPStatusTable = ({ applications, onDrillDown }: BranchPTPStatusTableProps) => {
  const { branchPtpStatusData } = useBranchAnalyticsData(applications);
  const { exportToExcel } = useExport();
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('branch_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [rmSortField, setRmSortField] = useState<SortField>('branch_name');
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
      status_type: statusType,
      ptp_criteria: statusType
    });
  };

  const sortedBranchData = [...branchPtpStatusData].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'branch_name':
        aValue = a.branch_name;
        bValue = b.branch_name;
        break;
      case 'total':
        aValue = a.total_stats.total;
        bValue = b.total_stats.total;
        break;
      case 'overdue':
        aValue = a.total_stats.overdue;
        bValue = b.total_stats.overdue;
        break;
      case 'today':
        aValue = a.total_stats.today;
        bValue = b.total_stats.today;
        break;
      case 'tomorrow':
        aValue = a.total_stats.tomorrow;
        bValue = b.total_stats.tomorrow;
        break;
      case 'future':
        aValue = a.total_stats.future;
        bValue = b.total_stats.future;
        break;
      case 'no_ptp_set':
        aValue = a.total_stats.no_ptp_set;
        bValue = b.total_stats.no_ptp_set;
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
          aValue = a.rm_name;
          bValue = b.rm_name;
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'overdue':
          aValue = a.overdue;
          bValue = b.overdue;
          break;
        case 'today':
          aValue = a.today;
          bValue = b.today;
          break;
        case 'tomorrow':
          aValue = a.tomorrow;
          bValue = b.tomorrow;
          break;
        case 'future':
          aValue = a.future;
          bValue = b.future;
          break;
        case 'no_ptp_set':
          aValue = a.no_ptp_set;
          bValue = b.no_ptp_set;
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

  const handleExport = () => {
    exportToExcel({ applications }, 'ptp-status-report');
  };

  const totals = branchPtpStatusData.reduce(
    (acc, branch) => ({
      total: acc.total + branch.total_stats.total,
      overdue: acc.overdue + branch.total_stats.overdue,
      today: acc.today + branch.total_stats.today,
      tomorrow: acc.tomorrow + branch.total_stats.tomorrow,
      future: acc.future + branch.total_stats.future,
      no_ptp_set: acc.no_ptp_set + branch.total_stats.no_ptp_set,
    }),
    { total: 0, overdue: 0, today: 0, tomorrow: 0, future: 0, no_ptp_set: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">PTP Status by Branch</CardTitle>
            <CardDescription className="text-sm">
              Promise to Pay (PTP) status distribution across branches and RMs
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium text-sm w-48">
                  <button
                    onClick={() => handleSort('branch_name')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    Branch/RM
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('total')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Total
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('overdue')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Overdue
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('today')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Today
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('tomorrow')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Tomorrow
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('future')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Future
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('no_ptp_set')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    No PTP
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBranchData.map((branch) => (
                <>
                  <TableRow key={branch.branch_name} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-sm">
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
                      className="text-center text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                    >
                      {branch.total_stats.total}
                    </TableCell>
                    <TableCell 
                      className="text-center text-sm cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-red-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'overdue')}
                    >
                      {branch.total_stats.overdue}
                    </TableCell>
                    <TableCell 
                      className="text-center text-sm cursor-pointer hover:bg-orange-50 hover:text-orange-700 transition-colors font-medium text-orange-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'today')}
                    >
                      {branch.total_stats.today}
                    </TableCell>
                    <TableCell 
                      className="text-center text-sm cursor-pointer hover:bg-yellow-50 hover:text-yellow-700 transition-colors font-medium text-yellow-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'tomorrow')}
                    >
                      {branch.total_stats.tomorrow}
                    </TableCell>
                    <TableCell 
                      className="text-center text-sm cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors font-medium text-green-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'future')}
                    >
                      {branch.total_stats.future}
                    </TableCell>
                    <TableCell 
                      className="text-center text-sm cursor-pointer hover:bg-gray-50 hover:text-gray-700 transition-colors font-medium"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'no_ptp_set')}
                    >
                      {branch.total_stats.no_ptp_set}
                    </TableCell>
                  </TableRow>
                  
                  {expandedBranches.has(branch.branch_name) && getSortedRms(branch.rm_stats).map((rm) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="bg-muted/25 hover:bg-muted/40">
                      <TableCell className="text-sm pl-8">
                        {rm.rm_name}
                      </TableCell>
                      <TableCell 
                        className="text-center text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                      >
                        {rm.total}
                      </TableCell>
                      <TableCell 
                        className="text-center text-sm cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors text-red-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'overdue')}
                      >
                        {rm.overdue}
                      </TableCell>
                      <TableCell 
                        className="text-center text-sm cursor-pointer hover:bg-orange-50 hover:text-orange-700 transition-colors text-orange-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'today')}
                      >
                        {rm.today}
                      </TableCell>
                      <TableCell 
                        className="text-center text-sm cursor-pointer hover:bg-yellow-50 hover:text-yellow-700 transition-colors text-yellow-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'tomorrow')}
                      >
                        {rm.tomorrow}
                      </TableCell>
                      <TableCell 
                        className="text-center text-sm cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors text-green-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'future')}
                      >
                        {rm.future}
                      </TableCell>
                      <TableCell 
                        className="text-center text-sm cursor-pointer hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'no_ptp_set')}
                      >
                        {rm.no_ptp_set}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              
              {branchPtpStatusData.length > 0 && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={1} className="font-bold text-sm">Total</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.total}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-red-600">{totals.overdue}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-orange-600">{totals.today}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-yellow-600">{totals.tomorrow}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-green-600">{totals.future}</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.no_ptp_set}</TableCell>
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
