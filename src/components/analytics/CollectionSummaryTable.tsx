
import { Application } from '@/types/application';
import { AuditLog } from '@/hooks/useAuditLogs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { DrillDownFilter } from '@/pages/Analytics';
import { useTableSorting } from '@/hooks/useTableSorting';
import { useCollectionSummaryData } from '@/hooks/useCollectionSummaryData';
import SortableTableHeader from './shared/SortableTableHeader';
import ExpandableRow from './shared/ExpandableRow';
import ClickableTableCell from './shared/ClickableTableCell';

interface CollectionSummaryTableProps {
  applications: Application[];
  auditLogs: AuditLog[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'branch_name' | 'total';

const CollectionSummaryTable = ({ applications, auditLogs, onDrillDown }: CollectionSummaryTableProps) => {
  const { data: collectionData, uniqueDates } = useCollectionSummaryData(applications, auditLogs);
  const { sortField, sortDirection, handleSort, getSortedData } = useTableSorting<SortField>('total');
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

  const handleCellClick = (branchName: string, rmName: string | null, date: string) => {
    // For collection summary, we need to filter by date and status changes
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName || undefined,
      status_type: 'collection_summary',
      ptp_criteria: 'date_specific',
      ptp_date: date
    });
  };

  const getValue = (item: any, field: SortField) => {
    switch (field) {
      case 'branch_name': return item.branch_name;
      case 'total': return item.total_stats.total;
      default: return 0;
    }
  };

  const sortedData = getSortedData(collectionData, getValue);

  // Calculate totals for each date
  const dateTotals = uniqueDates.reduce((acc, date) => {
    acc[date] = collectionData.reduce((sum, branch) => 
      sum + (branch.total_stats.daily_counts[date] || 0), 0
    );
    return acc;
  }, {} as { [date: string]: number });

  const grandTotal = collectionData.reduce((sum, branch) => sum + branch.total_stats.total, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Collection Summary by Date</CardTitle>
            <CardDescription className="text-xs">
              Track status changes to collection-related statuses by date
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader 
                  label="Branch / RM" 
                  field="branch_name" 
                  onSort={handleSort}
                  className="w-48 sticky left-0 bg-background"
                />
                {uniqueDates.map(date => (
                  <TableHead key={date} className="text-center min-w-24">
                    {date}
                  </TableHead>
                ))}
                <SortableTableHeader 
                  label="Total" 
                  field="total" 
                  onSort={handleSort}
                  className="text-center w-20 sticky right-0 bg-background"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((branch) => (
                <>
                  <TableRow key={branch.branch_name} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-sm sticky left-0 bg-background">
                      <ExpandableRow
                        isExpanded={expandedBranches.has(branch.branch_name)}
                        onToggle={() => toggleBranch(branch.branch_name)}
                        label={branch.branch_name}
                      />
                    </TableCell>
                    {uniqueDates.map(date => (
                      <ClickableTableCell
                        key={date}
                        value={branch.total_stats.daily_counts[date] || 0}
                        onClick={() => handleCellClick(branch.branch_name, null, date)}
                      />
                    ))}
                    <ClickableTableCell
                      value={branch.total_stats.total}
                      onClick={() => handleCellClick(branch.branch_name, null, 'all')}
                      className="sticky right-0 bg-background"
                    />
                  </TableRow>
                  
                  {expandedBranches.has(branch.branch_name) && branch.rm_stats.map((rm) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="bg-muted/30">
                      <TableCell className="text-sm pl-8 sticky left-0 bg-muted/30">
                        {rm.rm_name}
                      </TableCell>
                      {uniqueDates.map(date => (
                        <ClickableTableCell
                          key={date}
                          value={rm.daily_counts[date] || 0}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, date)}
                        />
                      ))}
                      <ClickableTableCell
                        value={rm.total}
                        onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'all')}
                        className="sticky right-0 bg-muted/30"
                      />
                    </TableRow>
                  ))}
                </>
              ))}
              
              {collectionData.length > 0 && (
                <TableRow className="bg-muted/50 font-medium border-t-2">
                  <TableCell className="font-bold text-sm sticky left-0 bg-muted/50">
                    Total
                  </TableCell>
                  {uniqueDates.map(date => (
                    <ClickableTableCell
                      key={date}
                      value={dateTotals[date] || 0}
                      onClick={() => handleCellClick('', null, date)}
                      className="font-bold"
                    />
                  ))}
                  <ClickableTableCell
                    value={grandTotal}
                    onClick={() => handleCellClick('', null, 'all')}
                    className="font-bold sticky right-0 bg-muted/50"
                  />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {collectionData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No collection data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CollectionSummaryTable;
