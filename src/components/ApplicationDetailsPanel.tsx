
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

interface ApplicationDetailsPanelProps {
  application: Application | null;
  onClose: () => void;
  onSave: (updatedApp: Application) => void;
}

const ApplicationDetailsPanel = ({ application, onClose, onSave }: ApplicationDetailsPanelProps) => {
  const { user } = useAuth();

  const { comments, addComment, refetch: refetchComments } = useComments(application?.applicant_id);
  const { auditLogs, addAuditLog, refetch: refetchAuditLogs } = useAuditLogs(application?.applicant_id);
  const { callingLogs, addCallingLog, refetch: refetchCallingLogs } = useCallingLogs(application?.applicant_id);

  // Set up real-time updates
  useRealtimeUpdates({
    onCallingLogUpdate: refetchCallingLogs,
    onAuditLogUpdate: refetchAuditLogs,
    onCommentUpdate: refetchComments
  });

  const {
    handleStatusChange,
    handlePtpDateChange,
    handleCallingStatusChange
  } = useApplicationHandlers(application, user, addAuditLog, addCallingLog, onSave);

  if (!application) return null;

  const handleAddComment = async (content: string) => {
    await addComment(content);
    toast.success('Comment added successfully');
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
