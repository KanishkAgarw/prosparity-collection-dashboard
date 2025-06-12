
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useApplications } from '@/hooks/useApplications';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import BranchPaymentStatusTable from '@/components/analytics/BranchPaymentStatusTable';
import BranchPTPStatusTable from '@/components/analytics/BranchPTPStatusTable';
import CollectionSummaryTable from '@/components/analytics/CollectionSummaryTable';
import ApplicationDetailsModal from '@/components/analytics/ApplicationDetailsModal';
import { Application } from '@/types/application';
import { format, isToday, isTomorrow, isBefore, isAfter, startOfDay } from 'date-fns';

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
  // Get all audit logs for collection summary
  const { auditLogs } = useAuditLogs();
  const [selectedFilter, setSelectedFilter] = useState<DrillDownFilter | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDrillDown = (filter: DrillDownFilter) => {
    console.log('Analytics drill-down with filter:', filter);
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

    // Handle collection summary drill-down
    if (selectedFilter.status_type === 'collection_summary') {
      // Filter applications based on audit logs for collection status changes
      const collectionStatuses = [
        'Paid (Pending Approval)',
        'Cash Collected from Customer', 
        'Partially Paid',
        'Customer Deposited to Bank'
      ];

      const relevantAuditLogs = auditLogs.filter(log => {
        if (log.field !== 'Status' || !log.new_value || !collectionStatuses.includes(log.new_value)) {
          return false;
        }

        // Filter by date if specified
        if (selectedFilter.ptp_date && selectedFilter.ptp_date !== 'all') {
          const logDate = format(new Date(log.created_at), 'dd-MMM-yy');
          if (logDate !== selectedFilter.ptp_date) return false;
        }

        return true;
      });

      const applicationIds = new Set(relevantAuditLogs.map(log => log.application_id));
      
      const filtered = allApplications.filter(app => {
        if (!applicationIds.has(app.applicant_id)) return false;
        
        // Filter by branch
        if (selectedFilter.branch_name && app.branch_name !== selectedFilter.branch_name) return false;
        
        // Filter by RM
        if (selectedFilter.rm_name) {
          const actualRM = app.collection_rm || app.rm_name || 'Unknown RM';
          if (actualRM !== selectedFilter.rm_name) return false;
        }

        return true;
      });

      console.log('Collection summary filtered applications:', filtered.length);
      return filtered;
    }

    // Handle regular filtering (existing logic)
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

      // Filter by branch (handle total row drill-down)
      if (selectedFilter.branch_name && selectedFilter.branch_name !== '' && app.branch_name !== selectedFilter.branch_name) return false;

      // Filter by RM if specified (prioritize collection_rm)
      if (selectedFilter.rm_name) {
        const actualRM = app.collection_rm || app.rm_name || 'Unknown RM';
        if (actualRM !== selectedFilter.rm_name) {
          return false;
        }
      }

      // Handle PTP criteria-based filtering - ALWAYS exclude "Paid" status for ALL PTP criteria
      if (selectedFilter.ptp_criteria) {
        // Exclude "Paid" status for ALL PTP criteria (including 'total')
        if (app.field_status === 'Paid') {
          return false;
        }

        const today = startOfDay(new Date());
        
        switch (selectedFilter.ptp_criteria) {
          case 'overdue':
            if (!app.ptp_date) return false;
            try {
              const ptpDate = new Date(app.ptp_date);
              return isBefore(ptpDate, today);
            } catch {
              return false;
            }
          case 'today':
            if (!app.ptp_date) return false;
            try {
              const ptpDate = new Date(app.ptp_date);
              return isToday(ptpDate);
            } catch {
              return false;
            }
          case 'tomorrow':
            if (!app.ptp_date) return false;
            try {
              const ptpDate = new Date(app.ptp_date);
              return isTomorrow(ptpDate);
            } catch {
              return false;
            }
          case 'future':
            if (!app.ptp_date) return false;
            try {
              const ptpDate = new Date(app.ptp_date);
              return isAfter(ptpDate, today) && !isTomorrow(ptpDate);
            } catch {
              return false;
            }
          case 'no_ptp_set':
            return !app.ptp_date;
          case 'total':
            // For total, return all unpaid applications (already filtered above)
            return true;
          default:
            break;
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
        case 'total':
          // For total, return all applications in that branch/RM (already filtered above)
          return true;
        default:
          return false;
      }
    });

    console.log('Filtered applications count:', filtered.length);
    console.log('Sample filtered applications:', filtered.slice(0, 3).map(app => ({
      applicant_id: app.applicant_id,
      ptp_date: app.ptp_date,
      field_status: app.field_status,
      branch_name: app.branch_name
    })));
    
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
              <TabsTrigger value="collection-summary" className="text-base font-medium">Collection Summary</TabsTrigger>
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

            <TabsContent value="collection-summary" className="space-y-4 p-6">
              <CollectionSummaryTable 
                applications={allApplications}
                auditLogs={auditLogs}
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
