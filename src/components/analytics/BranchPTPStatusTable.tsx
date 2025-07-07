
import { Application } from '@/types/application';
import { useBranchPTPData, BranchPTPStatus } from '@/hooks/useBranchAnalyticsData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { DrillDownFilter } from '@/pages/Analytics';
import { useTableSorting } from '@/hooks/useTableSorting';
import SortableTableHeader from './shared/SortableTableHeader';
import ClickableTableCell from './shared/ClickableTableCell';
import ExpandableRow from './shared/ExpandableRow';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { formatEmiMonth } from '@/utils/formatters';

interface BranchPTPStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'branch_name' | 'rm_name' | 'total' | 'overdue' | 'today' | 'tomorrow' | 'future' | 'no_ptp_set';

const BranchPTPStatusTable = ({ applications, onDrillDown }: BranchPTPStatusTableProps) => {
  const [selectedEmiMonth, setSelectedEmiMonth] = useState<string>('all');
  const [branchPtpStatusData, setBranchPtpStatusData] = useState<BranchPTPStatus[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get unique EMI months from applications
  const emiMonths = Array.from(
    new Set(applications.map(app => formatEmiMonth(app.demand_date)).filter(month => month && month !== 'NA'))
  ).sort();

  // Filter applications by selected EMI month
  const filteredApplications = selectedEmiMonth && selectedEmiMonth !== 'all'
    ? applications.filter(app => formatEmiMonth(app.demand_date) === selectedEmiMonth)
    : applications;

  const branchPtpDataPromise = useBranchPTPData(applications, selectedEmiMonth === 'all' ? undefined : selectedEmiMonth);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  
  const branchSorting = useTableSorting<SortField>('branch_name');
  const rmSorting = useTableSorting<SortField>('rm_name');

  // Handle async data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await branchPtpDataPromise;
        setBranchPtpStatusData(data);
      } catch (error) {
        console.error('Error loading PTP data:', error);
        setBranchPtpStatusData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [branchPtpDataPromise]);

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
      status_type: statusType,
      ptp_criteria: statusType
    });
  };

  const getBranchValue = (branch: any, field: SortField) => {
    switch (field) {
      case 'branch_name': return branch.branch_name;
      case 'total': return branch.total_stats.total;
      case 'overdue': return branch.total_stats.overdue;
      case 'today': return branch.total_stats.today;
      case 'tomorrow': return branch.total_stats.tomorrow;
      case 'future': return branch.total_stats.future;
      case 'no_ptp_set': return branch.total_stats.no_ptp_set;
      default: return 0;
    }
  };

  const getRmValue = (rm: any, field: SortField) => {
    switch (field) {
      case 'rm_name': return rm.rm_name;
      case 'total': return rm.total;
      case 'overdue': return rm.overdue;
      case 'today': return rm.today;
      case 'tomorrow': return rm.tomorrow;
      case 'future': return rm.future;
      case 'no_ptp_set': return rm.no_ptp_set;
      default: return 0;
    }
  };

  const sortedBranchData = branchSorting.getSortedData(branchPtpStatusData, getBranchValue);
  const getSortedRms = (rms: any[]) => rmSorting.getSortedData(rms, getRmValue);

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">PTP Status by Branch</CardTitle>
              <CardDescription className="text-xs">
                Promise to Pay scheduling status across branches and RMs
              </CardDescription>
            </div>
            <div className="w-48">
              <label className="block text-xs font-medium text-gray-700 mb-1">EMI Month</label>
              <Select value={selectedEmiMonth} onValueChange={setSelectedEmiMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {emiMonths.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm">Loading PTP data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">PTP Status by Branch</CardTitle>
            <CardDescription className="text-xs">
              Promise to Pay scheduling status across branches and RMs
            </CardDescription>
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-gray-700 mb-1">EMI Month</label>
            <Select value={selectedEmiMonth} onValueChange={setSelectedEmiMonth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {emiMonths.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader 
                  label="Branch/RM" 
                  field="branch_name" 
                  onSort={branchSorting.handleSort}
                  className="w-48"
                  currentSort={{ field: branchSorting.sortField, direction: branchSorting.sortDirection }}
                />
                <SortableTableHeader 
                  label="Total" 
                  field="total" 
                  onSort={branchSorting.handleSort}
                  className="text-center w-24"
                  currentSort={{ field: branchSorting.sortField, direction: branchSorting.sortDirection }}
                />
                <SortableTableHeader 
                  label="Overdue" 
                  field="overdue" 
                  onSort={branchSorting.handleSort}
                  className="text-center w-24"
                  currentSort={{ field: branchSorting.sortField, direction: branchSorting.sortDirection }}
                />
                <SortableTableHeader 
                  label="Today" 
                  field="today" 
                  onSort={branchSorting.handleSort}
                  className="text-center w-24"
                  currentSort={{ field: branchSorting.sortField, direction: branchSorting.sortDirection }}
                />
                <SortableTableHeader 
                  label="Tomorrow" 
                  field="tomorrow" 
                  onSort={branchSorting.handleSort}
                  className="text-center w-24"
                  currentSort={{ field: branchSorting.sortField, direction: branchSorting.sortDirection }}
                />
                <SortableTableHeader 
                  label="Future" 
                  field="future" 
                  onSort={branchSorting.handleSort}
                  className="text-center w-24"
                  currentSort={{ field: branchSorting.sortField, direction: branchSorting.sortDirection }}
                />
                <SortableTableHeader 
                  label="No PTP" 
                  field="no_ptp_set" 
                  onSort={branchSorting.handleSort}
                  className="text-center w-24"
                  currentSort={{ field: branchSorting.sortField, direction: branchSorting.sortDirection }}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBranchData.map((branch) => (
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
                      value={branch.total_stats.total}
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                    />
                    <ClickableTableCell
                      value={branch.total_stats.overdue}
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'overdue')}
                      colorClass="text-red-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.today}
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'today')}
                      colorClass="text-orange-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.tomorrow}
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'tomorrow')}
                      colorClass="text-yellow-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.future}
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'future')}
                      colorClass="text-green-600"
                    />
                    <ClickableTableCell
                      value={branch.total_stats.no_ptp_set}
                      onClick={() => handleCellClick(branch.branch_name, undefined, 'no_ptp_set')}
                    />
                  </TableRow>
                  
                  {expandedBranches.has(branch.branch_name) && getSortedRms(branch.rm_stats).map((rm) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="bg-muted/25 hover:bg-muted/40">
                      <TableCell className="text-sm pl-8">{rm.rm_name}</TableCell>
                      <ClickableTableCell
                        value={rm.total}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                      />
                      <ClickableTableCell
                        value={rm.overdue}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'overdue')}
                        colorClass="text-red-600"
                      />
                      <ClickableTableCell
                        value={rm.today}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'today')}
                        colorClass="text-orange-600"
                      />
                      <ClickableTableCell
                        value={rm.tomorrow}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'tomorrow')}
                        colorClass="text-yellow-600"
                      />
                      <ClickableTableCell
                        value={rm.future}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'future')}
                        colorClass="text-green-600"
                      />
                      <ClickableTableCell
                        value={rm.no_ptp_set}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'no_ptp_set')}
                      />
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
