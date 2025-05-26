
import { useState } from "react";
import { X, Calendar, User, FileText, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Application, AuditLog } from "@/types/application";

interface ApplicationDetailsPanelProps {
  application: Application | null;
  onClose: () => void;
  onSave: (application: Application, logs: AuditLog[]) => void;
}

const ApplicationDetailsPanel = ({ application, onClose, onSave }: ApplicationDetailsPanelProps) => {
  const [editedApp, setEditedApp] = useState<Application | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  if (!application) return null;

  const currentApp = editedApp || application;
  const recentLogs = application.auditLogs?.slice(-3) || [];

  const handleSave = () => {
    if (!editedApp) return;
    
    const logs: AuditLog[] = [];
    const timestamp = new Date().toISOString();
    const user = "Current User";

    // Compare fields and create audit logs
    if (editedApp.status !== application.status) {
      logs.push({
        id: Date.now().toString(),
        timestamp,
        user,
        field: "Status",
        previousValue: application.status,
        newValue: editedApp.status
      });
    }

    if (editedApp.amountPaid !== application.amountPaid) {
      logs.push({
        id: (Date.now() + 1).toString(),
        timestamp,
        user,
        field: "Amount Paid",
        previousValue: application.amountPaid?.toString() || "0",
        newValue: editedApp.amountPaid?.toString() || "0"
      });
    }

    if (editedApp.paidDate !== application.paidDate) {
      logs.push({
        id: (Date.now() + 2).toString(),
        timestamp,
        user,
        field: "Paid Date",
        previousValue: application.paidDate || "Not set",
        newValue: editedApp.paidDate || "Not set"
      });
    }

    if (editedApp.ptpDate !== application.ptpDate) {
      logs.push({
        id: (Date.now() + 3).toString(),
        timestamp,
        user,
        field: "PTP Date",
        previousValue: application.ptpDate || "Not set",
        newValue: editedApp.ptpDate || "Not set"
      });
    }

    if (editedApp.rmComments !== application.rmComments) {
      logs.push({
        id: (Date.now() + 4).toString(),
        timestamp,
        user,
        field: "RM Comments",
        previousValue: application.rmComments || "No comments",
        newValue: editedApp.rmComments || "No comments"
      });
    }

    onSave(editedApp, logs);
    setEditedApp(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "text-green-600";
      case "Unpaid": return "text-red-600";
      case "Partially Paid": return "text-yellow-600";
      default: return "text-gray-600";
    }
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

        {/* Application Info */}
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Application ID</p>
            <p className="font-medium">{application.applicationId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Applicant Name</p>
            <p className="font-medium">{application.applicantName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Branch</p>
              <p className="font-medium">{application.branch}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Team Lead</p>
              <p className="font-medium">{application.teamLead}</p>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-4 mb-6">
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
            <Label htmlFor="amountPaid">Amount Paid</Label>
            <Input
              id="amountPaid"
              type="number"
              value={currentApp.amountPaid || 0}
              onChange={(e) => updateField('amountPaid', Number(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="paidDate">Paid Date</Label>
            <Input
              id="paidDate"
              type="date"
              value={currentApp.paidDate || ''}
              onChange={(e) => updateField('paidDate', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="ptpDate">PTP Date</Label>
            <Input
              id="ptpDate"
              type="date"
              value={currentApp.ptpDate || ''}
              onChange={(e) => updateField('ptpDate', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="rmComments">RM Comments</Label>
            <textarea
              id="rmComments"
              className="w-full p-2 border rounded-md min-h-[80px]"
              value={currentApp.rmComments || ''}
              onChange={(e) => updateField('rmComments', e.target.value)}
              placeholder="Add your comments here..."
            />
          </div>
        </div>

        {/* Recent Changes */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Recent Changes</CardTitle>
              {application.auditLogs && application.auditLogs.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All Logs
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Complete Audit Trail - {application.applicationId}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      {application.auditLogs.map((log) => (
                        <div key={log.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm">{log.user}</span>
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{log.field}</span> changed
                            <div className="mt-1 text-xs text-gray-600">
                              From: <span className="bg-red-100 px-1 rounded">{log.previousValue}</span>
                              {" → "}
                              To: <span className="bg-green-100 px-1 rounded">{log.newValue}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {recentLogs.length > 0 ? (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div key={log.id} className="text-xs border-l-2 border-blue-200 pl-2 py-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{log.field}</span>
                      <span className="text-gray-500">by {log.user}</span>
                    </div>
                    <div className="text-gray-400">{formatDate(log.timestamp)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No recent changes</p>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          className="w-full"
          disabled={!editedApp}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ApplicationDetailsPanel;
