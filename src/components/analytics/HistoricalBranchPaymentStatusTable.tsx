
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HistoricalSnapshot } from '@/hooks/useHistoricalAnalytics';

interface HistoricalBranchPaymentStatusTableProps {
  snapshots: HistoricalSnapshot[];
  selectedDate: string;
}

const HistoricalBranchPaymentStatusTable = ({ 
  snapshots, 
  selectedDate 
}: HistoricalBranchPaymentStatusTableProps) => {
  // Group snapshots by branch
  const branchData = snapshots.reduce((acc, snapshot) => {
    const branchName = snapshot.branch_name;
    if (!acc[branchName]) {
      acc[branchName] = {
        branch_name: branchName,
        total_applications: 0,
        unpaid_count: 0,
        partially_paid_count: 0,
        paid_pending_approval_count: 0,
        paid_count: 0,
        others_count: 0,
        rm_stats: []
      };
    }

    acc[branchName].total_applications += snapshot.total_applications;
    acc[branchName].unpaid_count += snapshot.unpaid_count;
    acc[branchName].partially_paid_count += snapshot.partially_paid_count;
    acc[branchName].paid_pending_approval_count += snapshot.paid_pending_approval_count;
    acc[branchName].paid_count += snapshot.paid_count;
    acc[branchName].others_count += snapshot.others_count;

    if (snapshot.rm_name) {
      acc[branchName].rm_stats.push({
        rm_name: snapshot.rm_name,
        total_applications: snapshot.total_applications,
        unpaid_count: snapshot.unpaid_count,
        partially_paid_count: snapshot.partially_paid_count,
        paid_pending_approval_count: snapshot.paid_pending_approval_count,
        paid_count: snapshot.paid_count,
        others_count: snapshot.others_count
      });
    }

    return acc;
  }, {} as Record<string, any>);

  const branchArray = Object.values(branchData);

  const totals = branchArray.reduce(
    (acc, branch) => ({
      total_applications: acc.total_applications + branch.total_applications,
      unpaid_count: acc.unpaid_count + branch.unpaid_count,
      partially_paid_count: acc.partially_paid_count + branch.partially_paid_count,
      paid_pending_approval_count: acc.paid_pending_approval_count + branch.paid_pending_approval_count,
      paid_count: acc.paid_count + branch.paid_count,
      others_count: acc.others_count + branch.others_count,
    }),
    { total_applications: 0, unpaid_count: 0, partially_paid_count: 0, paid_pending_approval_count: 0, paid_count: 0, others_count: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Payment Status by Branch - {selectedDate}</CardTitle>
            <CardDescription className="text-xs">
              Historical snapshot of payment status distribution across branches
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
                <TableHead className="text-center w-24">Unpaid</TableHead>
                <TableHead className="text-center w-24">Partially Paid</TableHead>
                <TableHead className="text-center w-32">Paid (Pending Approval)</TableHead>
                <TableHead className="text-center w-24">Paid</TableHead>
                <TableHead className="text-center w-24">Others</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchArray.map((branch) => (
                <>
                  <TableRow key={branch.branch_name} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-sm">{branch.branch_name}</TableCell>
                    <TableCell className="text-center text-sm font-medium">{branch.total_applications}</TableCell>
                    <TableCell className="text-center text-sm">{branch.unpaid_count}</TableCell>
                    <TableCell className="text-center text-sm">{branch.partially_paid_count}</TableCell>
                    <TableCell className="text-center text-sm">{branch.paid_pending_approval_count}</TableCell>
                    <TableCell className="text-center text-sm text-green-600">{branch.paid_count}</TableCell>
                    <TableCell className="text-center text-sm">{branch.others_count}</TableCell>
                  </TableRow>
                  
                  {branch.rm_stats.map((rm: any) => (
                    <TableRow key={`${branch.branch_name}-${rm.rm_name}`} className="bg-muted/25 hover:bg-muted/40">
                      <TableCell className="text-sm pl-8">{rm.rm_name}</TableCell>
                      <TableCell className="text-center text-sm font-medium">{rm.total_applications}</TableCell>
                      <TableCell className="text-center text-sm">{rm.unpaid_count}</TableCell>
                      <TableCell className="text-center text-sm">{rm.partially_paid_count}</TableCell>
                      <TableCell className="text-center text-sm">{rm.paid_pending_approval_count}</TableCell>
                      <TableCell className="text-center text-sm text-green-600">{rm.paid_count}</TableCell>
                      <TableCell className="text-center text-sm">{rm.others_count}</TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
              
              {branchArray.length > 0 && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={1} className="font-bold text-sm">Total</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.total_applications}</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.unpaid_count}</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.partially_paid_count}</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.paid_pending_approval_count}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-green-600">{totals.paid_count}</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.others_count}</TableCell>
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

export default HistoricalBranchPaymentStatusTable;
