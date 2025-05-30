
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Application } from "@/types/application";
import { useComments } from "@/hooks/useComments";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useCallingLogs } from "@/hooks/useCallingLogs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ApplicationHeader from "./details/ApplicationHeader";
import ContactsTab from "./details/ContactsTab";
import StatusTab from "./details/StatusTab";
import CommentsTab from "./details/CommentsTab";

interface ApplicationDetailsPanelProps {
  application: Application | null;
  onClose: () => void;
  onSave: (updatedApp: Application) => void;
}

const ApplicationDetailsPanel = ({ application, onClose, onSave }: ApplicationDetailsPanelProps) => {
  const { user } = useAuth();

  const { comments, addComment } = useComments(application?.applicant_id);
  const { auditLogs, addAuditLog } = useAuditLogs(application?.applicant_id);
  const { callingLogs, addCallingLog } = useCallingLogs(application?.applicant_id);

  if (!application) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (!user || newStatus === application.status) return;
    
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('applicant_id', application.applicant_id);

      if (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update status');
        return;
      }

      // Add audit log
      await addAuditLog('Status', application.status, newStatus);

      // Optimistic update
      const updatedApp = {
        ...application,
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      onSave(updatedApp);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePtpDateChange = async (newDate: string) => {
    if (!user || newDate === application.ptp_date) return;
    
    try {
      const updateData = {
        ptp_date: newDate || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('applicant_id', application.applicant_id);

      if (error) {
        console.error('Error updating PTP date:', error);
        toast.error('Failed to update PTP date');
        return;
      }

      // Add audit log
      await addAuditLog('PTP Date', application.ptp_date || 'Not set', newDate || 'Not set');

      // Optimistic update
      const updatedApp = {
        ...application,
        ptp_date: newDate || null,
        updated_at: new Date().toISOString()
      };
      
      onSave(updatedApp);
      toast.success('PTP date updated successfully');
    } catch (error) {
      console.error('Error updating PTP date:', error);
      toast.error('Failed to update PTP date');
    }
  };

  const handleCallingStatusChange = async (contactType: string, newStatus: string, currentStatus?: string) => {
    if (!user) return;
    
    const previousStatus = currentStatus || "Not Called";
    
    try {
      // Update the specific calling status field in the database
      const fieldMap = {
        'Applicant': 'applicant_calling_status',
        'Co-Applicant': 'co_applicant_calling_status', 
        'Guarantor': 'guarantor_calling_status',
        'Reference': 'reference_calling_status'
      };

      const fieldName = fieldMap[contactType as keyof typeof fieldMap];
      
      const updateData = {
        [fieldName]: newStatus,
        latest_calling_status: newStatus,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('applicant_id', application.applicant_id);

      if (error) {
        console.error('Error updating calling status:', error);
        toast.error('Failed to update calling status');
        return;
      }

      // Add calling log
      await addCallingLog(contactType, previousStatus, newStatus);
      
      // Add audit log
      await addAuditLog(`${contactType} Calling Status`, previousStatus, newStatus);

      // Optimistic update - update local state and notify parent
      const updatedApp = {
        ...application,
        [fieldName]: newStatus,
        latest_calling_status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      onSave(updatedApp);
      toast.success('Calling status updated successfully');
    } catch (error) {
      console.error('Error updating calling status:', error);
      toast.error('Failed to update calling status');
    }
  };

  const handleAddComment = async (content: string) => {
    await addComment(content);
    toast.success('Comment added successfully');
  };

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] md:w-[600px] bg-white shadow-lg border-l z-50 overflow-y-auto">
      <div className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold">Application Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ApplicationHeader application={application} />

        {/* Tabbed Interface with reordered tabs */}
        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm mb-4">
            <TabsTrigger value="contacts" className="px-1 py-2 sm:px-3">Contacts</TabsTrigger>
            <TabsTrigger value="status" className="px-1 py-2 sm:px-3">Status</TabsTrigger>
            <TabsTrigger value="comments" className="px-1 py-2 sm:px-3">Comments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contacts" className="space-y-4 mt-4">
            <ContactsTab 
              application={application}
              callingLogs={callingLogs}
              onCallingStatusChange={handleCallingStatusChange}
            />
          </TabsContent>

          <TabsContent value="status" className="space-y-4 mt-4">
            <StatusTab 
              application={application}
              auditLogs={auditLogs}
              onStatusChange={handleStatusChange}
              onPtpDateChange={handlePtpDateChange}
            />
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 mt-4">
            <CommentsTab 
              comments={comments}
              onAddComment={handleAddComment}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApplicationDetailsPanel;
