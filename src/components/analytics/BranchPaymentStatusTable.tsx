import { Application } from '@/types/application';
import { useBranchPaymentDataFromAuditLogs } from '@/hooks/useBranchPaymentDataFromAuditLogs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { DrillDownFilter } from '@/pages/Analytics';
import { useTableSorting } from '@/hooks/useTableSorting';
import SortableTableHeader from './shared/SortableTableHeader';
import ClickableTableCell from './shared/ClickableTableCell';
import ExpandableRow from './shared/ExpandableRow';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { formatEmiMonth } from '@/utils/formatters';

interface BranchPaymentStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'branch_name' | 'rm_name' | 'total' | 'unpaid' | 'partially_paid' | 'paid_pending_approval' | 'paid' | 'others';

const BranchPaymentStatusTable = ({ applications, onDrillDown }: BranchPaymentStatusTableProps) => {
  const [selectedEmiMonth, setSelectedEmiMonth] = useState<string>('all');
  
  // Get unique EMI months from applications for the dropdown
  const emiMonths = Array.from(
    new Set(applications.map(app => formatEmiMonth(app.demand_date)).filter(month => month && month !== 'NA'))
  ).sort();

  // Use the new audit logs hook instead of filtering applications client-side
  const { data: branchPaymentStatusData, loading, error } = useBranchPaymentDataFromAuditLogs(selectedEmiMonth);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  
  const branchSorting = useTableSorting<SortField>('branch_name');
  const rmSorting = useTableSorting<SortField>('rm_name');

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

  const getBranchValue = (branch: any, field: SortField) => {
    switch (field) {
      case 'branch_name': return branch.branch_name;
      case 'total': return branch.total_stats.total;
      case 'unpaid': return branch.total_stats.unpaid;
      case 'partially_paid': return branch.total_stats.partially_paid;
      case 'paid_pending_approval': return branch.total_stats.paid_pending_approval;
      case 'paid': return branch.total_stats.paid;
      case 'others': return branch.total_stats.others;
      default: return 0;
    }
  };

  const getRmValue = (rm: any, field: SortField) => {
    switch (field) {
      case 'rm_name': return rm.rm_name;
      case 'total': return rm.total;
      case 'unpaid': return rm.unpaid;
      case 'partially_paid': return rm.partially_paid;
      case 'paid_pending_approval': return rm.paid_pending_approval;
      case 'paid': return rm.paid;
      case 'others': return rm.others;
      default: return 0;
    }
  };

  const sortedBranchData = branchSorting.getSortedData(branchPaymentStatusData, getBranchValue);
  const getSortedRms = (rms: any[]) => rmSorting.getSortedData(rms, getRmValue);

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
              Distribution of payment statuses across branches and RMs (from audit logs)
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
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading payment status data from audit logs...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            <p className="text-sm">Error loading data: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
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
                      className="text-center w-20"
                      currentSort={{ field: branchSorting.sortField, direction: branchSorting.sortDirection }}
                    />
                    <SortableTableHeader 
                      label="Unpaid" 
                      field="unpaid" 
                      onSort={branchSorting.handleSort}
                      className="text-center w-20"
                      currentSort={{ field: branchSorting.sortField, direction: branchSorting.sortDirection }}
                    />
                    <SortableTableHeader 
                      label="Partially Paid" 
                      field="partially_paid" 
                      onSort={branchSorting.handleSort}
                      className="text-center w-24"
                      currentSort={{ field: branchSorting.sortField, direction: branchSorting.sortDirection }}
                    />
                    <SortableTableHeader 
                      label="Paid (Pending)" 
                      field="paid_pending_approval" 
                      onSort={branchSorting.handleSort}
                      className="text-center w-28"
                      currentSort={{ field: branchSorting.sortField, direction: branchSorting.sortDirection }}
                    />
                    <SortableTableHeader 
                      label="Paid" 
                      field="paid" 
                      onSort={branchSorting.handleSort}
                      className="text-center w-16"
                      currentSort={{ field: branchSorting.sortField, direction: branchSorting.sortDirection }}
                    />
                    <SortableTableHeader 
                      label="Others" 
                      field="others" 
                      onSort={branchSorting.handleSort}
                      className="text-center w-20"
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
                          value={branch.total_stats.unpaid}
                          onClick={() => handleCellClick(branch.branch_name, undefined, 'unpaid')}
                          colorClass="text-red-600"
                        />
                        <ClickableTableCell
                          value={branch.total_stats.partially_paid}
                          onClick={() => handleCellClick(branch.branch_name, undefined, 'partially_paid')}
                          colorClass="text-yellow-600"
                        />
                        <ClickableTableCell
                          value={branch.total_stats.paid_pending_approval}
                          onClick={() => handleCellClick(branch.branch_name, undefined, 'paid_pending_approval')}
                          colorClass="text-orange-600"
                        />
                        <ClickableTableCell
                          value={branch.total_stats.paid}
                          onClick={() => handleCellClick(branch.branch_name, undefined, 'paid')}
                          colorClass="text-green-600"
                        />
                        <ClickableTableCell
                          value={branch.total_stats.others}
                          onClick={() => handleCellClick(branch.branch_name, undefined, 'others')}
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
                            value={rm.unpaid}
                            onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'unpaid')}
                            colorClass="text-red-600"
                          />
                          <ClickableTableCell
                            value={rm.partially_paid}
                            onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'partially_paid')}
                            colorClass="text-yellow-600"
                          />
                          <ClickableTableCell
                            value={rm.paid_pending_approval}
                            onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid_pending_approval')}
                            colorClass="text-orange-600"
                          />
                          <ClickableTableCell
                            value={rm.paid}
                            onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid')}
                            colorClass="text-green-600"
                          />
                          <ClickableTableCell
                            value={rm.others}
                            onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'others')}
                          />
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPaymentStatusTable;
