
import { Check } from "lucide-react";
import { Application } from "@/types/application";
import type { BatchContactStatus } from "@/hooks/useBatchContactCallingStatus";

interface CallStatusDisplayProps {
  application: Application;
  selectedMonth?: string;
  batchedContactStatus?: BatchContactStatus;
}

const CallStatusDisplay = ({ application, selectedMonth, batchedContactStatus }: CallStatusDisplayProps) => {
  // Use batched data if available, otherwise fallback to default
  const getStatusForContact = (contactType: string): string => {
    if (!batchedContactStatus) return 'Not Called';
    
    switch (contactType) {
      case 'applicant':
        return batchedContactStatus.applicant || 'Not Called';
      case 'co_applicant':
        return batchedContactStatus.co_applicant || 'Not Called';
      case 'guarantor':
        return batchedContactStatus.guarantor || 'Not Called';
      case 'reference':
        return batchedContactStatus.reference || 'Not Called';
      default:
        return 'Not Called';
    }
  };

  const contacts = [
    {
      name: "Applicant",
      person: application.applicant_name,
      status: getStatusForContact('applicant')
    },
    ...(application.co_applicant_name ? [{
      name: "Co-Applicant", 
      person: application.co_applicant_name,
      status: getStatusForContact('co_applicant')
    }] : []),
    ...(application.guarantor_name ? [{
      name: "Guarantor",
      person: application.guarantor_name, 
      status: getStatusForContact('guarantor')
    }] : []),
    ...(application.reference_name ? [{
      name: "Reference",
      person: application.reference_name,
      status: getStatusForContact('reference')
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
