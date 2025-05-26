
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Application, AuditLog } from "@/types/application";
import { toast } from "@/hooks/use-toast";

interface ApplicationDetailsPanelProps {
  application: Application | null;
  onClose: () => void;
  onSave: (updatedApp: Application, logs: AuditLog[]) => void;
}

const ApplicationDetailsPanel = ({ application, onClose, onSave }: ApplicationDetailsPanelProps) => {
  const [formData, setFormData] = useState<Partial<Application>>({});
  const [rmComments, setRmComments] = useState("");

  useEffect(() => {
    if (application) {
      setFormData({
        status: application.status,
        amountPaid: application.amountPaid,
        paidDate: application.paidDate,
        ptpDate: application.ptpDate,
      });
      setRmComments("");
    }
  }, [application]);

  if (!application) return null;

  const handleSave = () => {
    const updatedApp = { ...application, ...formData };
    const logs: AuditLog[] = [];
    
    // Generate audit logs for changes
    Object.entries(formData).forEach(([key, value]) => {
      const originalValue = application[key as keyof Application];
      if (originalValue !== value) {
        logs.push({
          id: Date.now() + Math.random(),
          timestamp: new Date(),
          user: "Current User", // In real app, get from auth
          field: key,
          previousValue: String(originalValue || ""),
          newValue: String(value || ""),
          applicationId: application.applicationId
        });
      }
    });

    // Add comment log if provided
    if (rmComments.trim()) {
      logs.push({
        id: Date.now() + Math.random(),
        timestamp: new Date(),
        user: "Current User",
        field: "rmComments",
        previousValue: "",
        newValue: rmComments,
        applicationId: application.applicationId
      });
    }

    onSave(updatedApp, logs);
    toast({
      title: "Changes saved",
      description: "Application details have been updated successfully.",
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-lg border-l z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">{application.applicantName}</h2>
            <p className="text-sm text-gray-600">{application.applicationId}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Current Status & Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amountPaid">Amount Paid</Label>
              <Input
                id="amountPaid"
                type="number"
                value={formData.amountPaid}
                onChange={(e) => setFormData({...formData, amountPaid: Number(e.target.value)})}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="paidDate">Paid Date</Label>
              <Input
                id="paidDate"
                type="date"
                value={formData.paidDate}
                onChange={(e) => setFormData({...formData, paidDate: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Promise to Pay (PTP)</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="ptpDate">Current PTP Date</Label>
              <Input
                id="ptpDate"
                type="date"
                value={formData.ptpDate}
                onChange={(e) => setFormData({...formData, ptpDate: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">RM Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add your comments here..."
              value={rmComments}
              onChange={(e) => setRmComments(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">EMI Due:</span>
              <span className="font-medium">₹{application.emiDue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Principal:</span>
              <span className="font-medium">₹7,500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Interest:</span>
              <span className="font-medium">₹500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Penalty:</span>
              <span className="font-medium">₹0</span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold">
              <span>Total Payable:</span>
              <span>₹{application.emiDue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {application.auditLogs && application.auditLogs.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Recent Changes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {application.auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="text-sm">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{log.field}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      {log.previousValue} → {log.newValue}
                    </div>
                    <div className="text-xs text-gray-500">by {log.user}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ApplicationDetailsPanel;
