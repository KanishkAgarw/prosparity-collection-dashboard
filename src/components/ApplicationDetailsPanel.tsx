
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
import { useCallingLogs } from "@/hooks/useCallingLogs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatEmiMonth, formatCurrency, formatPtpDate } from "@/utils/formatters";
import CallButton from "./CallButton";
import FiLocationButton from "./FiLocationButton";
import CallStatusSelector from "./CallStatusSelector";

interface ApplicationDetailsPanelProps {
  application: Application | null;
  onClose: () => void;
  onSave: (updatedApp: Application) => void;
}

const ApplicationDetailsPanel = ({ application, onClose, onSave }: ApplicationDetailsPanelProps) => {
  const { user } = useAuth();
  const [editedApp, setEditedApp] = useState<Application | null>(null);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  const { comments, addComment } = useComments(application?.applicant_id);
  const { auditLogs, addAuditLog } = useAuditLogs(application?.applicant_id);
  const { callingLogs, addCallingLog } = useCallingLogs(application?.applicant_id);

  if (!application) return null;

  const currentApp = editedApp || application;

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
        ...(editedApp || application),
        [fieldName]: newStatus,
        latest_calling_status: newStatus
      };
      
      setEditedApp(updatedApp);
      onSave(updatedApp);

      toast.success('Calling status updated successfully');
    } catch (error) {
      console.error('Error updating calling status:', error);
      toast.error('Failed to update calling status');
    }
  };

  const handleSave = async () => {
    if (!editedApp || !user) return;
    
    setSaving(true);
    try {
      console.log('Saving application changes:', editedApp);

      // Prepare update data
      const updateData: any = {
        status: editedApp.status,
        ptp_date: editedApp.ptp_date || null,
        updated_at: new Date().toISOString()
      };

      // Update the application in the database
      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('applicant_id', editedApp.applicant_id);

      if (error) {
        console.error('Error updating application:', error);
        toast.error('Failed to save changes');
        return;
      }

      // Create audit logs for changes
      if (editedApp.status !== application.status) {
        await addAuditLog('Status', application.status, editedApp.status);
      }

      if (editedApp.ptp_date !== application.ptp_date) {
        await addAuditLog('PTP Date', application.ptp_date || 'Not set', editedApp.ptp_date || 'Not set');
      }

      console.log('Application saved successfully');
      toast.success('Changes saved successfully');
      
      // Notify parent with updated application for optimistic update
      onSave(editedApp);
      setEditedApp(null);
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

  const formatAuditValue = (value: string | null, field: string) => {
    if (!value) return "Not set";
    
    if (field === 'PTP Date' && value !== 'Not set') {
      try {
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
    <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] md:w-[600px] bg-white shadow-lg border-l z-50 overflow-y-auto">
      <div className="p-3 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold">Application Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Applicant Name and EMI Month Header */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base sm:text-lg text-blue-900 break-words">{application.applicant_name}</h3>
              <p className="text-xs sm:text-sm text-blue-700 break-words">EMI Month: {formatEmiMonth(application.demand_date)}</p>
              <p className="text-xs sm:text-sm text-blue-600 mt-1">EMI Due: {formatCurrency(application.emi_amount)}</p>
            </div>
          </div>
        </div>

        {/* Tabbed Interface with better mobile layout */}
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm mb-4">
            <TabsTrigger value="status" className="px-1 py-2 sm:px-3">Status</TabsTrigger>
            <TabsTrigger value="contacts" className="px-1 py-2 sm:px-3">Contacts</TabsTrigger>
            <TabsTrigger value="comments" className="px-1 py-2 sm:px-3">Comments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4 mt-4">
            {/* Status Section with improved mobile layout */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-sm">Status & Payment</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{statusAndPtpLogs.length} logs</span>
                    {statusAndPtpLogs.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs">
                            View Logs
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-sm sm:text-base">Audit Trail ({statusAndPtpLogs.length} entries)</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            {statusAndPtpLogs.map((log) => (
                              <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium text-sm">{log.user_name || 'Unknown User'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">{formatDateTime(log.created_at)}</span>
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">{log.field}</span> changed
                                  <div className="mt-1 text-xs text-gray-600">
                                    From: <span className="bg-red-100 px-1 rounded break-all">{formatAuditValue(log.previous_value, log.field)}</span>
                                    {" → "}
                                    To: <span className="bg-green-100 px-1 rounded break-all">{formatAuditValue(log.new_value, log.field)}</span>
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
                  <Label htmlFor="ptpDate">Promise to Pay Date</Label>
                  <Input
                    id="ptpDate"
                    type="date"
                    value={currentApp.ptp_date || ''}
                    onChange={(e) => updateField('ptp_date', e.target.value)}
                  />
                  {currentApp.ptp_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Formatted: {formatPtpDate(currentApp.ptp_date)}
                    </p>
                  )}
                </div>

                {/* Recent Changes with better mobile layout */}
                {statusAndPtpLogs.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 mb-2">Recent Changes:</p>
                    <div className="space-y-2">
                      {statusAndPtpLogs.slice(0, 2).map((log) => (
                        <div key={log.id} className="text-xs border-l-2 border-blue-200 pl-2 py-1 bg-blue-50">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span className="font-medium">{log.field}</span>
                            <span className="text-gray-500">by {log.user_name || 'Unknown User'}</span>
                          </div>
                          <div className="text-gray-400">{formatDateTime(log.created_at)}</div>
                          <div className="text-xs mt-1 break-words">
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

          <TabsContent value="contacts" className="space-y-4 mt-4">
            {/* Contact Information Section with improved mobile layout */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-sm">Contact Information</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{callingLogs.length} calls</span>
                    {callingLogs.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs">
                            Call History
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-sm sm:text-base">Call History ({callingLogs.length} entries)</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            {callingLogs.map((log) => (
                              <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium text-sm">{log.user_name || 'Unknown User'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">{formatDateTime(log.created_at)}</span>
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">{log.contact_type}</span> calling status changed
                                  <div className="mt-1 text-xs text-gray-600 break-words">
                                    From: <span className="bg-red-100 px-1 rounded">{log.previous_status || 'Not Called'}</span>
                                    {" → "}
                                    To: <span className="bg-green-100 px-1 rounded">{log.new_status}</span>
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
                {/* Applicant Contact with improved mobile layout */}
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm">Applicant</h4>
                      <p className="text-sm text-gray-600 break-words">{application.applicant_name}</p>
                      {application.applicant_mobile && (
                        <p className="text-xs text-gray-500 break-all">{application.applicant_mobile}</p>
                      )}
                    </div>
                    <CallButton 
                      name="Call" 
                      phone={application.applicant_mobile}
                      variant="outline"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">Status:</span>
                    <CallStatusSelector
                      currentStatus={currentApp.applicant_calling_status}
                      onStatusChange={(status) => handleCallingStatusChange('Applicant', status, currentApp.applicant_calling_status)}
                    />
                  </div>
                </div>

                {/* Co-Applicant Contact with improved mobile layout */}
                {application.co_applicant_name && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">Co-Applicant</h4>
                        <p className="text-sm text-gray-600 break-words">{application.co_applicant_name}</p>
                        {application.co_applicant_mobile && (
                          <p className="text-xs text-gray-500 break-all">{application.co_applicant_mobile}</p>
                        )}
                      </div>
                      <CallButton 
                        name="Call" 
                        phone={application.co_applicant_mobile}
                        variant="outline"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">Status:</span>
                      <CallStatusSelector
                        currentStatus={currentApp.co_applicant_calling_status}
                        onStatusChange={(status) => handleCallingStatusChange('Co-Applicant', status, currentApp.co_applicant_calling_status)}
                      />
                    </div>
                  </div>
                )}

                {/* Guarantor Contact with improved mobile layout */}
                {application.guarantor_name && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">Guarantor</h4>
                        <p className="text-sm text-gray-600 break-words">{application.guarantor_name}</p>
                        {application.guarantor_mobile && (
                          <p className="text-xs text-gray-500 break-all">{application.guarantor_mobile}</p>
                        )}
                      </div>
                      <CallButton 
                        name="Call" 
                        phone={application.guarantor_mobile}
                        variant="outline"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">Status:</span>
                      <CallStatusSelector
                        currentStatus={currentApp.guarantor_calling_status}
                        onStatusChange={(status) => handleCallingStatusChange('Guarantor', status, currentApp.guarantor_calling_status)}
                      />
                    </div>
                  </div>
                )}

                {/* Reference Contact with improved mobile layout */}
                {application.reference_name && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">Reference</h4>
                        <p className="text-sm text-gray-600 break-words">{application.reference_name}</p>
                        {application.reference_mobile && (
                          <p className="text-xs text-gray-500 break-all">{application.reference_mobile}</p>
                        )}
                      </div>
                      <CallButton 
                        name="Call" 
                        phone={application.reference_mobile}
                        variant="outline"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">Status:</span>
                      <CallStatusSelector
                        currentStatus={currentApp.reference_calling_status}
                        onStatusChange={(status) => handleCallingStatusChange('Reference', status, currentApp.reference_calling_status)}
                      />
                    </div>
                  </div>
                )}

                {/* FI Location with improved mobile layout */}
                {application.fi_location && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">FI Submission Location</h4>
                        <p className="text-xs text-gray-600">View location on map</p>
                      </div>
                      <FiLocationButton fiLocation={application.fi_location} />
                    </div>
                  </div>
                )}

                {/* Recent Calling Activity with improved mobile layout */}
                {callingLogs.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 mb-2">Recent Activity:</p>
                    <div className="space-y-2">
                      {callingLogs.slice(0, 3).map((log) => (
                        <div key={log.id} className="text-xs border-l-2 border-green-200 pl-2 py-1 bg-green-50">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span className="font-medium">{log.contact_type}</span>
                            <span className="text-gray-500">by {log.user_name || 'Unknown User'}</span>
                          </div>
                          <div className="text-gray-400">{formatDateTime(log.created_at)}</div>
                          <div className="text-xs mt-1 break-words">
                            <span className="bg-red-100 px-1 rounded">{log.previous_status || 'Not Called'}</span>
                            {" → "}
                            <span className="bg-green-100 px-1 rounded">{log.new_status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!application.co_applicant_name && !application.guarantor_name && !application.reference_name && !application.fi_location && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No additional contacts available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 mt-4">
            {/* Comments Section with improved mobile layout */}
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
                      className="min-h-[80px] resize-none text-sm"
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
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {comments.map((comment) => (
                          <div key={comment.id} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                                  <span className="font-medium text-xs sm:text-sm text-blue-700">
                                    {comment.user_name || 'Unknown User'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDateTime(comment.created_at)}
                                  </span>
                                </div>
                                <div className="text-xs sm:text-sm text-gray-800 leading-relaxed break-words">
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
          className="w-full mt-4 sm:mt-6"
          disabled={!editedApp || saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default ApplicationDetailsPanel;
