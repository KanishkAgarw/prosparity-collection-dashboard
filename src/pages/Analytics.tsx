
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApplications } from '@/hooks/useApplications';
import BranchPaymentStatusTable from '@/components/analytics/BranchPaymentStatusTable';
import BranchPTPStatusTable from '@/components/analytics/BranchPTPStatusTable';
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

    return allApplications.filter(app => {
      // Filter by branch
      if (app.branch_name !== selectedFilter.branch_name) return false;

      // Filter by RM if specified (prioritize collection_rm)
      if (selectedFilter.rm_name && 
          (app.collection_rm || app.rm_name) !== selectedFilter.rm_name) {
        return false;
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
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">View payment status and PTP analytics by branch and RM</p>
        </div>
      </div>

      {/* Analytics Content */}
      <Tabs defaultValue="payment-status" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payment-status">Payment Status</TabsTrigger>
          <TabsTrigger value="ptp-status">PTP Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payment-status" className="space-y-4">
          <BranchPaymentStatusTable 
            applications={allApplications} 
            onDrillDown={handleDrillDown}
          />
        </TabsContent>
        
        <TabsContent value="ptp-status" className="space-y-4">
          <BranchPTPStatusTable 
            applications={allApplications} 
            onDrillDown={handleDrillDown}
          />
        </TabsContent>
      </Tabs>

      {/* Drill-down Modal */}
      <ApplicationDetailsModal
        isOpen={showModal}
        onClose={handleCloseModal}
        applications={getFilteredApplications()}
        filter={selectedFilter}
      />
    </div>
  );
};

export default Analytics;
