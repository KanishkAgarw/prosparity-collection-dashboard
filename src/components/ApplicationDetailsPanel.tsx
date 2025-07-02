
import React, { useState, useEffect } from "react";
import { Application } from "@/types/application";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ApplicationHeader from "./details/ApplicationHeader";
import DetailsTab from "./details/DetailsTab";
import ContactsTab from "./details/ContactsTab";
import StatusTab from "./details/StatusTab";
import CommentsTab from "./details/CommentsTab";
import MonthSelector from "./details/MonthSelector";
import { useMonthlyApplicationData } from "@/hooks/useMonthlyApplicationData";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useCallingLogs } from "@/hooks/useCallingLogs";
import { useRepaymentHistory } from "@/hooks/useRepaymentHistory";
import { useComments } from "@/hooks/useComments";
import { monthToEmiDate } from "@/utils/dateUtils";
import { toast } from "sonner";

interface ApplicationDetailsPanelProps {
  application: Application;
  onClose: () => void;
  onSave: (updatedApplication: Application) => void;
  onDataChanged: () => void;
  selectedEmiMonth?: string | null;
}

const ApplicationDetailsPanel: React.FC<ApplicationDetailsPanelProps> = ({
  application,
  onClose,
  onSave,
  onDataChanged,
  selectedEmiMonth
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [currentSelectedMonth, setCurrentSelectedMonth] = useState<string>('');

  // Fetch monthly data for this application
  const { 
    availableMonths, 
    availableMonthsFormatted, 
    loading: monthlyLoading,
    getApplicationForMonth,
    refetch: refetchMonthly 
  } = useMonthlyApplicationData(application.applicant_id);

  // Initialize current month
  useEffect(() => {
    if (availableMonths.length > 0 && !currentSelectedMonth) {
      // Default to the latest month or the passed selectedEmiMonth
      const defaultMonth = selectedEmiMonth || availableMonths[availableMonths.length - 1];
      setCurrentSelectedMonth(defaultMonth);
      console.log('Setting default month:', defaultMonth);
    }
  }, [availableMonths, selectedEmiMonth, currentSelectedMonth]);

  // Fetch data hooks with month filtering
  const { auditLogs, loading: auditLoading, addAuditLog, refetch: refetchAuditLogs } = useAuditLogs(
    application.applicant_id, 
    currentSelectedMonth
  );

  const { callingLogs, loading: callingLoading, addCallingLog, refetch: refetchCallingLogs } = useCallingLogs(
    application.applicant_id, 
    currentSelectedMonth
  );

  const { repaymentHistory, loading: repaymentLoading } = useRepaymentHistory(application.applicant_id);

  const { fetchComments, addComment, loading: commentsLoading } = useComments(currentSelectedMonth);

  // State for comments
  const [comments, setComments] = useState<any[]>([]);

  // Fetch comments when month changes
  useEffect(() => {
    const loadComments = async () => {
      if (currentSelectedMonth && application.applicant_id) {
        console.log('Loading comments for:', { applicationId: application.applicant_id, month: currentSelectedMonth });
        try {
          const fetchedComments = await fetchComments(application.applicant_id);
          setComments(fetchedComments);
        } catch (error) {
          console.error('Error loading comments:', error);
          setComments([]);
        }
      }
    };

    loadComments();
  }, [currentSelectedMonth, application.applicant_id, fetchComments]);

  // Handle month change
  const handleMonthChange = (newMonth: string) => {
    console.log('Month changed to:', newMonth);
    setCurrentSelectedMonth(newMonth);
  };

  // Handle vehicle status change
  const handleVehicleStatusChange = async (newStatus: string) => {
    try {
      const currentStatus = application.vehicle_status || 'None';
      console.log('Vehicle status change:', { from: currentStatus, to: newStatus });
      
      // Add audit log
      await addAuditLog(
        application.applicant_id,
        'Vehicle Status',
        currentStatus,
        newStatus,
        currentSelectedMonth ? monthToEmiDate(currentSelectedMonth) : undefined
      );
      
      // Update application
      const updatedApplication = { ...application, vehicle_status: newStatus };
      onSave(updatedApplication);
      onDataChanged();
      
      toast.success('Vehicle status updated successfully');
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      toast.error('Failed to update vehicle status');
    }
  };

  // Handle calling status change
  const handleCallingStatusChange = async (contactType: string, newStatus: string, currentStatus?: string) => {
    try {
      console.log('Calling status change:', { contactType, from: currentStatus, to: newStatus });
      
      // Add calling log
      await addCallingLog(contactType, currentStatus || 'Not Called', newStatus);
      
      onDataChanged();
      toast.success(`${contactType.replace('_', ' ')} status updated successfully`);
    } catch (error) {
      console.error('Error updating calling status:', error);
      toast.error(`Failed to update ${contactType.replace('_', ' ')} status`);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    try {
      console.log('Status change:', { applicationId: application.applicant_id, newStatus, month: currentSelectedMonth });
      onDataChanged();
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Handle PTP date change
  const handlePtpDateChange = async (newPtpDate: string | null) => {
    try {
      console.log('PTP date change:', { applicationId: application.applicant_id, newPtpDate, month: currentSelectedMonth });
      onDataChanged();
      toast.success('PTP date updated successfully');
    } catch (error) {
      console.error('Error updating PTP date:', error);
      toast.error('Failed to update PTP date');
    }
  };

  // Handle add comment
  const handleAddComment = async (content: string) => {
    try {
      console.log('Adding comment:', { applicationId: application.applicant_id, content, month: currentSelectedMonth });
      
      const demandDate = currentSelectedMonth ? monthToEmiDate(currentSelectedMonth) : undefined;
      await addComment(application.applicant_id, content, demandDate);
      
      // Refresh comments
      const updatedComments = await fetchComments(application.applicant_id);
      setComments(updatedComments);
      
      onDataChanged();
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Get monthly data for current month
  const monthlyData = currentSelectedMonth ? getApplicationForMonth(currentSelectedMonth) : null;

  return (
    <div className="bg-white shadow-lg border-l border-gray-200 h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 border-b border-gray-200 p-4">
        <ApplicationHeader 
          application={application}
        />
      </div>

      {/* Month Selector - Fixed */}
      {availableMonths.length > 0 && (
        <div className="flex-shrink-0 border-b border-gray-200">
          <MonthSelector
            availableMonths={availableMonths}
            availableMonthsFormatted={availableMonthsFormatted}
            selectedMonth={currentSelectedMonth}
            onMonthChange={handleMonthChange}
            loading={monthlyLoading}
          />
        </div>
      )}

      {/* Scrollable Content Area - Fixed CSS */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <TabsContent value="details" className="mt-0">
                <DetailsTab 
                  application={application}
                  repaymentHistory={repaymentHistory}
                  auditLogs={auditLogs}
                  onVehicleStatusChange={handleVehicleStatusChange}
                  monthlyData={availableMonths.map(month => getApplicationForMonth(month)).filter(Boolean)}
                />
              </TabsContent>

              <TabsContent value="contacts" className="mt-0">
                <ContactsTab 
                  application={application}
                  callingLogs={callingLogs}
                  onCallingStatusChange={handleCallingStatusChange}
                  selectedMonth={currentSelectedMonth}
                />
              </TabsContent>

              <TabsContent value="status" className="mt-0">
                <StatusTab 
                  application={application}
                  auditLogs={auditLogs}
                  onStatusChange={handleStatusChange}
                  onPtpDateChange={handlePtpDateChange}
                  addAuditLog={addAuditLog}
                  selectedMonth={currentSelectedMonth}
                />
              </TabsContent>

              <TabsContent value="comments" className="mt-0">
                <CommentsTab 
                  comments={comments}
                  onAddComment={handleAddComment}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailsPanel;
