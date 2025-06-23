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

interface ApplicationDetailsPanelProps {
  application: Application | null;
  onClose: () => void;
  onSave: (updatedApp: Application) => void;
  onDataChanged?: () => void;
}

const ApplicationDetailsPanel = ({ application, onClose, onSave, onDataChanged }: ApplicationDetailsPanelProps) => {
  const { user } = useAuth();
  const [currentApplication, setCurrentApplication] = useState<Application | null>(application);

  useEffect(() => {
    setCurrentApplication(application);
  }, [application]);
  
  const { repaymentHistory } = useRepaymentHistory(currentApplication?.applicant_id);
  const { comments, fetchComments, addComment } = useComments();
  const { auditLogs, addAuditLog, refetch: refetchAuditLogs } = useAuditLogs(currentApplication?.applicant_id);
  const { callingLogs, addCallingLog, refetch: refetchCallingLogs } = useCallingLogs(currentApplication?.applicant_id);

  useEffect(() => {
    if (currentApplication?.applicant_id) {
      fetchComments(currentApplication.applicant_id);
    }
  }, [currentApplication?.applicant_id, fetchComments]);

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
  });

  if (!currentApplication) return null;

  const handleAddComment = async (content: string) => {
    if (currentApplication?.applicant_id) {
      await addComment(currentApplication.applicant_id, content);
      toast.success('Comment added');
      await onDataChanged?.();
    }
  };

  const handleVehicleStatusChange = async (newStatus: string) => {
    if (!currentApplication || !user) return;

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

      if (error) throw error;
      
      // Add to audit log on success
      await addAuditLog(
        originalApplication.applicant_id,
        'Vehicle Status',
        previousStatus,
        newStatus || 'None'
      );
      
      toast.success('Vehicle status updated successfully');
      // 3. Inform parent to refetch data to stay in sync with other components
      await onDataChanged?.();
    } catch (error) {
      console.error('Failed to update vehicle status:', error);
      toast.error('Failed to update status. Reverting change.');
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
        <ApplicationHeader application={currentApplication} />
      </div>

      <div className="flex-1 flex-col-min-h-0">
        <Tabs defaultValue="contacts" className="h-full flex flex-col">
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
              />
            </TabsContent>
            <TabsContent value="status" className="m-0">
              <StatusTab 
                application={currentApplication}
                auditLogs={auditLogs}
                onStatusChange={handleStatusChange}
                onPtpDateChange={handlePtpDateChange}
                addAuditLog={addAuditLog}
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
                application={currentApplication}
                repaymentHistory={repaymentHistory}
                auditLogs={auditLogs}
                onVehicleStatusChange={handleVehicleStatusChange}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ApplicationDetailsPanel;
