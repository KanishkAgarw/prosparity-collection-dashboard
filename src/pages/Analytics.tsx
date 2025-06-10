
import { useState, useMemo } from "react";
import { useApplications } from "@/hooks/useApplications";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import FinancialOverview from "@/components/analytics/FinancialOverview";
import OperationalMetrics from "@/components/analytics/OperationalMetrics";
import TeamPerformance from "@/components/analytics/TeamPerformance";
import DateRangePicker from "@/components/analytics/DateRangePicker";
import KPICards from "@/components/analytics/KPICards";

const Analytics = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [dateRange, setDateRange] = useState({ from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() });
  
  const { allApplications, loading: appsLoading, refetch } = useApplications({ pageSize: 1000 });

  // Set up real-time updates
  useRealtimeUpdates({
    onApplicationUpdate: refetch,
    onCommentUpdate: refetch,
    onAuditLogUpdate: refetch,
    onCallingLogUpdate: refetch
  });

  // Filter applications by date range
  const filteredApplications = useMemo(() => {
    return allApplications.filter(app => {
      const appDate = new Date(app.created_at);
      return appDate >= dateRange.from && appDate <= dateRange.to;
    });
  }, [allApplications, dateRange]);

  // Calculate high-level KPIs
  const kpis = useMemo(() => {
    const totalApplications = filteredApplications.length;
    const totalPrincipleDue = filteredApplications.reduce((sum, app) => sum + (app.principle_due || 0), 0);
    const totalInterestDue = filteredApplications.reduce((sum, app) => sum + (app.interest_due || 0), 0);
    const paidApplications = filteredApplications.filter(app => app.field_status === 'Paid').length;
    const collectionRate = totalApplications > 0 ? (paidApplications / totalApplications) * 100 : 0;
    
    return {
      totalApplications,
      totalPrincipleDue,
      totalInterestDue,
      collectionRate,
      totalOutstanding: totalPrincipleDue + totalInterestDue
    };
  }, [filteredApplications]);

  if (authLoading || appsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Applications</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600">Comprehensive insights and performance metrics</p>
              </div>
            </div>
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          </div>

          {/* KPI Cards */}
          <KPICards kpis={kpis} />

          {/* Main Analytics Tabs */}
          <Tabs defaultValue="financial" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="financial" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Financial</span>
              </TabsTrigger>
              <TabsTrigger value="operational" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Operational</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Team Performance</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="financial" className="space-y-6">
              <FinancialOverview applications={filteredApplications} />
            </TabsContent>

            <TabsContent value="operational" className="space-y-6">
              <OperationalMetrics applications={filteredApplications} />
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <TeamPerformance applications={filteredApplications} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
