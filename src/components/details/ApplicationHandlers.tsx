
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Application } from "@/types/application";
import { useContactCallingStatus } from "@/hooks/useContactCallingStatus";

export const useApplicationHandlers = (
  application: Application | null,
  user: any,
  addAuditLog: (field: string, previousValue: string, newValue: string) => Promise<void>,
  addCallingLog: (contactType: string, previousStatus: string, newStatus: string) => Promise<void>,
  onSave: (updatedApp: Application) => void
) => {
  const { updateCallingStatus } = useContactCallingStatus(application?.applicant_id);

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !application || newStatus === application.status) return;
    
    console.log('Handling status change:', { 
      applicationId: application.applicant_id, 
      oldStatus: application.status, 
      newStatus 
    });
    
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

      // Add audit log
      console.log('Adding audit log for status change');
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
    if (!user || !application) return;
    
    console.log('Handling PTP date change:', { 
      applicationId: application.applicant_id, 
      oldDate: application.ptp_date, 
      newDate,
      dateToSave: newDate || null
    });
    
    try {
      // Convert date string to proper timestamp format for database
      let ptpTimestamp = null;
      if (newDate && newDate.trim()) {
        // Create a proper timestamp from the date string
        ptpTimestamp = new Date(newDate + 'T00:00:00.000Z').toISOString();
        console.log('Converted date to timestamp:', ptpTimestamp);
      }

      const updateData = {
        ptp_date: ptpTimestamp,
        updated_at: new Date().toISOString()
      };

      console.log('Updating with data:', updateData);

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('applicant_id', application.applicant_id);

      if (error) {
        console.error('Error updating PTP date:', error);
        toast.error('Failed to update PTP date');
        return;
      }

      // Add audit log
      console.log('Adding audit log for PTP date change');
      await addAuditLog('PTP Date', application.ptp_date || 'Not set', newDate || 'Not set');

      const updatedApp = {
        ...application,
        ptp_date: ptpTimestamp,
        updated_at: new Date().toISOString()
      };
      
      console.log('Updated app with new PTP date:', updatedApp);
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
    
    console.log('Handling calling status change:', { 
      applicationId: application.applicant_id, 
      contactType, 
      previousStatus, 
      newStatus 
    });
    
    try {
      // Update the contact calling status table
      const success = await updateCallingStatus(contactType, newStatus);
      
      if (!success) {
        toast.error('Failed to update calling status');
        return;
      }

      // Add calling log
      console.log('Adding calling log');
      await addCallingLog(contactType, previousStatus, newStatus);
      
      // Add audit log for the calling status change
      console.log('Adding audit log for calling status change');
      await addAuditLog(`${contactType.replace('_', ' ')} Calling Status`, previousStatus, newStatus);

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
