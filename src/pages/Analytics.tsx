
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, Clock, Target, BarChart3, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApplications } from '@/hooks/useApplications';
import BranchPaymentStatusTable from '@/components/analytics/BranchPaymentStatusTable';
import BranchPTPStatusTable from '@/components/analytics/BranchPTPStatusTable';
import PTPEffectivenessTable from '@/components/analytics/PTPEffectivenessTable';
import RMPerformanceTable from '@/components/analytics/RMPerformanceTable';
import CollectionVelocityTable from '@/components/analytics/CollectionVelocityTable';
import PaymentPatternTable from '@/components/analytics/PaymentPatternTable';
import ApplicationDetailsModal from '@/components/analytics/ApplicationDetailsModal';
import { Application } from '@/types/application';

export interface DrillDownFilter {
  branch_name: string;
  rm_name?: string;
  status_type: string;
  ptp_criteria?: string;
}

const Analytics = () => {
  const navigate = useNavigate();
  const { allApplications, loading } = useApplications();
  const [selectedFilter, setSelectedFilter] = useState<DrillDownFilter | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDrillDown = (filter: DrillDownFilter) => {
    setSelectedFilter(filter);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFilter(null);
  };

  const getFilteredApplications = (): Application[] => {
    if (!selectedFilter) return [];

    console.log('Filtering applications with filter:', selectedFilter);
    console.log('Total applications:', allApplications.length);

    const filtered = allApplications.filter(app => {
      // Filter by branch
      if (app.branch_name !== selectedFilter.branch_name) return false;

      // Filter by RM if specified (prioritize collection_rm)
      if (selectedFilter.rm_name) {
        const actualRM = app.collection_rm || app.rm_name || 'Unknown RM';
        if (actualRM !== selectedFilter.rm_name) {
          return false;
        }
      }

      // Filter by status type
      switch (selectedFilter.status_type) {
        case 'unpaid':
          return app.field_status === 'Unpaid';
        case 'partially_paid':
          return app.field_status === 'Partially Paid';
        case 'paid_pending_approval':
          return app.field_status === 'Paid (Pending Approval)';
        case 'paid':
          return app.field_status === 'Paid';
        case 'others':
          return ['Cash Collected from Customer', 'Customer Deposited to Bank'].includes(app.field_status || '') ||
                 !['Unpaid', 'Partially Paid', 'Paid (Pending Approval)', 'Paid'].includes(app.field_status || '');
        case 'overdue':
          return selectedFilter.ptp_criteria === 'overdue' && app.ptp_date && new Date(app.ptp_date) < new Date();
        case 'today':
          return selectedFilter.ptp_criteria === 'today' && app.ptp_date && 
                 new Date(app.ptp_date).toDateString() === new Date().toDateString();
        case 'tomorrow':
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return selectedFilter.ptp_criteria === 'tomorrow' && app.ptp_date && 
                 new Date(app.ptp_date).toDateString() === tomorrow.toDateString();
        case 'future':
          const dayAfterTomorrow = new Date();
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
          return selectedFilter.ptp_criteria === 'future' && app.ptp_date && 
                 new Date(app.ptp_date) >= dayAfterTomorrow;
        case 'no_ptp_set':
          return selectedFilter.ptp_criteria === 'no_ptp_set' && !app.ptp_date;
        case 'total':
          // For total, return all applications in that branch/RM
          return true;
        default:
          return false;
      }
    });

    console.log('Filtered applications count:', filtered.length);
    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const analyticsCards = [
    {
      title: "Payment Status",
      description: "Track payment statuses across branches and RMs",
      icon: BarChart3,
      value: "payment-status",
      color: "bg-blue-500"
    },
    {
      title: "PTP Status", 
      description: "Monitor PTP scheduling and compliance",
      icon: Calendar,
      value: "ptp-status",
      color: "bg-green-500"
    },
    {
      title: "PTP Effectiveness",
      description: "Analyze conversion rates from PTP to payments",
      icon: Target,
      value: "ptp-effectiveness", 
      color: "bg-purple-500"
    },
    {
      title: "RM Performance",
      description: "Individual RM metrics and comparisons", 
      icon: Users,
      value: "rm-performance",
      color: "bg-orange-500"
    },
    {
      title: "Collection Velocity",
      description: "Speed of collections and cycle times",
      icon: TrendingUp,
      value: "collection-velocity",
      color: "bg-red-500"
    },
    {
      title: "Payment Patterns",
      description: "Temporal and behavioral payment insights",
      icon: Clock,
      value: "payment-patterns",
      color: "bg-teal-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:bg-white/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights into payment collections and PTP performance</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {analyticsCards.map((card) => (
            <Card key={card.value} className="hover:shadow-lg transition-shadow cursor-pointer bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.color} text-white`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription className="text-sm">{card.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Analytics Content */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
          <Tabs defaultValue="payment-status" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-gray-100/80">
              <TabsTrigger value="payment-status" className="text-xs lg:text-sm">Payment</TabsTrigger>
              <TabsTrigger value="ptp-status" className="text-xs lg:text-sm">PTP Status</TabsTrigger>
              <TabsTrigger value="ptp-effectiveness" className="text-xs lg:text-sm">Effectiveness</TabsTrigger>
              <TabsTrigger value="rm-performance" className="text-xs lg:text-sm">RM Perf.</TabsTrigger>
              <TabsTrigger value="collection-velocity" className="text-xs lg:text-sm">Velocity</TabsTrigger>
              <TabsTrigger value="payment-patterns" className="text-xs lg:text-sm">Patterns</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payment-status" className="space-y-4 p-6">
              <BranchPaymentStatusTable 
                applications={allApplications} 
                onDrillDown={handleDrillDown}
              />
            </TabsContent>
            
            <TabsContent value="ptp-status" className="space-y-4 p-6">
              <BranchPTPStatusTable 
                applications={allApplications} 
                onDrillDown={handleDrillDown}
              />
            </TabsContent>

            <TabsContent value="ptp-effectiveness" className="space-y-4 p-6">
              <PTPEffectivenessTable 
                applications={allApplications}
                onDrillDown={handleDrillDown}
              />
            </TabsContent>

            <TabsContent value="rm-performance" className="space-y-4 p-6">
              <RMPerformanceTable 
                applications={allApplications}
                onDrillDown={handleDrillDown}
              />
            </TabsContent>

            <TabsContent value="collection-velocity" className="space-y-4 p-6">
              <CollectionVelocityTable 
                applications={allApplications}
                onDrillDown={handleDrillDown}
              />
            </TabsContent>

            <TabsContent value="payment-patterns" className="space-y-4 p-6">
              <PaymentPatternTable 
                applications={allApplications}
                onDrillDown={handleDrillDown}
              />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Drill-down Modal */}
        <ApplicationDetailsModal
          isOpen={showModal}
          onClose={handleCloseModal}
          applications={getFilteredApplications()}
          filter={selectedFilter}
        />
      </div>
    </div>
  );
};

export default Analytics;
