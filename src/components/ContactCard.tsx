
import { Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPhoneLink, formatMapLink } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ContactCardProps {
  name?: string;
  phone?: string;
  address?: string;
  contactType: 'applicant' | 'co_applicant' | 'guarantor' | 'reference';
  callingStatus?: string;
  applicationId: string;
  onStatusUpdate: () => void;
  showMapLink?: boolean;
}

const CALLING_STATUS_OPTIONS = [
  'Not Called',
  'Called',
  'No Response',
  'Busy',
  'Disconnected'
];

const ContactCard = ({ 
  name, 
  phone, 
  address, 
  contactType, 
  callingStatus = 'Not Called',
  applicationId,
  onStatusUpdate,
  showMapLink = false
}: ContactCardProps) => {
  const { user } = useAuth();
  
  if (!name && !phone && !address) return null;

  const phoneLink = formatPhoneLink(phone);
  const mapLink = formatMapLink(address);

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;

    try {
      // Update the application's calling status
      const updateField = `${contactType}_calling_status`;
      const { error: updateError } = await supabase
        .from('applications')
        .update({ 
          [updateField]: newStatus,
          latest_calling_status: newStatus 
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Log the calling status change
      const { error: logError } = await supabase
        .from('calling_logs')
        .insert({
          application_id: applicationId,
          contact_type: contactType,
          previous_status: callingStatus,
          new_status: newStatus,
          user_id: user.id,
          user_email: user.email,
          user_name: user.email // Will be updated when we have full names
        });

      if (logError) throw logError;

      toast.success('Calling status updated successfully');
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating calling status:', error);
      toast.error('Failed to update calling status');
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 capitalize">
          {contactType.replace('_', ' ')} {name && `- ${name}`}
        </h4>
        <Select value={callingStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CALLING_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {phone && (
        <div className="flex items-center gap-2">
          {phoneLink ? (
            <Button variant="ghost" size="sm" className="gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50" asChild>
              <a href={phoneLink}>
                <Phone className="h-3 w-3" />
                <span className="text-sm">{phone}</span>
              </a>
            </Button>
          ) : (
            <span className="text-sm text-gray-600">{phone}</span>
          )}
        </div>
      )}
      
      {address && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{address}</span>
          {showMapLink && mapLink && (
            <Button variant="ghost" size="sm" className="gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50" asChild>
              <a href={mapLink} target="_blank" rel="noopener noreferrer">
                <MapPin className="h-3 w-3" />
                <span className="text-xs">Open in Maps</span>
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactCard;
