
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Application } from '@/types/application';
import { useApplications } from '@/hooks/useApplications';
import PaymentStatusTable from '@/components/analytics/PaymentStatusTable';
import PTPStatusTable from '@/components/analytics/PTPStatusTable';
import BranchPaymentStatusTable from '@/components/analytics/BranchPaymentStatusTable';
import BranchPTPStatusTable from '@/components/analytics/BranchPTPStatusTable';
import CollectionVelocityTable from '@/components/analytics/CollectionVelocityTable';
import PTPEffectivenessTable from '@/components/analytics/PTPEffectivenessTable';
import RMPerformanceTable from '@/components/analytics/RMPerformanceTable';
import PaymentPatternTable from '@/components/analytics/PaymentPatternTable';
import ApplicationDetailsModal from '@/components/analytics/ApplicationDetailsModal';
import { isToday, isTomorrow, isBefore, isAfter, startOfDay } from 'date-fns';

export interface DrillDownFilter {
  type: 'payment_status' | 'ptp_status' | 'branch_payment' | 'branch_ptp';
  branch_name?: string;
  rm_name?: string;
  status?: string;
  ptp_category?: string;
}

const Analytics = () => {
  const { data: applications = [] } = useApplications();
  const [drillDownFilter, setDrillDownFilter] = useState<DrillDownFilter | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDrillDown = (filter: DrillDownFilter) => {
    console.log('Analytics drill down triggered with filter:', filter);
    setDrillDownFilter(filter);
    setModalOpen(true);
  };

  const getFilteredApplications = (filter: DrillDownFilter | null): Application[] => {
    if (!filter) return [];

    console.log('Filtering applications with filter:', filter);
    console.log('Total applications:', applications.length);

    let filtered = applications;

    // Apply branch filter
    if (filter.branch_name) {
      filtered = filtered.filter(app => app.branch_name === filter.branch_name);
      console.log('After branch filter:', filtered.length);
    }

    // Apply RM filter
    if (filter.rm_name) {
      filtered = filtered.filter(app => {
        const rmMatch = app.rm_name === filter.rm_name || app.collection_rm === filter.rm_name;
        return rmMatch;
      });
      console.log('After RM filter:', filtered.length);
    }

    // Apply specific filters based on type
    if (filter.type === 'payment_status' && filter.status) {
      filtered = filtered.filter(app => app.field_status === filter.status);
      console.log('After payment status filter:', filtered.length);
    } else if (filter.type === 'ptp_status' && filter.ptp_category) {
      const today = startOfDay(new Date());
      
      // For PTP status, exclude paid applications
      const unpaidApplications = filtered.filter(app => 
        !['Paid'].includes(app.field_status || '')
      );
      console.log('Unpaid applications for PTP filter:', unpaidApplications.length);

      filtered = unpaidApplications.filter(app => {
        if (!app.ptp_date && filter.ptp_category === 'no_ptp_set') {
          return true;
        }
        
        if (!app.ptp_date) {
          return false;
        }

        try {
          const ptpDate = new Date(app.ptp_date);
          
          switch (filter.ptp_category) {
            case 'overdue':
              return isBefore(ptpDate, today);
            case 'today':
              return isToday(ptpDate);
            case 'tomorrow':
              return isTomorrow(ptpDate);
            case 'future':
              return isAfter(ptpDate, today) && !isTomorrow(ptpDate);
            case 'no_ptp_set':
              return false; // Already handled above
            default:
              return false;
          }
        } catch {
          return filter.ptp_category === 'no_ptp_set';
        }
      });
      console.log('After PTP category filter:', filtered.length);
    } else if (filter.type === 'branch_payment' && filter.status) {
      filtered = filtered.filter(app => app.field_status === filter.status);
      console.log('After branch payment status filter:', filtered.length);
    } else if (filter.type === 'branch_ptp' && filter.ptp_category) {
      const today = startOfDay(new Date());
      
      // For branch PTP status, exclude paid applications
      const unpaidApplications = filtered.filter(app => 
        !['Paid'].includes(app.field_status || '')
      );
      console.log('Unpaid applications for branch PTP filter:', unpaidApplications.length);

      filtered = unpaidApplications.filter(app => {
        if (!app.ptp_date && filter.ptp_category === 'no_ptp_set') {
          return true;
        }
        
        if (!app.ptp_date) {
          return false;
        }

        try {
          const ptpDate = new Date(app.ptp_date);
          
          switch (filter.ptp_category) {
            case 'overdue':
              return isBefore(ptpDate, today);
            case 'today':
              return isToday(ptpDate);
            case 'tomorrow':
              return isTomorrow(ptpDate);
            case 'future':
              return isAfter(ptpDate, today) && !isTomorrow(ptpDate);
            case 'no_ptp_set':
              return false; // Already handled above
            default:
              return false;
          }
        } catch {
          return filter.ptp_category === 'no_ptp_set';
        }
      });
      console.log('After branch PTP category filter:', filtered.length);
    }

    console.log('Final filtered applications:', filtered.length);
    return filtered;
  };

  const filteredApplications = getFilteredApplications(drillDownFilter);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive analysis of collections and performance</p>
        </div>
      </div>

      <Tabs defaultValue="payment-status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="payment-status">Payment Status</TabsTrigger>
          <TabsTrigger value="ptp-status">PTP Status</TabsTrigger>
          <TabsTrigger value="branch-payment">Branch Payment</TabsTrigger>
          <TabsTrigger value="branch-ptp">Branch PTP</TabsTrigger>
          <TabsTrigger value="collection-velocity">Collection Velocity</TabsTrigger>
          <TabsTrigger value="ptp-effectiveness">PTP Effectiveness</TabsTrigger>
          <TabsTrigger value="rm-performance">RM Performance</TabsTrigger>
          <TabsTrigger value="payment-patterns">Payment Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="payment-status">
          <PaymentStatusTable applications={applications} onDrillDown={handleDrillDown} />
        </TabsContent>

        <TabsContent value="ptp-status">
          <PTPStatusTable applications={applications} onDrillDown={handleDrillDown} />
        </TabsContent>

        <TabsContent value="branch-payment">
          <BranchPaymentStatusTable applications={applications} onDrillDown={handleDrillDown} />
        </TabsContent>

        <TabsContent value="branch-ptp">
          <BranchPTPStatusTable applications={applications} onDrillDown={handleDrillDown} />
        </TabsContent>

        <TabsContent value="collection-velocity">
          <CollectionVelocityTable applications={applications} />
        </TabsContent>

        <TabsContent value="ptp-effectiveness">
          <PTPEffectivenessTable applications={applications} />
        </TabsContent>

        <TabsContent value="rm-performance">
          <RMPerformanceTable applications={applications} />
        </TabsContent>

        <TabsContent value="payment-patterns">
          <PaymentPatternTable applications={applications} />
        </TabsContent>
      </Tabs>

      <ApplicationDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        applications={filteredApplications}
        filter={drillDownFilter}
      />
    </div>
  );
};

export default Analytics;
