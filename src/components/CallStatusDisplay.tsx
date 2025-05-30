
import { Check } from "lucide-react";
import { Application } from "@/types/application";

interface CallStatusDisplayProps {
  application: Application;
}

const getStatusColor = (status?: string) => {
  if (!status || status === 'Not Called') return 'text-gray-500';
  if (status === 'Called - Answered') return 'text-green-600';
  if (status === 'Called - Unsuccessful') return 'text-red-600';
  return 'text-gray-500';
};

const CallStatusDisplay = ({ application }: CallStatusDisplayProps) => {
  const contacts = [
    {
      name: "Applicant",
      person: application.applicant_name,
      status: application.applicant_calling_status
    },
    ...(application.co_applicant_name ? [{
      name: "Co-Applicant", 
      person: application.co_applicant_name,
      status: application.co_applicant_calling_status
    }] : []),
    ...(application.guarantor_name ? [{
      name: "Guarantor",
      person: application.guarantor_name, 
      status: application.guarantor_calling_status
    }] : []),
    ...(application.reference_name ? [{
      name: "Reference",
      person: application.reference_name,
      status: application.reference_calling_status
    }] : [])
  ];

  return (
    <div className="space-y-1">
      {contacts.map((contact, index) => (
        <div key={index} className="flex items-center gap-1 text-xs">
          <span className="text-gray-600 truncate max-w-[80px]" title={contact.person}>
            {contact.name}
          </span>
          {contact.status && contact.status !== 'Not Called' ? (
            <Check className={`h-3 w-3 flex-shrink-0 ${contact.status === 'Called - Answered' ? 'text-green-600' : 'text-red-600'}`} />
          ) : (
            <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
};

export default CallStatusDisplay;
