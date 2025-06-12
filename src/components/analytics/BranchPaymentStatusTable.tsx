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

interface BranchPaymentStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'branch_name' | 'total' | 'unpaid' | 'partially_paid' | 'paid_pending_approval' | 'paid' | 'others';
type SortDirection = 'asc' | 'desc';

const BranchPaymentStatusTable = ({ applications, onDrillDown }: BranchPaymentStatusTableProps) => {
  const { branchPaymentStatusData } = useBranchAnalyticsData(applications);
  const { exportToExcel } = useExport();
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

  const sortedBranchData = [...branchPaymentStatusData].sort((a, b) => {
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
      case 'unpaid':
        aValue = a.total_stats.unpaid;
        bValue = b.total_stats.unpaid;
        break;
      case 'partially_paid':
        aValue = a.total_stats.partially_paid;
        bValue = b.total_stats.partially_paid;
        break;
      case 'paid_pending_approval':
        aValue = a.total_stats.paid_pending_approval;
        bValue = b.total_stats.paid_pending_approval;
        break;
      case 'paid':
        aValue = a.total_stats.paid;
        bValue = b.total_stats.paid;
        break;
      case 'others':
        aValue = a.total_stats.others;
        bValue = b.total_stats.others;
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
        case 'unpaid':
          aValue = a.unpaid;
          bValue = b.unpaid;
          break;
        case 'partially_paid':
          aValue = a.partially_paid;
          bValue = b.partially_paid;
          break;
        case 'paid_pending_approval':
          aValue = a.paid_pending_approval;
          bValue = b.paid_pending_approval;
          break;
        case 'paid':
          aValue = a.paid;
          bValue = b.paid;
          break;
        case 'others':
          aValue = a.others;
          bValue = b.others;
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
    exportToExcel({ applications }, 'payment-status-report');
  };

  const totals = branchPaymentStatusData.reduce(
    (acc, branch) => ({
      total: acc.total + branch.total_stats.total,
      unpaid: acc.unpaid + branch.total_stats.unpaid,
      partially_paid: acc.partially_paid + branch.total_stats.partially_paid,
      paid_pending_approval: acc.paid_pending_approval + branch.total_stats.paid_pending_approval,
      paid: acc.paid + branch.total_stats.paid,
      others: acc.others + branch.total_stats.others,
    }),
    { total: 0, unpaid: 0, partially_paid: 0, paid_pending_approval: 0, paid: 0, others: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Payment Status by Branch</CardTitle>
            <CardDescription className="text-xs">
              Breakdown of payment statuses across branches and relationship managers
            </CardDescription>
          </div>
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
                    onClick={() => handleSort('unpaid')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Unpaid
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('partially_paid')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Partial
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('paid_pending_approval')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Pending
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('paid')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Paid
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('others')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Others
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
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'unpaid')}
                    >
                      {branch.total_stats.unpaid}
                    </TableCell>
                    <TableCell 
                      className="text-center text-sm cursor-pointer hover:bg-yellow-50 hover:text-yellow-700 transition-colors font-medium text-yellow-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'partially_paid')}
                    >
                      {branch.total_stats.partially_paid}
                    </TableCell>
                    <TableCell 
                      className="text-center text-sm cursor-pointer hover:bg-orange-50 hover:text-orange-700 transition-colors font-medium text-orange-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'paid_pending_approval')}
                    >
                      {branch.total_stats.paid_pending_approval}
                    </TableCell>
                    <TableCell 
                      className="text-center text-sm cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors font-medium text-green-600"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'paid')}
                    >
                      {branch.total_stats.paid}
                    </TableCell>
                    <TableCell 
                      className="text-center text-sm cursor-pointer hover:bg-gray-50 hover:text-gray-700 transition-colors font-medium"
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'others')}
                    >
                      {branch.total_stats.others}
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
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'unpaid')}
                      >
                        {rm.unpaid}
                      </TableCell>
                      <TableCell 
                        className="text-center text-sm cursor-pointer hover:bg-yellow-50 hover:text-yellow-700 transition-colors text-yellow-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'partially_paid')}
                      >
                        {rm.partially_paid}
                      </TableCell>
                      <TableCell 
                        className="text-center text-sm cursor-pointer hover:bg-orange-50 hover:text-orange-700 transition-colors text-orange-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid_pending_approval')}
                      >
                        {rm.paid_pending_approval}
                      </TableCell>
                      <TableCell 
                        className="text-center text-sm cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors text-green-600"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid')}
                      >
                        {rm.paid}
                      </TableCell>
                      <TableCell 
                        className="text-center text-sm cursor-pointer hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'others')}
                      >
                        {rm.others}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              
              {branchPaymentStatusData.length > 0 && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={1} className="font-bold text-sm">Total</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.total}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-red-600">{totals.unpaid}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-yellow-600">{totals.partially_paid}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-orange-600">{totals.paid_pending_approval}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-green-600">{totals.paid}</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.others}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {branchPaymentStatusData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No data available for payment status analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPaymentStatusTable;
