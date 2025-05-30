import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Calendar, DollarSign, User, MessageSquare, History } from "lucide-react";
import { Application } from "@/types/application";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatCurrency, formatPtpDate } from "@/utils/formatters";
import { useComments } from "@/hooks/useComments";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import ContactCard from "./ContactCard";

interface ApplicationDetailsPanelProps {
  application: Application;
  onClose: () => void;
  onSave: () => void;
}

const ApplicationDetailsPanel = ({ application, onClose, onSave }: ApplicationDetailsPanelProps) => {
  const { user } = useAuth();
  const { comments, addComment } = useComments(application.id);
  const { auditLogs } = useAuditLogs(application.id);
  
  const [editedApplication, setEditedApplication] = useState<Application>(application);
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<'details' | 'contacts' | 'comments' | 'logs'>('details');

  useEffect(() => {
    setEditedApplication(application);
  }, [application]);

  const handleSave = async () => {
    if (!user) return;

    try {
      const changes: Record<string, any> = {};
      const originalValues: Record<string, any> = {};

      // Compare fields and track changes
      Object.keys(editedApplication).forEach(key => {
        const typedKey = key as keyof Application;
        if (editedApplication[typedKey] !== application[typedKey]) {
          changes[key] = editedApplication[typedKey];
          originalValues[key] = application[typedKey];
        }
      });

      if (Object.keys(changes).length === 0) {
        toast.info("No changes to save");
        return;
      }

      // Update the application
      const { error } = await supabase
        .from('applications')
        .update(changes)
        .eq('id', application.id);

      if (error) throw error;

      // Create audit logs for each changed field
      for (const [field, newValue] of Object.entries(changes)) {
        await supabase
          .from('audit_logs')
          .insert({
            field,
            previous_value: originalValues[field]?.toString() || null,
            new_value: newValue?.toString() || null,
            application_id: application.id,
            user_id: user.id,
            user_email: user.email
          });
      }

      toast.success("Application updated successfully");
      onSave();
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error("Failed to update application");
    }
  };

  const handleFieldChange = (field: keyof Application, value: any) => {
    setEditedApplication(prev => ({ ...prev, [field]: value }));
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    await addComment(newComment);
    setNewComment("");
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-blue-50">
        <h2 className="text-xl font-semibold text-blue-900">Application Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        {[
          { id: 'details', label: 'Details', icon: User },
          { id: 'contacts', label: 'Contacts', icon: User },
          { id: 'comments', label: 'Comments', icon: MessageSquare },
          { id: 'logs', label: 'Audit Logs', icon: History }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="applicant_name">Applicant Name</Label>
                  <Input
                    id="applicant_name"
                    value={editedApplication.applicant_name}
                    onChange={(e) => handleFieldChange('applicant_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="applicant_id">Application ID</Label>
                  <Input
                    id="applicant_id"
                    value={editedApplication.applicant_id}
                    onChange={(e) => handleFieldChange('applicant_id', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="branch_name">Branch</Label>
                  <Input
                    id="branch_name"
                    value={editedApplication.branch_name}
                    onChange={(e) => handleFieldChange('branch_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="team_lead">Team Lead</Label>
                  <Input
                    id="team_lead"
                    value={editedApplication.team_lead}
                    onChange={(e) => handleFieldChange('team_lead', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rm_name">RM Name</Label>
                  <Input
                    id="rm_name"
                    value={editedApplication.rm_name}
                    onChange={(e) => handleFieldChange('rm_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dealer_name">Dealer</Label>
                  <Input
                    id="dealer_name"
                    value={editedApplication.dealer_name}
                    onChange={(e) => handleFieldChange('dealer_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lender_name">Lender</Label>
                  <Input
                    id="lender_name"
                    value={editedApplication.lender_name}
                    onChange={(e) => handleFieldChange('lender_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editedApplication.status}
                    onValueChange={(value) => handleFieldChange('status', value)}
                  >
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
              </div>
            </div>

            {/* Financial Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emi_amount">EMI Amount</Label>
                  <Input
                    id="emi_amount"
                    type="number"
                    value={editedApplication.emi_amount}
                    onChange={(e) => handleFieldChange('emi_amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="principle_due">Principal Due</Label>
                  <Input
                    id="principle_due"
                    type="number"
                    value={editedApplication.principle_due || 0}
                    onChange={(e) => handleFieldChange('principle_due', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="interest_due">Interest Due</Label>
                  <Input
                    id="interest_due"
                    type="number"
                    value={editedApplication.interest_due || 0}
                    onChange={(e) => handleFieldChange('interest_due', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="last_month_bounce">Last Month Bounce</Label>
                  <Input
                    id="last_month_bounce"
                    type="number"
                    value={editedApplication.last_month_bounce || 0}
                    onChange={(e) => handleFieldChange('last_month_bounce', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Important Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="demand_date">Demand Date</Label>
                  <Input
                    id="demand_date"
                    type="date"
                    value={editedApplication.demand_date?.split('T')[0] || ''}
                    onChange={(e) => handleFieldChange('demand_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ptp_date">PTP Date</Label>
                  <Input
                    id="ptp_date"
                    type="date"
                    value={editedApplication.ptp_date?.split('T')[0] || ''}
                    onChange={(e) => handleFieldChange('ptp_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="paid_date">Paid Date</Label>
                  <Input
                    id="paid_date"
                    type="date"
                    value={editedApplication.paid_date?.split('T')[0] || ''}
                    onChange={(e) => handleFieldChange('paid_date', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Comments */}
            <div>
              <Label htmlFor="rm_comments">RM Comments</Label>
              <Textarea
                id="rm_comments"
                value={editedApplication.rm_comments || ''}
                onChange={(e) => handleFieldChange('rm_comments', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            
            <ContactCard
              name={editedApplication.applicant_name}
              phone={editedApplication.applicant_mobile}
              address={editedApplication.applicant_address}
              contactType="applicant"
              callingStatus={editedApplication.applicant_calling_status}
              applicationId={editedApplication.id}
              onStatusUpdate={onSave}
            />

            {editedApplication.co_applicant_name && (
              <ContactCard
                name={editedApplication.co_applicant_name}
                phone={editedApplication.co_applicant_mobile}
                address={editedApplication.co_applicant_address}
                contactType="co_applicant"
                callingStatus={editedApplication.co_applicant_calling_status}
                applicationId={editedApplication.id}
                onStatusUpdate={onSave}
              />
            )}

            {editedApplication.guarantor_name && (
              <ContactCard
                name={editedApplication.guarantor_name}
                phone={editedApplication.guarantor_mobile}
                address={editedApplication.guarantor_address}
                contactType="guarantor"
                callingStatus={editedApplication.guarantor_calling_status}
                applicationId={editedApplication.id}
                onStatusUpdate={onSave}
              />
            )}

            {editedApplication.reference_name && (
              <ContactCard
                name={editedApplication.reference_name}
                phone={editedApplication.reference_mobile}
                address={editedApplication.reference_address}
                contactType="reference"
                callingStatus={editedApplication.reference_calling_status}
                applicationId={editedApplication.id}
                onStatusUpdate={onSave}
              />
            )}

            {editedApplication.fi_location && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">FI Submission Location</h4>
                <ContactCard
                  name="FI Location"
                  address={editedApplication.fi_location}
                  contactType="applicant"
                  callingStatus=""
                  applicationId={editedApplication.id}
                  onStatusUpdate={onSave}
                  showMapLink={true}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Comments</h3>
            </div>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Add Comment
              </Button>
            </div>

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-900">
                      {comment.user_email?.split('@')[0] || 'Unknown User'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Audit Logs</h3>
            
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-900">
                      {log.user_email?.split('@')[0] || 'Unknown User'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Changed <span className="font-medium">{log.field}</span> 
                    {log.previous_value && (
                      <span> from <span className="font-medium text-red-600">{log.previous_value}</span></span>
                    )}
                    {log.new_value && (
                      <span> to <span className="font-medium text-green-600">{log.new_value}</span></span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {activeTab === 'details' && (
        <div className="border-t p-6 bg-gray-50">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetailsPanel;
