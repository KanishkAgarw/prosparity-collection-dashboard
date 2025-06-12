
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useApplications } from '@/hooks/useApplications';
import BranchPaymentStatusTable from '@/components/analytics/BranchPaymentStatusTable';
import BranchPTPStatusTable from '@/components/analytics/BranchPTPStatusTable';
import PTPEffectivenessTable from '@/components/analytics/PTPEffectivenessTable';
import ApplicationDetailsModal from '@/components/analytics/ApplicationDetailsModal';
import { Application } from '@/types/application';
import { format } from 'date-fns';

export interface DrillDownFilter {
  branch_name: string;
  rm_name?: string;
  status_type: string;
  ptp_criteria?: string;
  ptp_date?: string;
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
      // Handle PTP date-specific filtering
      if (selectedFilter.ptp_criteria === 'date_specific' && selectedFilter.ptp_date) {
        if (!app.ptp_date) return false;
        
        try {
          const appPtpDate = format(new Date(app.ptp_date), 'yyyy-MM-dd');
          if (appPtpDate !== selectedFilter.ptp_date) return false;
        } catch {
          return false;
        }
        
        // Apply status filter for the specific date
        switch (selectedFilter.status_type) {
          case 'paid':
            return app.field_status === 'Paid';
          case 'overdue':
            return app.ptp_date && new Date(app.ptp_date) < new Date() && app.field_status !== 'Paid';
          case 'total':
            return true;
          default:
            return false;
        }
      }

      // Filter by branch (skip for PTP date-based filtering without branch)
      if (selectedFilter.branch_name && app.branch_name !== selectedFilter.branch_name) return false;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
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

        {/* Analytics Content */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
          <Tabs defaultValue="payment-status" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 h-12">
              <TabsTrigger value="payment-status" className="text-base font-medium">Payment Status</TabsTrigger>
              <TabsTrigger value="ptp-status" className="text-base font-medium">PTP Status</TabsTrigger>
              <TabsTrigger value="ptp-effectiveness" className="text-base font-medium">PTP Effectiveness</TabsTrigger>
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
