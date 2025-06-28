import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Application } from "@/types/application";
import { useComments } from "@/hooks/useComments";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useCallingLogs } from "@/hooks/useCallingLogs";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ApplicationHeader from "./details/ApplicationHeader";
import ContactsTab from "./details/ContactsTab";
import StatusTab from "./details/StatusTab";
import CommentsTab from "./details/CommentsTab";
import DetailsTab from "./details/DetailsTab";
import { useApplicationHandlers } from "./details/ApplicationHandlers";
import { useEffect, useState } from "react";
import { useRepaymentHistory } from "@/hooks/useRepaymentHistory";
import { supabase } from '@/integrations/supabase/client';
import { useMonthlyApplicationData } from '@/hooks/useMonthlyApplicationData';
import MonthSelector from './details/MonthSelector';
import { formatEmiMonth } from "@/utils/formatters";

interface ApplicationDetailsPanelProps {
  application: Application | null;
  onClose: () => void;
  onSave: (updatedApp: Application) => void;
  onDataChanged?: () => void;
  selectedEmiMonth?: string | null;
}

const ApplicationDetailsPanel = ({ 
  application, 
  onClose, 
  onSave, 
  onDataChanged, 
  selectedEmiMonth 
}: ApplicationDetailsPanelProps) => {
  const { user } = useAuth();
  const [currentApplication, setCurrentApplication] = useState<Application | null>(application);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [monthSpecificPtpDate, setMonthSpecificPtpDate] = useState<string | null>(null);
  const { monthlyData, availableMonths, availableMonthsFormatted, loading: monthlyLoading, getApplicationForMonth } = useMonthlyApplicationData(currentApplication?.applicant_id);

  // Handle application changes
  useEffect(() => {
    console.log('=== APPLICATION DETAILS PANEL DEBUG ===');
    console.log('Application changed:', application?.applicant_id);
    console.log('Selected EMI Month from filter:', selectedEmiMonth);
    setCurrentApplication(application);
    // Clear selectedMonth when application changes to force proper initialization
    setSelectedMonth('');
  }, [application]);
  
  const { repaymentHistory } = useRepaymentHistory(currentApplication?.applicant_id);
  
  // Initialize comments hook but don't auto-fetch
  const { comments, fetchComments, addComment, clearComments } = useComments(selectedMonth);
  
  const { auditLogs, addAuditLog, refetch: refetchAuditLogs } = useAuditLogs(currentApplication?.applicant_id, selectedMonth);
  const { callingLogs, addCallingLog, refetch: refetchCallingLogs } = useCallingLogs(currentApplication?.applicant_id, selectedMonth);

  // Fetch month-specific PTP date
  useEffect(() => {
    const fetchMonthSpecificPtpDate = async () => {
      if (!currentApplication?.applicant_id || !selectedMonth) {
        setMonthSpecificPtpDate(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ptp_dates')
          .select('ptp_date')
          .eq('application_id', currentApplication.applicant_id)
          .eq('demand_date', selectedMonth)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching month-specific PTP date:', error);
        }

        setMonthSpecificPtpDate(data?.ptp_date || null);
      } catch (error) {
        console.error('Error fetching month-specific PTP date:', error);
        setMonthSpecificPtpDate(null);
      }
    };

    fetchMonthSpecificPtpDate();
  }, [currentApplication?.applicant_id, selectedMonth]);

  // Clear comments when application changes
  useEffect(() => {
    console.log('Clearing comments for application:', currentApplication?.applicant_id);
    clearComments();
  }, [currentApplication?.applicant_id, clearComments]);

  // FIXED: Set initial month based on selectedEmiMonth with proper debugging
  useEffect(() => {
    console.log('=== MONTH SELECTION DEBUG ===');
    console.log('Selected EMI Month from filter:', selectedEmiMonth);
    console.log('Available months:', availableMonths);
    console.log('Current selected month:', selectedMonth);
    
    if (availableMonths.length > 0 && !selectedMonth && currentApplication?.applicant_id) {
      let initialMonth = '';
      
      if (selectedEmiMonth) {
        console.log('Trying to match filter month:', selectedEmiMonth);
        
        // Find the month that matches the selected EMI month from filters
        const matchingMonth = availableMonths.find(month => {
          const formattedMonth = formatEmiMonth(month);
          console.log(`Comparing: ${formattedMonth} === ${selectedEmiMonth}`, formattedMonth === selectedEmiMonth);
          return formattedMonth === selectedEmiMonth;
        });
        
        if (matchingMonth) {
          initialMonth = matchingMonth;
          console.log('✅ Found matching month:', initialMonth);
        } else {
          console.log('❌ No matching month found, using most recent');
          initialMonth = availableMonths[availableMonths.length - 1];
        }
      } else {
        // Default to the most recent month (last in the array)
        initialMonth = availableMonths[availableMonths.length - 1];
        console.log('No filter month, using most recent:', initialMonth);
      }
      
      console.log('Setting initial month to:', initialMonth);
      setSelectedMonth(initialMonth);
    }
  }, [availableMonths, selectedMonth, currentApplication?.applicant_id, selectedEmiMonth]);

  // Only fetch comments when the comments tab is actively accessed
  const [commentsTabAccessed, setCommentsTabAccessed] = useState(false);
  
  useEffect(() => {
    if (commentsTabAccessed && currentApplication?.applicant_id && selectedMonth) {
      console.log('Fetching comments for active tab', {
        applicationId: currentApplication.applicant_id,
        selectedMonth
      });
      fetchComments(currentApplication.applicant_id);
    }
  }, [commentsTabAccessed, currentApplication?.applicant_id, selectedMonth, fetchComments]);

  const monthlyCollectionData = selectedMonth ? getApplicationForMonth(selectedMonth) : null;

  useRealtimeUpdates({
    onCallingLogUpdate: async () => { 
      refetchCallingLogs(); 
      await onDataChanged?.(); 
    },
    onAuditLogUpdate: async () => { 
      refetchAuditLogs(); 
      await onDataChanged?.(); 
    },
    onCommentUpdate: async () => { 
      if (currentApplication?.applicant_id) fetchComments(currentApplication.applicant_id); 
      await onDataChanged?.(); 
    },
    onApplicationUpdate: async () => {
      // When application data changes from real-time, update both local state and parent
      if (currentApplication?.applicant_id) {
        // Fetch the latest application data
        supabase
          .from('applications')
          .select('*')
          .eq('applicant_id', currentApplication.applicant_id)
          .single()
          .then(({ data, error }) => {
            if (data && !error) {
              const updatedApp = { ...currentApplication, ...data };
              setCurrentApplication(updatedApp);
              onSave(updatedApp);
            }
          });
      }
      await onDataChanged?.();
    },
    onPtpDateUpdate: async () => { 
      refetchAuditLogs(); 
      // Refresh month-specific PTP date
      if (currentApplication?.applicant_id && selectedMonth) {
        const { data, error } = await supabase
          .from('ptp_dates')
          .select('ptp_date')
          .eq('application_id', currentApplication.applicant_id)
          .eq('demand_date', selectedMonth)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setMonthSpecificPtpDate(data.ptp_date);
        } else if (error && error.code === 'PGRST116') {
          setMonthSpecificPtpDate(null);
        }
      }
      await onDataChanged?.(); 
    }
  });

  const {
    handleStatusChange,
    handlePtpDateChange,
    handleCallingStatusChange
  } = useApplicationHandlers(currentApplication, user, addAuditLog, addCallingLog, (updatedApp) => {
    setCurrentApplication(updatedApp);
    onSave(updatedApp);
    onDataChanged?.();
  }, selectedMonth);

  const displayApplication = (() => {
    if (!currentApplication) return null;
    if (monthlyCollectionData) {
      return {
        ...currentApplication,
        team_lead: monthlyCollectionData.team_lead || currentApplication.team_lead,
        rm_name: monthlyCollectionData.rm_name || currentApplication.rm_name,
        repayment: monthlyCollectionData.repayment || currentApplication.repayment,
        emi_amount: monthlyCollectionData.emi_amount || currentApplication.emi_amount,
        last_month_bounce: monthlyCollectionData.last_month_bounce || currentApplication.last_month_bounce,
        lms_status: monthlyCollectionData.lms_status || currentApplication.lms_status,
        collection_rm: monthlyCollectionData.collection_rm || currentApplication.collection_rm,
        demand_date: monthlyCollectionData.demand_date || currentApplication.demand_date,
        amount_collected: monthlyCollectionData.amount_collected || currentApplication.amount_collected,
        ptp_date: monthSpecificPtpDate || currentApplication.ptp_date,
        vehicle_status: currentApplication.vehicle_status,
      };
    }
    return {
      ...currentApplication,
      ptp_date: monthSpecificPtpDate || currentApplication.ptp_date,
      vehicle_status: currentApplication.vehicle_status,
    };
  })();

  if (!currentApplication) return null;

  const handleAddComment = async (content: string) => {
    if (currentApplication?.applicant_id) {
      await addComment(currentApplication.applicant_id, content, selectedMonth);
      toast.success('Comment added');
      await onDataChanged?.();
    }
  };

  const handleVehicleStatusChange = async (newStatus: string) => {
    if (!currentApplication || !user || !selectedMonth) return;

    const originalApplication = currentApplication;
    const previousStatus = originalApplication.vehicle_status || 'None';
    const updatedApplication = { ...currentApplication, vehicle_status: newStatus };
    
    // 1. Optimistic UI update - update both local state and parent
    setCurrentApplication(updatedApplication);
    onSave(updatedApplication);

    try {
      // 2. Safe database update
      const { error } = await supabase
        .from('applications')
        .update({ vehicle_status: newStatus })
        .eq('applicant_id', originalApplication.applicant_id);

      if (error) {
        console.error('Database error updating vehicle status:', error);
        throw error;
      }
      
      // Add to audit log on success - vehicle status changes are tracked per month
      await addAuditLog(
        originalApplication.applicant_id,
        'Vehicle Status',
        previousStatus,
        newStatus || 'None',
        selectedMonth // Vehicle status changes are tracked per month
      );
      
      toast.success('Vehicle status updated successfully');
      // 3. Inform parent to refetch data to stay in sync with other components
      await onDataChanged?.();
    } catch (error) {
      console.error('Failed to update vehicle status:', error);
      toast.error('Failed to update vehicle status. Reverting change.');
      // 4. Revert UI on failure - update both local state and parent
      setCurrentApplication(originalApplication);
      onSave(originalApplication);
    }
  };

  return (
    <div className="application-details-panel bg-white flex flex-col">
      <div className="flex-shrink-0 p-4 sm:p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold">Application Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100 rounded-full h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ApplicationHeader application={displayApplication} />
      </div>

      <MonthSelector
        availableMonths={availableMonths}
        availableMonthsFormatted={availableMonthsFormatted}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        loading={monthlyLoading}
      />

      <div className="flex-1 flex-col-min-h-0">
        <Tabs defaultValue="contacts" className="h-full flex flex-col" onValueChange={(value) => {
          if (value === 'comments') {
            setCommentsTabAccessed(true);
          }
        }}>
          <div className="flex-shrink-0 pt-3 sm:pt-4 border-b">
            <TabsList className="grid w-full grid-cols-4 text-xs sm:text-sm h-auto">
              <TabsTrigger value="contacts" className="py-2">Contacts</TabsTrigger>
              <TabsTrigger value="status" className="py-2">Status</TabsTrigger>
              <TabsTrigger value="comments" className="py-2">Comments</TabsTrigger>
              <TabsTrigger value="details" className="py-2">Details</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="application-details-content flex-1 overflow-y-auto p-4 sm:p-4">
            <TabsContent value="contacts" className="m-0">
              <ContactsTab 
                application={currentApplication}
                callingLogs={callingLogs}
                onCallingStatusChange={handleCallingStatusChange}
                selectedMonth={selectedMonth}
              />
            </TabsContent>
            <TabsContent value="status" className="m-0">
              <StatusTab 
                application={displayApplication}
                auditLogs={auditLogs}
                onStatusChange={handleStatusChange}
                onPtpDateChange={handlePtpDateChange}
                addAuditLog={addAuditLog}
                selectedMonth={selectedMonth}
              />
            </TabsContent>
            <TabsContent value="comments" className="m-0">
              <CommentsTab 
                comments={comments}
                onAddComment={handleAddComment}
              />
            </TabsContent>
            <TabsContent value="details" className="m-0">
              <DetailsTab 
                application={displayApplication}
                repaymentHistory={repaymentHistory}
                auditLogs={auditLogs}
                onVehicleStatusChange={handleVehicleStatusChange}
                monthlyData={monthlyData}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ApplicationDetailsPanel;
