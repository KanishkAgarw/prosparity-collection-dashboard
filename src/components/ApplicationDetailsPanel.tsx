
import { useState } from "react";
import { X, Calendar, User, FileText, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Application } from "@/types/application";
import { useComments } from "@/hooks/useComments";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface ApplicationDetailsPanelProps {
  application: Application | null;
  onClose: () => void;
  onSave: () => void;
}

const ApplicationDetailsPanel = ({ application, onClose, onSave }: ApplicationDetailsPanelProps) => {
  const { user } = useAuth();
  const [editedApp, setEditedApp] = useState<Application | null>(null);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  const { comments, addComment } = useComments(application?.applicationId);
  const { auditLogs, addAuditLog } = useAuditLogs(application?.applicationId);

  if (!application) return null;

  const currentApp = editedApp || application;

  const handleSave = async () => {
    if (!editedApp || !user) return;
    
    setSaving(true);
    try {
      console.log('Saving application changes:', editedApp);

      // Update the application in the database
      const { error } = await supabase
        .from('applications')
        .update({
          status: editedApp.status,
          ptp_date: editedApp.ptpDate || null,
          updated_at: new Date().toISOString()
        })
        .eq('application_id', editedApp.applicationId);

      if (error) {
        console.error('Error updating application:', error);
        toast.error('Failed to save changes');
        return;
      }

      // Create audit logs for changes
      if (editedApp.status !== application.status) {
        await addAuditLog('Status', application.status, editedApp.status);
      }

      if (editedApp.ptpDate !== application.ptpDate) {
        await addAuditLog('PTP Date', application.ptpDate || 'Not set', editedApp.ptpDate || 'Not set');
      }

      console.log('Application saved successfully');
      toast.success('Changes saved successfully');
      setEditedApp(null);
      onSave();
    } catch (error) {
      console.error('Error saving application:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await addComment(newComment);
      setNewComment("");
      toast.success('Comment added successfully');
    }
  };

  const updateField = (field: keyof Application, value: any) => {
    setEditedApp(prev => ({
      ...(prev || application),
      [field]: value
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatPtpDate = (ptpDate?: string) => {
    if (!ptpDate) return "NA";
    try {
      return format(new Date(ptpDate), 'dd/MM/yyyy');
    } catch {
      return "NA";
    }
  };

  const getLogsForSection = (section: string) => {
    const sectionFields = {
      'Status and Amount': ['Status', 'Amount Paid'],
      'PTP Date': ['PTP Date']
    };
    
    const logs = auditLogs.filter(log => 
      sectionFields[section as keyof typeof sectionFields]?.includes(log.field)
    ) || [];
    
    return logs;
  };

  const SectionCard = ({ title, logs, children }: { title: string; logs: any[]; children: React.ReactNode }) => {
    const recentLogs = logs.slice(0, 2);
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{title}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{logs.length} logs</span>
              {logs.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All Logs
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{title} - Audit Trail ({logs.length} entries)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      {logs.map((log) => (
                        <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm">User</span>
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{log.field}</span> changed
                            <div className="mt-1 text-xs text-gray-600">
                              From: <span className="bg-red-100 px-1 rounded">{log.previous_value}</span>
                              {" → "}
                              To: <span className="bg-green-100 px-1 rounded">{log.new_value}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {children}
            {recentLogs.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 mb-2">Recent Changes:</p>
                <div className="space-y-2">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="text-xs border-l-2 border-blue-200 pl-2 py-1 bg-blue-50">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{log.field}</span>
                        <span className="text-gray-500">by User</span>
                      </div>
                      <div className="text-gray-400">{formatDate(log.created_at)}</div>
                      <div className="text-xs mt-1">
                        <span className="bg-red-100 px-1 rounded">{log.previous_value}</span>
                        {" → "}
                        <span className="bg-green-100 px-1 rounded">{log.new_value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {logs.length === 0 && (
              <div className="text-xs text-gray-400 italic">No changes recorded yet</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg border-l z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Application Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Applicant ID and Name Header */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-blue-900">{application.applicantName}</h3>
              <p className="text-sm text-blue-700">ID: {application.applicationId}</p>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <SectionCard title="Status and Amount Paid" logs={getLogsForSection('Status and Amount')}>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={currentApp.status} onValueChange={(value) => updateField('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        {/* PTP Date Section */}
        <SectionCard title="PTP Date" logs={getLogsForSection('PTP Date')}>
          <div>
            <Label htmlFor="ptpDate">Promise to Pay Date</Label>
            <Input
              id="ptpDate"
              type="date"
              value={currentApp.ptpDate || ''}
              onChange={(e) => updateField('ptpDate', e.target.value)}
            />
            {currentApp.ptpDate && (
              <p className="text-xs text-gray-500 mt-1">
                Formatted: {formatPtpDate(currentApp.ptpDate)}
              </p>
            )}
          </div>
        </SectionCard>

        {/* Comments Section */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Comments</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div>
                <Label htmlFor="newComment">Add Comment</Label>
                <Textarea
                  id="newComment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your comment here..."
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={handleAddComment} 
                  className="mt-2 w-full"
                  size="sm"
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </Button>
              </div>
              {comments.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-3">All Comments:</p>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {comment.user_email || 'Unknown User'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-800">
                              {comment.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {comments.length === 0 && (
                <div className="text-xs text-gray-400 italic">No comments added yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          className="w-full"
          disabled={!editedApp || saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default ApplicationDetailsPanel;
