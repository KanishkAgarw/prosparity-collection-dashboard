
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Application } from "@/types/application";
import { CallingLog } from "@/hooks/useCallingLogs";
import { format } from "date-fns";
import { Activity } from "lucide-react";
import ContactCard from "./ContactCard";
import { useContactCallingStatus } from "@/hooks/useContactCallingStatus";
import LogDialog from "./LogDialog";

interface ContactsTabProps {
  application: Application;
  callingLogs: CallingLog[];
  onCallingStatusChange: (contactType: string, newStatus: string, currentStatus?: string) => void;
}

const ContactsTab = ({ application, callingLogs, onCallingStatusChange }: ContactsTabProps) => {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const { getStatusForContact } = useContactCallingStatus(application.applicant_id);

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  // Show only recent 2 calling logs
  const recentCallLogs = callingLogs.slice(0, 2);

  const contacts = [
    {
      type: "applicant",
      displayType: "Applicant",
      name: application.applicant_name,
      mobile: application.applicant_mobile,
      address: application.applicant_address,
      callingStatus: getStatusForContact('applicant')
    },
    ...(application.co_applicant_name ? [{
      type: "co_applicant",
      displayType: "Co-Applicant",
      name: application.co_applicant_name,
      mobile: application.co_applicant_mobile,
      address: application.co_applicant_address,
      callingStatus: getStatusForContact('co_applicant')
    }] : []),
    ...(application.guarantor_name ? [{
      type: "guarantor",
      displayType: "Guarantor",
      name: application.guarantor_name,
      mobile: application.guarantor_mobile,
      address: application.guarantor_address,
      callingStatus: getStatusForContact('guarantor')
    }] : []),
    ...(application.reference_name ? [{
      type: "reference",
      displayType: "Reference",
      name: application.reference_name,
      mobile: application.reference_mobile,
      address: application.reference_address,
      callingStatus: getStatusForContact('reference')
    }] : [])
  ];

  return (
    <div className="space-y-4">
      {/* Contact Cards */}
      <div className="space-y-3">
        {contacts.map((contact, index) => (
          <ContactCard
            key={index}
            title={contact.displayType}
            name={contact.name}
            mobile={contact.mobile}
            currentStatus={contact.callingStatus}
            onStatusChange={(newStatus) => onCallingStatusChange(contact.type, newStatus, contact.callingStatus)}
          />
        ))}
      </div>

      {/* Recent Call Activity - Compact View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Call Activity
            </div>
            {callingLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogDialog(true)}
                className="text-xs h-7"
              >
                Log ({callingLogs.length})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentCallLogs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-3">
              No call activity recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentCallLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-blue-700 capitalize">
                      {log.contact_type.replace('_', ' ')}
                    </span>
                    <div className="text-xs text-gray-600">
                      <span className="text-red-600">{log.previous_status || 'Not Called'}</span>
                      {' → '}
                      <span className="text-green-600">{log.new_status}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <div>{formatDateTime(log.created_at)}</div>
                    <div>by {log.user_name || 'Unknown'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Dialog */}
      <LogDialog
        open={showLogDialog}
        onClose={() => setShowLogDialog(false)}
        logs={callingLogs}
        title="Call Activity History"
        type="calling"
      />
    </div>
  );
};

export default ContactsTab;
