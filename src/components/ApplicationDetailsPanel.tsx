
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Application } from "@/types/application";
import { useComments } from "@/hooks/useComments";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useCallingLogs } from "@/hooks/useCallingLogs";
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

  const { comments, addComment } = useComments(application?.applicant_id);
  const { auditLogs, addAuditLog } = useAuditLogs(application?.applicant_id);
  const { callingLogs, addCallingLog } = useCallingLogs(application?.applicant_id);

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
    <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] md:w-[600px] bg-white shadow-lg border-l z-50 overflow-y-auto">
      <div className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold">Application Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ApplicationHeader application={application} />

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
