
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Application } from "@/types/application";

export const useApplicationHandlers = (
  application: Application | null,
  user: any,
  addAuditLog: (field: string, previousValue: string, newValue: string) => Promise<void>,
  addCallingLog: (contactType: string, previousStatus: string, newStatus: string) => Promise<void>,
  onSave: (updatedApp: Application) => void
) => {
  const handleStatusChange = async (newStatus: string) => {
    if (!user || !application || newStatus === application.status) return;
    
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('applicant_id', application.applicant_id);

      if (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update status');
        return;
      }

      await addAuditLog('Status', application.status, newStatus);

      const updatedApp = {
        ...application,
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      onSave(updatedApp);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePtpDateChange = async (newDate: string) => {
    if (!user || !application || newDate === application.ptp_date) return;
    
    try {
      const updateData = {
        ptp_date: newDate || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('applicant_id', application.applicant_id);

      if (error) {
        console.error('Error updating PTP date:', error);
        toast.error('Failed to update PTP date');
        return;
      }

      await addAuditLog('PTP Date', application.ptp_date || 'Not set', newDate || 'Not set');

      const updatedApp = {
        ...application,
        ptp_date: newDate || null,
        updated_at: new Date().toISOString()
      };
      
      onSave(updatedApp);
      toast.success('PTP date updated successfully');
    } catch (error) {
      console.error('Error updating PTP date:', error);
      toast.error('Failed to update PTP date');
    }
  };

  const handleCallingStatusChange = async (contactType: string, newStatus: string, currentStatus?: string) => {
    if (!user || !application) return;
    
    const previousStatus = currentStatus || "Not Called";
    
    try {
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

      await addCallingLog(contactType, previousStatus, newStatus);
      await addAuditLog(`${contactType} Calling Status`, previousStatus, newStatus);

      const updatedApp = {
        ...application,
        [fieldName]: newStatus,
        latest_calling_status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      onSave(updatedApp);
      toast.success('Calling status updated successfully');
    } catch (error) {
      console.error('Error updating calling status:', error);
      toast.error('Failed to update calling status');
    }
  };

  return {
    handleStatusChange,
    handlePtpDateChange,
    handleCallingStatusChange
  };
};
