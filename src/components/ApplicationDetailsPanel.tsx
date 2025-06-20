
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
import { useApplicationHandlers } from "./details/ApplicationHandlers";
import { useEffect } from "react";

interface ApplicationDetailsPanelProps {
  application: Application | null;
  onClose: () => void;
  onSave: (updatedApp: Application) => void;
  onDataChanged?: () => void;
}

const ApplicationDetailsPanel = ({ application, onClose, onSave, onDataChanged }: ApplicationDetailsPanelProps) => {
  const { user } = useAuth();

  const { comments, fetchComments, addComment } = useComments();
  const { auditLogs, addAuditLog, refetch: refetchAuditLogs } = useAuditLogs(application?.applicant_id);
  const { callingLogs, addCallingLog, refetch: refetchCallingLogs } = useCallingLogs(application?.applicant_id);

  // Fetch comments when application changes
  useEffect(() => {
    if (application?.applicant_id) {
      fetchComments(application.applicant_id);
    }
  }, [application?.applicant_id, fetchComments]);

  // Set up ENHANCED real-time updates with immediate and aggressive refresh logic
  useRealtimeUpdates({
    onCallingLogUpdate: () => {
      console.log('📞 Real-time: Calling log updated');
      refetchCallingLogs();
      onDataChanged?.();
    },
    onAuditLogUpdate: () => {
      console.log('📋 Real-time: Audit log updated - refreshing immediately');
      refetchAuditLogs();
      onDataChanged?.();
    },
    onCommentUpdate: () => {
      console.log('💬 Real-time: Comment updated');
      if (application?.applicant_id) {
        fetchComments(application.applicant_id);
      }
      onDataChanged?.();
    },
    onApplicationUpdate: () => {
      console.log('🔄 Real-time: Application updated - triggering main list refresh');
      onDataChanged?.();
    },
    onPtpDateUpdate: () => {
      console.log('📅 Real-time: PTP date updated - triggering comprehensive refresh');
      refetchAuditLogs(); // Refresh audit logs to show PTP changes
      onDataChanged?.(); // Refresh main list immediately
      // Additional refresh after a short delay to ensure consistency
      setTimeout(() => {
        console.log('📅 Delayed refresh for PTP consistency');
        onDataChanged?.();
      }, 1000);
    }
  });

  const {
    handleStatusChange,
    handlePtpDateChange,
    handleCallingStatusChange
  } = useApplicationHandlers(application, user, addAuditLog, addCallingLog, (updatedApp) => {
    console.log('🔄 Application saved, triggering immediate data refresh');
    onSave(updatedApp);
    onDataChanged?.();
    // Additional refresh for PTP changes to ensure main list updates
    setTimeout(() => {
      console.log('🔄 Additional refresh to ensure main list consistency');
      onDataChanged?.();
    }, 500);
  });

  if (!application) return null;

  const handleAddComment = async (content: string) => {
    if (application?.applicant_id) {
      await addComment(application.applicant_id, content);
      toast.success('Comment added successfully');
      onDataChanged?.();
    }
  };

  return (
    <div className="fixed inset-0 sm:right-0 sm:top-0 sm:left-auto h-full w-full sm:w-[500px] md:w-[600px] bg-white shadow-xl border-l z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold">Application Details</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="hover:bg-gray-100 rounded-full h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ApplicationHeader application={application} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="contacts" className="h-full flex flex-col">
          <div className="flex-shrink-0 px-4 sm:px-6 pt-3 sm:pt-4">
            <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm h-8 sm:h-10">
              <TabsTrigger value="contacts" className="px-2 py-1 sm:px-3 sm:py-2">Contacts</TabsTrigger>
              <TabsTrigger value="status" className="px-2 py-1 sm:px-3 sm:py-2">Status</TabsTrigger>
              <TabsTrigger value="comments" className="px-2 py-1 sm:px-3 sm:py-2">Comments</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="contacts" className="space-y-3 p-4 sm:p-6 pt-3 sm:pt-4 m-0">
              <ContactsTab 
                application={application}
                callingLogs={callingLogs}
                onCallingStatusChange={handleCallingStatusChange}
              />
            </TabsContent>

            <TabsContent value="status" className="space-y-3 p-4 sm:p-6 pt-3 sm:pt-4 m-0">
              <StatusTab 
                application={application}
                auditLogs={auditLogs}
                onStatusChange={handleStatusChange}
                onPtpDateChange={handlePtpDateChange}
              />
            </TabsContent>

            <TabsContent value="comments" className="space-y-3 p-4 sm:p-6 pt-3 sm:pt-4 m-0">
              <CommentsTab 
                comments={comments}
                onAddComment={handleAddComment}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ApplicationDetailsPanel;
