
import { useMemo, useState } from 'react';
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
import { format, parseISO, isValid } from 'date-fns';

interface PTPEffectivenessTableProps {
  applications: Application[];
}

interface PTPEffectivenessData {
  date: string;
  ptpSetCount: number;
  paidCount: number;
  conversionRate: number;
  pendingCount: number;
}

type SortField = 'date' | 'ptpSetCount' | 'paidCount' | 'conversionRate' | 'pendingCount';
type SortDirection = 'asc' | 'desc';

const PTPEffectivenessTable = ({ applications }: PTPEffectivenessTableProps) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const ptpEffectivenessData = useMemo(() => {
    const dateMap = new Map<string, PTPEffectivenessData>();

    // Get applications with PTP dates
    const applicationsWithPTP = applications.filter(app => app.ptp_date);

    applicationsWithPTP.forEach(app => {
      if (!app.ptp_date) return;

      try {
        const ptpDate = parseISO(app.ptp_date);
        if (!isValid(ptpDate)) return;

        const dateKey = format(ptpDate, 'yyyy-MM-dd');
        
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            date: dateKey,
            ptpSetCount: 0,
            paidCount: 0,
            conversionRate: 0,
            pendingCount: 0
          });
        }

        const data = dateMap.get(dateKey)!;
        data.ptpSetCount++;

        // Check if this application was paid on or after the PTP date
        if (app.field_status === 'Paid' || app.field_status === 'Paid (Pending Approval)') {
          data.paidCount++;
        } else if (app.field_status === 'Unpaid' || app.field_status === 'Partially Paid') {
          data.pendingCount++;
        }
      } catch (error) {
        console.error('Error parsing PTP date:', app.ptp_date, error);
      }
    });

    // Calculate conversion rates
    const result = Array.from(dateMap.values()).map(data => ({
      ...data,
      conversionRate: data.ptpSetCount > 0 ? (data.paidCount / data.ptpSetCount) * 100 : 0
    }));

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [applications]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...ptpEffectivenessData].sort((a, b) => {
    let aValue: number | string = a[sortField];
    let bValue: number | string = b[sortField];

    if (sortField === 'date') {
      aValue = new Date(a.date).getTime();
      bValue = new Date(b.date).getTime();
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const SortableHeader = ({ 
    field, 
    children, 
    className = "" 
  }: { 
    field: SortField; 
    children: React.ReactNode; 
    className?: string; 
  }) => (
    <TableHead className={`cursor-pointer hover:bg-gray-50 ${className}`} onClick={() => handleSort(field)}>
      <div className="flex items-center justify-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd-MMM-yy');
    } catch {
      return dateStr;
    }
  };

  const totals = sortedData.reduce(
    (acc, row) => ({
      ptpSetCount: acc.ptpSetCount + row.ptpSetCount,
      paidCount: acc.paidCount + row.paidCount,
      pendingCount: acc.pendingCount + row.pendingCount,
    }),
    { ptpSetCount: 0, paidCount: 0, pendingCount: 0 }
  );

  const overallConversionRate = totals.ptpSetCount > 0 ? (totals.paidCount / totals.ptpSetCount) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">PTP Effectiveness Analysis</CardTitle>
        <CardDescription className="text-sm">
          Track how many applications with PTP dates actually got paid
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <SortableHeader field="date" className="w-24">PTP Date</SortableHeader>
                <SortableHeader field="ptpSetCount" className="w-20 text-center">PTP Set</SortableHeader>
                <SortableHeader field="paidCount" className="w-20 text-center">Paid</SortableHeader>
                <SortableHeader field="conversionRate" className="w-24 text-center">Conv. Rate</SortableHeader>
                <SortableHeader field="pendingCount" className="w-20 text-center">Pending</SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row) => (
                <TableRow key={row.date} className="text-sm">
                  <TableCell className="py-2 text-xs font-medium">
                    {formatDate(row.date)}
                  </TableCell>
                  <TableCell className="text-center py-2 text-xs">
                    {row.ptpSetCount}
                  </TableCell>
                  <TableCell className="text-center py-2 text-xs text-green-600 font-medium">
                    {row.paidCount}
                  </TableCell>
                  <TableCell className="text-center py-2 text-xs font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      row.conversionRate >= 80 ? 'bg-green-100 text-green-800' :
                      row.conversionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {row.conversionRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-2 text-xs text-orange-600">
                    {row.pendingCount}
                  </TableCell>
                </TableRow>
              ))}

              {/* Total Row */}
              {sortedData.length > 0 && (
                <TableRow className="bg-muted font-bold border-t-2 text-sm">
                  <TableCell className="font-bold py-2 text-xs">Total</TableCell>
                  <TableCell className="text-center font-bold text-xs">{totals.ptpSetCount}</TableCell>
                  <TableCell className="text-center font-bold text-xs text-green-600">{totals.paidCount}</TableCell>
                  <TableCell className="text-center font-bold text-xs">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      overallConversionRate >= 80 ? 'bg-green-100 text-green-800' :
                      overallConversionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {overallConversionRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-bold text-xs text-orange-600">{totals.pendingCount}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {sortedData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No PTP data available for effectiveness analysis
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PTPEffectivenessTable;
