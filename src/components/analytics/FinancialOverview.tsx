
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from "recharts";
import { Application } from "@/types/application";

interface FinancialOverviewProps {
  applications: Application[];
}

const FinancialOverview = ({ applications }: FinancialOverviewProps) => {
  const chartConfig = {
    amount: { label: "Amount", color: "hsl(var(--chart-1))" },
    count: { label: "Count", color: "hsl(var(--chart-2))" },
    paid: { label: "Paid", color: "#10b981" },
    unpaid: { label: "Unpaid", color: "#ef4444" },
    partial: { label: "Partial", color: "#f59e0b" }
  };

  // Status distribution
  const statusData = useMemo(() => {
    const statusCounts = applications.reduce((acc, app) => {
      const status = app.field_status || 'Unpaid';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / applications.length) * 100).toFixed(1)
    }));
  }, [applications]);

  // Lender-wise outstanding
  const lenderData = useMemo(() => {
    const lenderStats = applications.reduce((acc, app) => {
      const lender = app.lender_name === 'Vivriti Capital Limited' ? 'Vivriti' : app.lender_name;
      if (!acc[lender]) {
        acc[lender] = { outstanding: 0, count: 0 };
      }
      acc[lender].outstanding += (app.principle_due || 0) + (app.interest_due || 0);
      acc[lender].count += 1;
      return acc;
    }, {} as Record<string, { outstanding: number; count: number }>);

    return Object.entries(lenderStats)
      .map(([lender, stats]) => ({
        lender,
        outstanding: stats.outstanding,
        count: stats.count,
        avgOutstanding: stats.outstanding / stats.count
      }))
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [applications]);

  // EMI distribution
  const emiDistribution = useMemo(() => {
    const ranges = [
      { min: 0, max: 10000, label: "≤10K" },
      { min: 10001, max: 25000, label: "10K-25K" },
      { min: 25001, max: 50000, label: "25K-50K" },
      { min: 50001, max: 100000, label: "50K-100K" },
      { min: 100001, max: Infinity, label: ">100K" }
    ];

    return ranges.map(range => {
      const count = applications.filter(app => 
        app.emi_amount >= range.min && app.emi_amount <= range.max
      ).length;
      return {
        range: range.label,
        count,
        percentage: ((count / applications.length) * 100).toFixed(1)
      };
    });
  }, [applications]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status Distribution</CardTitle>
          <CardDescription>Current status of all applications</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ status, percentage }) => `${status} (${percentage}%)`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Lender-wise Outstanding */}
      <Card>
        <CardHeader>
          <CardTitle>Outstanding by Lender</CardTitle>
          <CardDescription>Total outstanding amount per lender</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lenderData.slice(0, 6)}>
                <XAxis dataKey="lender" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
                <Bar dataKey="outstanding" fill="hsl(var(--chart-1))" />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [
                    `₹${(value / 100000).toFixed(2)}L`,
                    "Outstanding"
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* EMI Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>EMI Range Distribution</CardTitle>
          <CardDescription>Application count by EMI amount ranges</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emiDistribution}>
                <XAxis dataKey="range" />
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

      {/* Financial Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Key financial metrics breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Principal Due</p>
                <p className="text-2xl font-bold text-blue-900">
                  ₹{(applications.reduce((sum, app) => sum + (app.principle_due || 0), 0) / 100000).toFixed(2)}L
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Total Interest Due</p>
                <p className="text-2xl font-bold text-green-900">
                  ₹{(applications.reduce((sum, app) => sum + (app.interest_due || 0), 0) / 100000).toFixed(2)}L
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Average EMI Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{applications.length > 0 ? 
                  (applications.reduce((sum, app) => sum + app.emi_amount, 0) / applications.length).toLocaleString() 
                  : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialOverview;
