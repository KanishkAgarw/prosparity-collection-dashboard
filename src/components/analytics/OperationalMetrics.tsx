
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Application } from "@/types/application";

interface OperationalMetricsProps {
  applications: Application[];
}

const OperationalMetrics = ({ applications }: OperationalMetricsProps) => {
  const chartConfig = {
    count: { label: "Count", color: "hsl(var(--chart-1))" },
    rate: { label: "Rate", color: "hsl(var(--chart-2))" }
  };

  // Calling status distribution
  const callingStatusData = useMemo(() => {
    const statusTypes = ['applicant_calling_status', 'co_applicant_calling_status', 'guarantor_calling_status', 'reference_calling_status'];
    const statusCounts = {} as Record<string, number>;

    applications.forEach(app => {
      statusTypes.forEach(statusType => {
        const status = app[statusType as keyof Application] as string || 'Not Called';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / (applications.length * 4)) * 100).toFixed(1)
    }));
  }, [applications]);

  // Branch performance
  const branchPerformance = useMemo(() => {
    const branchStats = applications.reduce((acc, app) => {
      const branch = app.branch_name;
      if (!acc[branch]) {
        acc[branch] = { total: 0, paid: 0, contacted: 0 };
      }
      acc[branch].total += 1;
      if (app.field_status === 'Paid') acc[branch].paid += 1;
      if (app.latest_calling_status !== 'No Calls') acc[branch].contacted += 1;
      return acc;
    }, {} as Record<string, { total: number; paid: number; contacted: number }>);

    return Object.entries(branchStats)
      .map(([branch, stats]) => ({
        branch: branch.length > 15 ? branch.substring(0, 15) + '...' : branch,
        total: stats.total,
        collectionRate: ((stats.paid / stats.total) * 100).toFixed(1),
        contactRate: ((stats.contacted / stats.total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [applications]);

  // Application status trend (mock data based on creation dates)
  const statusTrend = useMemo(() => {
    const monthlyData = applications.reduce((acc, app) => {
      const month = new Date(app.created_at).toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = { total: 0, paid: 0, unpaid: 0 };
      }
      acc[month].total += 1;
      if (app.field_status === 'Paid') {
        acc[month].paid += 1;
      } else {
        acc[month].unpaid += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; paid: number; unpaid: number }>);

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        total: data.total,
        paid: data.paid,
        unpaid: data.unpaid,
        collectionRate: ((data.paid / data.total) * 100).toFixed(1)
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [applications]);

  // Last month bounce analysis
  const bounceAnalysis = useMemo(() => {
    const bounceData = applications.reduce((acc, app) => {
      const bounceCount = app.last_month_bounce || 0;
      const bounceCategory = bounceCount === 0 ? 'No Bounce' : 
                           bounceCount === 1 ? '1 Bounce' : 
                           bounceCount <= 3 ? '2-3 Bounces' : '4+ Bounces';
      acc[bounceCategory] = (acc[bounceCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(bounceData).map(([category, count]) => ({
      category,
      count,
      percentage: ((count / applications.length) * 100).toFixed(1)
    }));
  }, [applications]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calling Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Status Overview</CardTitle>
          <CardDescription>Distribution of calling statuses across all contacts</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={callingStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ status, percentage }) => `${status} (${percentage}%)`}
                >
                  {callingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Branch Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Performance</CardTitle>
          <CardDescription>Collection rates by branch (top 10)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchPerformance}>
                <XAxis dataKey="branch" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Bar dataKey="collectionRate" fill="hsl(var(--chart-1))" />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: string) => [`${value}%`, "Collection Rate"]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Collection Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Trend</CardTitle>
          <CardDescription>Monthly collection performance (last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statusTrend}>
                <XAxis dataKey="month" />
                <YAxis />
                <Line type="monotone" dataKey="paid" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                <Line type="monotone" dataKey="unpaid" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Bounce Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Bounce Analysis</CardTitle>
          <CardDescription>Last month bounce distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bounceAnalysis}>
                <XAxis dataKey="category" />
                <YAxis />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [value, "Applications"]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationalMetrics;
