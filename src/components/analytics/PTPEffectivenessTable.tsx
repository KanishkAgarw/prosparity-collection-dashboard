
import { Application } from '@/types/application';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { DrillDownFilter } from '@/pages/Analytics';
import { format, parseISO } from 'date-fns';

interface PTPEffectivenessTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'ptp_date' | 'total_ptps' | 'honored_ptps' | 'broken_ptps' | 'unpaid_others';
type SortDirection = 'asc' | 'desc';

const PTPEffectivenessTable = ({ applications, onDrillDown }: PTPEffectivenessTableProps) => {
  const [sortField, setSortField] = useState<SortField>('ptp_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const ptpDateData = useMemo(() => {
    const dateMap = new Map<string, {
      ptp_date: string;
      total_ptps: number;
      honored_ptps: number;
      broken_ptps: number;
      unpaid_others: number;
    }>();

    applications.forEach(app => {
      // Only count applications with PTPs
      if (!app.ptp_date) return;

      const ptpDateStr = app.ptp_date;
      let displayDate: string;
      
      try {
        const ptpDate = new Date(ptpDateStr);
        displayDate = format(ptpDate, 'yyyy-MM-dd');
      } catch {
        displayDate = ptpDateStr;
      }

      if (!dateMap.has(displayDate)) {
        dateMap.set(displayDate, {
          ptp_date: displayDate,
          total_ptps: 0,
          honored_ptps: 0,
          broken_ptps: 0,
          unpaid_others: 0
        });
      }

      const dateEntry = dateMap.get(displayDate)!;
      dateEntry.total_ptps++;

      // Determine status based on field_status and PTP date
      const isPaid = app.field_status === 'Paid';
      const isOverdue = app.ptp_date && new Date(app.ptp_date) < new Date() && !isPaid;

      if (isPaid) {
        dateEntry.honored_ptps++;
      } else if (isOverdue) {
        dateEntry.broken_ptps++;
      } else {
        dateEntry.unpaid_others++;
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => b.ptp_date.localeCompare(a.ptp_date));
  }, [applications]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCellClick = (ptpDate: string, statusType: string) => {
    // For PTP date-based drilling, we need to filter by the specific date
    onDrillDown({
      branch_name: '',
      status_type: statusType,
      ptp_criteria: 'date_specific',
      ptp_date: ptpDate
    });
  };

  const sortedData = [...ptpDateData].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'ptp_date':
        aValue = a.ptp_date;
        bValue = b.ptp_date;
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
      case 'unpaid_others':
        aValue = a.unpaid_others;
        bValue = b.unpaid_others;
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const totals = ptpDateData.reduce(
    (acc, dateEntry) => ({
      total_ptps: acc.total_ptps + dateEntry.total_ptps,
      honored_ptps: acc.honored_ptps + dateEntry.honored_ptps,
      broken_ptps: acc.broken_ptps + dateEntry.broken_ptps,
      unpaid_others: acc.unpaid_others + dateEntry.unpaid_others,
    }),
    { total_ptps: 0, honored_ptps: 0, broken_ptps: 0, unpaid_others: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">PTP Effectiveness by Date</CardTitle>
            <CardDescription className="text-xs">
              Analysis of PTP promise keeping behavior by PTP date
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium text-sm w-32">
                  <button
                    onClick={() => handleSort('ptp_date')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    PTP Date
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('total_ptps')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Total PTPs
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('honored_ptps')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Paid on PTP
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-24">
                  <button
                    onClick={() => handleSort('broken_ptps')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Paid after PTP
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-medium text-sm text-center w-32">
                  <button
                    onClick={() => handleSort('unpaid_others')}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
                  >
                    Unpaid and Others
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((dateEntry) => (
                <TableRow key={dateEntry.ptp_date} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-sm">
                    {dateEntry.ptp_date}
                  </TableCell>
                  <TableCell 
                    className="text-center text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                    onClick={() => handleCellClick(dateEntry.ptp_date, 'total')}
                  >
                    {dateEntry.total_ptps}
                  </TableCell>
                  <TableCell 
                    className="text-center text-sm cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors font-medium text-green-600"
                    onClick={() => handleCellClick(dateEntry.ptp_date, 'paid')}
                  >
                    {dateEntry.honored_ptps}
                  </TableCell>
                  <TableCell 
                    className="text-center text-sm cursor-pointer hover:bg-red-50 hover:text-red-700 transition-colors font-medium text-red-600"
                    onClick={() => handleCellClick(dateEntry.ptp_date, 'overdue')}
                  >
                    {dateEntry.broken_ptps}
                  </TableCell>
                  <TableCell className="text-center text-sm font-medium">
                    {dateEntry.unpaid_others}
                  </TableCell>
                </TableRow>
              ))}
              
              {ptpDateData.length > 0 && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={1} className="font-bold text-sm">Total</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.total_ptps}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-green-600">{totals.honored_ptps}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-red-600">{totals.broken_ptps}</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.unpaid_others}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {ptpDateData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No data available for PTP effectiveness analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PTPEffectivenessTable;
