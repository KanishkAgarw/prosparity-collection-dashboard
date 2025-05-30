
import { useState } from "react";
import { User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Application } from "@/types/application";
import { CallingLog } from "@/hooks/useCallingLogs";
import { format } from "date-fns";
import ContactCard from "./ContactCard";
import FiLocationButton from "../FiLocationButton";

interface ContactsTabProps {
  application: Application;
  callingLogs: CallingLog[];
  onCallingStatusChange: (contactType: string, newStatus: string, currentStatus?: string) => void;
}

const ContactsTab = ({ application, callingLogs, onCallingStatusChange }: ContactsTabProps) => {
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  return (
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
        {/* Applicant Contact */}
        <ContactCard
          title="Applicant"
          name={application.applicant_name}
          mobile={application.applicant_mobile}
          currentStatus={application.applicant_calling_status}
          onStatusChange={(status) => onCallingStatusChange('Applicant', status, application.applicant_calling_status)}
        />

        {/* Co-Applicant Contact */}
        {application.co_applicant_name && (
          <ContactCard
            title="Co-Applicant"
            name={application.co_applicant_name}
            mobile={application.co_applicant_mobile}
            currentStatus={application.co_applicant_calling_status}
            onStatusChange={(status) => onCallingStatusChange('Co-Applicant', status, application.co_applicant_calling_status)}
          />
        )}

        {/* Guarantor Contact */}
        {application.guarantor_name && (
          <ContactCard
            title="Guarantor"
            name={application.guarantor_name}
            mobile={application.guarantor_mobile}
            currentStatus={application.guarantor_calling_status}
            onStatusChange={(status) => onCallingStatusChange('Guarantor', status, application.guarantor_calling_status)}
          />
        )}

        {/* Reference Contact */}
        {application.reference_name && (
          <ContactCard
            title="Reference"
            name={application.reference_name}
            mobile={application.reference_mobile}
            currentStatus={application.reference_calling_status}
            onStatusChange={(status) => onCallingStatusChange('Reference', status, application.reference_calling_status)}
          />
        )}

        {/* FI Location */}
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

        {/* Recent Calling Activity */}
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
  );
};

export default ContactsTab;
