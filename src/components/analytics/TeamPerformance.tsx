
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Application } from "@/types/application";

interface TeamPerformanceProps {
  applications: Application[];
}

const TeamPerformance = ({ applications }: TeamPerformanceProps) => {
  const chartConfig = {
    total: { label: "Total", color: "hsl(var(--chart-1))" },
    paid: { label: "Paid", color: "hsl(var(--chart-2))" },
    rate: { label: "Rate", color: "hsl(var(--chart-3))" }
  };

  // Team Lead performance
  const teamLeadPerformance = useMemo(() => {
    const teamStats = applications.reduce((acc, app) => {
      const teamLead = app.team_lead;
      if (!acc[teamLead]) {
        acc[teamLead] = { total: 0, paid: 0, outstanding: 0 };
      }
      acc[teamLead].total += 1;
      if (app.field_status === 'Paid') acc[teamLead].paid += 1;
      acc[teamLead].outstanding += (app.principle_due || 0) + (app.interest_due || 0);
      return acc;
    }, {} as Record<string, { total: number; paid: number; outstanding: number }>);

    return Object.entries(teamStats)
      .map(([teamLead, stats]) => ({
        teamLead: teamLead.length > 20 ? teamLead.substring(0, 20) + '...' : teamLead,
        total: stats.total,
        paid: stats.paid,
        collectionRate: ((stats.paid / stats.total) * 100).toFixed(1),
        avgOutstanding: stats.outstanding / stats.total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [applications]);

  // RM performance
  const rmPerformance = useMemo(() => {
    const rmStats = applications.reduce((acc, app) => {
      const rm = app.rm_name;
      if (!acc[rm]) {
        acc[rm] = { total: 0, paid: 0, contacted: 0 };
      }
      acc[rm].total += 1;
      if (app.field_status === 'Paid') acc[rm].paid += 1;
      if (app.latest_calling_status !== 'No Calls') acc[rm].contacted += 1;
      return acc;
    }, {} as Record<string, { total: number; paid: number; contacted: number }>);

    return Object.entries(rmStats)
      .map(([rm, stats]) => ({
        rm: rm.length > 20 ? rm.substring(0, 20) + '...' : rm,
        total: stats.total,
        paid: stats.paid,
        collectionRate: ((stats.paid / stats.total) * 100).toFixed(1),
        contactRate: ((stats.contacted / stats.total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [applications]);

  // Dealer performance
  const dealerPerformance = useMemo(() => {
    const dealerStats = applications.reduce((acc, app) => {
      const dealer = app.dealer_name;
      if (!acc[dealer]) {
        acc[dealer] = { total: 0, paid: 0, bounces: 0 };
      }
      acc[dealer].total += 1;
      if (app.field_status === 'Paid') acc[dealer].paid += 1;
      acc[dealer].bounces += app.last_month_bounce || 0;
      return acc;
    }, {} as Record<string, { total: number; paid: number; bounces: number }>);

    return Object.entries(dealerStats)
      .map(([dealer, stats]) => ({
        dealer: dealer.length > 25 ? dealer.substring(0, 25) + '...' : dealer,
        total: stats.total,
        paid: stats.paid,
        collectionRate: ((stats.paid / stats.total) * 100).toFixed(1),
        avgBounces: (stats.bounces / stats.total).toFixed(1)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [applications]);

  return (
    <div className="space-y-6">
      {/* Team Lead Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Lead Performance</CardTitle>
          <CardDescription>Collection rates by team lead (top 10 by portfolio size)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamLeadPerformance} layout="horizontal">
                <XAxis type="number" />
                <YAxis dataKey="teamLead" type="category" width={150} />
                <Bar dataKey="total" fill="hsl(var(--chart-1))" name="Total Applications" />
                <Bar dataKey="paid" fill="hsl(var(--chart-2))" name="Paid Applications" />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RM Performance */}
        <Card>
          <CardHeader>
            <CardTitle>RM Performance</CardTitle>
            <CardDescription>Collection rates by RM (top 10)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rmPerformance}>
                  <XAxis dataKey="rm" angle={-45} textAnchor="end" height={100} />
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

        {/* Dealer Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Dealer Performance</CardTitle>
            <CardDescription>Collection rates by dealer (top 8)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dealerPerformance}>
                  <XAxis dataKey="dealer" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Bar dataKey="collectionRate" fill="hsl(var(--chart-2))" />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: string) => [`${value}%`, "Collection Rate"]}
                  />
                </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      </div>

      {/* Performance Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Top performers across different metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700">Top Team Leads by Collection Rate</h4>
              {teamLeadPerformance
                .sort((a, b) => parseFloat(b.collectionRate) - parseFloat(a.collectionRate))
                .slice(0, 3)
                .map((lead, index) => (
                  <div key={lead.teamLead} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-sm font-medium">{index + 1}. {lead.teamLead}</span>
                    <span className="text-sm text-blue-600">{lead.collectionRate}%</span>
                  </div>
                ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700">Top RMs by Portfolio Size</h4>
              {rmPerformance
                .sort((a, b) => b.total - a.total)
                .slice(0, 3)
                .map((rm, index) => (
                  <div key={rm.rm} className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-sm font-medium">{index + 1}. {rm.rm}</span>
                    <span className="text-sm text-green-600">{rm.total} apps</span>
                  </div>
                ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-700">Best Performing Dealers</h4>
              {dealerPerformance
                .sort((a, b) => parseFloat(b.collectionRate) - parseFloat(a.collectionRate))
                .slice(0, 3)
                .map((dealer, index) => (
                  <div key={dealer.dealer} className="flex justify-between items-center p-2 bg-purple-50 rounded">
                    <span className="text-sm font-medium">{index + 1}. {dealer.dealer}</span>
                    <span className="text-sm text-purple-600">{dealer.collectionRate}%</span>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPerformance;
