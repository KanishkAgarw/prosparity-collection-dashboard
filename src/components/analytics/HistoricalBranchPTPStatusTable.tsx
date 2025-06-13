
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HistoricalSnapshot } from '@/hooks/useHistoricalAnalytics';

interface HistoricalBranchPTPStatusTableProps {
  snapshots: HistoricalSnapshot[];
  selectedDate: string;
}

const HistoricalBranchPTPStatusTable = ({ 
  snapshots, 
  selectedDate 
}: HistoricalBranchPTPStatusTableProps) => {
  // Group snapshots by branch
  const branchData = snapshots.reduce((acc, snapshot) => {
    const branchName = snapshot.branch_name;
    if (!acc[branchName]) {
      acc[branchName] = {
        branch_name: branchName,
        ptp_total: 0,
        ptp_overdue: 0,
        ptp_today: 0,
        ptp_tomorrow: 0,
        ptp_future: 0,
        ptp_no_ptp_set: 0,
        rm_stats: []
      };
    }

    acc[branchName].ptp_total += snapshot.ptp_total;
    acc[branchName].ptp_overdue += snapshot.ptp_overdue;
    acc[branchName].ptp_today += snapshot.ptp_today;
    acc[branchName].ptp_tomorrow += snapshot.ptp_tomorrow;
    acc[branchName].ptp_future += snapshot.ptp_future;
    acc[branchName].ptp_no_ptp_set += snapshot.ptp_no_ptp_set;

    if (snapshot.rm_name) {
      acc[branchName].rm_stats.push({
        rm_name: snapshot.rm_name,
        ptp_total: snapshot.ptp_total,
        ptp_overdue: snapshot.ptp_overdue,
        ptp_today: snapshot.ptp_today,
        ptp_tomorrow: snapshot.ptp_tomorrow,
        ptp_future: snapshot.ptp_future,
        ptp_no_ptp_set: snapshot.ptp_no_ptp_set
      });
    }

    return acc;
  }, {} as Record<string, any>);

  const branchArray = Object.values(branchData);

  const totals = branchArray.reduce(
    (acc, branch) => ({
      ptp_total: acc.ptp_total + branch.ptp_total,
      ptp_overdue: acc.ptp_overdue + branch.ptp_overdue,
      ptp_today: acc.ptp_today + branch.ptp_today,
      ptp_tomorrow: acc.ptp_tomorrow + branch.ptp_tomorrow,
      ptp_future: acc.ptp_future + branch.ptp_future,
      ptp_no_ptp_set: acc.ptp_no_ptp_set + branch.ptp_no_ptp_set,
    }),
    { ptp_total: 0, ptp_overdue: 0, ptp_today: 0, ptp_tomorrow: 0, ptp_future: 0, ptp_no_ptp_set: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">PTP Status by Branch - {selectedDate}</CardTitle>
            <CardDescription className="text-xs">
              Historical snapshot of PTP status distribution across branches
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Branch/RM</TableHead>
                <TableHead className="text-center w-24">Total</TableHead>
                <TableHead className="text-center w-24">Overdue</TableHead>
                <TableHead className="text-center w-24">Today</TableHead>
                <TableHead className="text-center w-24">Tomorrow</TableHead>
                <TableHead className="text-center w-24">Future</TableHead>
                <TableHead className="text-center w-24">No PTP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchArray.map((branch) => (
                <>
                  <TableRow key={branch.branch_name} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-sm">{branch.branch_name}</TableCell>
                    <TableCell className="text-center text-sm font-medium">{branch.ptp_total}</TableCell>
                    <TableCell className="text-center text-sm text-red-600">{branch.ptp_overdue}</TableCell>
                    <TableCell className="text-center text-sm text-orange-600">{branch.ptp_today}</TableCell>
                    <TableCell className="text-center text-sm text-yellow-600">{branch.ptp_tomorrow}</TableCell>
                    <TableCell className="text-center text-sm text-green-600">{branch.ptp_future}</TableCell>
                    <TableCell className="text-center text-sm">{branch.ptp_no_ptp_set}</TableCell>
                  </TableRow>
                  
                  {branch.rm_stats.map((rm: any) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="bg-muted/25 hover:bg-muted/40">
                      <TableCell className="text-sm pl-8">{rm.rm_name}</TableCell>
                      <TableCell className="text-center text-sm font-medium">{rm.ptp_total}</TableCell>
                      <TableCell className="text-center text-sm text-red-600">{rm.ptp_overdue}</TableCell>
                      <TableCell className="text-center text-sm text-orange-600">{rm.ptp_today}</TableCell>
                      <TableCell className="text-center text-sm text-yellow-600">{rm.ptp_tomorrow}</TableCell>
                      <TableCell className="text-center text-sm text-green-600">{rm.ptp_future}</TableCell>
                      <TableCell className="text-center text-sm">{rm.ptp_no_ptp_set}</TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              
              {branchArray.length > 0 && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={1} className="font-bold text-sm">Total</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.ptp_total}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-red-600">{totals.ptp_overdue}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-orange-600">{totals.ptp_today}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-yellow-600">{totals.ptp_tomorrow}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-green-600">{totals.ptp_future}</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.ptp_no_ptp_set}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {branchArray.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No historical data available for {selectedDate}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricalBranchPTPStatusTable;
