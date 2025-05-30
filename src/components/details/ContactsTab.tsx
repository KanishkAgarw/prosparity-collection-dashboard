
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Application } from "@/types/application";
import { CallingLog } from "@/hooks/useCallingLogs";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";
import ContactCard from "./ContactCard";
import { useContactCallingStatus } from "@/hooks/useContactCallingStatus";

interface ContactsTabProps {
  application: Application;
  callingLogs: CallingLog[];
  onCallingStatusChange: (contactType: string, newStatus: string, currentStatus?: string) => void;
}

const ContactsTab = ({ application, callingLogs, onCallingStatusChange }: ContactsTabProps) => {
  const [showAllCallHistory, setShowAllCallHistory] = useState(false);
  const { getStatusForContact } = useContactCallingStatus(application.applicant_id);

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  // Show only top 2 call history entries by default
  const displayedCallLogs = showAllCallHistory ? callingLogs : callingLogs.slice(0, 2);
  const hasMoreCallLogs = callingLogs.length > 2;

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

      {/* Recent Call Activity */}
      {callingLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Call Activity
              </div>
              {hasMoreCallLogs && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllCallHistory(!showAllCallHistory)}
                  className="text-xs h-6"
                >
                  {showAllCallHistory ? (
                    <>
                      Show Less <ChevronUp className="h-3 w-3 ml-1" />
                    </>
                  ) : (
                    <>
                      Show All ({callingLogs.length}) <ChevronDown className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {displayedCallLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 bg-gray-50 text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-blue-700 capitalize">{log.contact_type.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs">
                      <span className="text-gray-600">From:</span>{' '}
                      <span className="text-red-600">{log.previous_status || 'Not Called'}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-600">To:</span>{' '}
                      <span className="text-green-600">{log.new_status}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Updated by: {log.user_name || 'Unknown User'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContactsTab;
