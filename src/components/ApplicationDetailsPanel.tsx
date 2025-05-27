
import { useState } from "react";
import { X, Calendar, User, FileText, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [amountPaid, setAmountPaid] = useState("");
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

      // Prepare update data
      const updateData: any = {
        status: editedApp.status,
        ptp_date: editedApp.ptpDate || null,
        updated_at: new Date().toISOString()
      };

      // Add amount paid if it was entered
      if (amountPaid && !isNaN(Number(amountPaid))) {
        updateData.amount_paid = Number(amountPaid);
      }

      // Update the application in the database
      const { error } = await supabase
        .from('applications')
        .update(updateData)
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

      if (amountPaid && !isNaN(Number(amountPaid))) {
        const previousAmount = application.amountPaid || 0;
        const newAmount = Number(amountPaid);
        await addAuditLog('Amount Paid', `₹${previousAmount.toLocaleString('en-IN')}`, `₹${newAmount.toLocaleString('en-IN')}`);
      }

      console.log('Application saved successfully');
      toast.success('Changes saved successfully');
      setEditedApp(null);
      setAmountPaid("");
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

  // Format datetime with DD-MMM-YY date
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  const formatPtpDate = (ptpDate?: string) => {
    if (!ptpDate) return "NA";
    try {
      return format(new Date(ptpDate), 'dd-MMM-yy');
    } catch {
      return "NA";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format audit log values, especially for PTP dates and amounts
  const formatAuditValue = (value: string | null, field: string) => {
    if (!value) return "Not set";
    
    // If the field is PTP Date and the value looks like a date, format it
    if (field === 'PTP Date' && value !== 'Not set') {
      try {
        // Handle ISO date strings
        if (value.includes('T') || value.includes('-')) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return format(date, 'dd-MMM-yy');
          }
        }
        return value;
      } catch {
        return value;
      }
    }
    
    return value;
  };

  const getLogsForSection = (section: string) => {
    const sectionFields = {
      'Status and PTP': ['Status', 'PTP Date', 'Amount Paid']
    };
    
    const logs = auditLogs.filter(log => 
      sectionFields[section as keyof typeof sectionFields]?.includes(log.field)
    ) || [];
    
    return logs;
  };

  const statusAndPtpLogs = getLogsForSection('Status and PTP');

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] bg-white shadow-lg border-l z-50 overflow-y-auto">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold">Application Details</h2>
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
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg text-blue-900 truncate">{application.applicantName}</h3>
              <p className="text-sm text-blue-700 truncate">ID: {application.applicationId}</p>
              <p className="text-sm text-blue-600 mt-1">EMI Due: {formatCurrency(application.emiDue)}</p>
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Status & Payment</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            {/* Status Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Status, Payment & PTP Date</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{statusAndPtpLogs.length} logs</span>
                    {statusAndPtpLogs.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs">
                            View All Logs
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Status & Payment - Audit Trail ({statusAndPtpLogs.length} entries)</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            {statusAndPtpLogs.map((log) => (
                              <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium text-sm">{log.user_email || 'Unknown User'}</span>
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{formatDateTime(log.created_at)}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">{log.field}</span> changed
                                  <div className="mt-1 text-xs text-gray-600">
                                    From: <span className="bg-red-100 px-1 rounded">{formatAuditValue(log.previous_value, log.field)}</span>
                                    {" → "}
                                    To: <span className="bg-green-100 px-1 rounded">{formatAuditValue(log.new_value, log.field)}</span>
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
              <CardContent className="pt-0 space-y-4">
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

                <div>
                  <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    placeholder="Enter amount paid"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    min="0"
                    step="1"
                  />
                  {application.amountPaid && (
                    <p className="text-xs text-gray-500 mt-1">
                      Previous: {formatCurrency(application.amountPaid || 0)}
                    </p>
                  )}
                </div>

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

                {/* Recent Changes */}
                {statusAndPtpLogs.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 mb-2">Recent Changes:</p>
                    <div className="space-y-2">
                      {statusAndPtpLogs.slice(0, 2).map((log) => (
                        <div key={log.id} className="text-xs border-l-2 border-blue-200 pl-2 py-1 bg-blue-50">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{log.field}</span>
                            <span className="text-gray-500">by {log.user_email || 'Unknown User'}</span>
                          </div>
                          <div className="text-gray-400">{formatDateTime(log.created_at)}</div>
                          <div className="text-xs mt-1">
                            <span className="bg-red-100 px-1 rounded">{formatAuditValue(log.previous_value, log.field)}</span>
                            {" → "}
                            <span className="bg-green-100 px-1 rounded">{formatAuditValue(log.new_value, log.field)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {statusAndPtpLogs.length === 0 && (
                  <div className="text-xs text-gray-400 italic">No changes recorded yet</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            {/* Comments Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Comments</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newComment">Add Comment</Label>
                    <Textarea
                      id="newComment"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add your comment here..."
                      className="min-h-[100px] resize-none"
                    />
                    <Button 
                      onClick={handleAddComment} 
                      className="mt-3 w-full"
                      size="sm"
                      disabled={!newComment.trim()}
                    >
                      Add Comment
                    </Button>
                  </div>
                  {comments.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">All Comments ({comments.length}):</p>
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {comments.map((comment) => (
                          <div key={comment.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-sm text-blue-700">
                                    {comment.user_email || 'Unknown User'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDateTime(comment.created_at)}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-800 leading-relaxed break-words">
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
                    <div className="text-sm text-gray-400 italic text-center py-8">No comments added yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          className="w-full mt-6"
          disabled={!editedApp || saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default ApplicationDetailsPanel;
