
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
    
    console.log('=== PTP DATE CHANGE DEBUG ===');
    console.log('Application ID:', application.applicant_id);
    console.log('Current PTP date:', application.ptp_date);
    console.log('New date input:', newDate);
    
    try {
      // Handle the date conversion more carefully
      let ptpValue = null;
      if (newDate && newDate.trim()) {
        // Create a proper date object from the input (YYYY-MM-DD)
        const dateObj = new Date(newDate + 'T00:00:00.000Z');
        if (!isNaN(dateObj.getTime())) {
          ptpValue = dateObj.toISOString();
          console.log('Converted to ISO string:', ptpValue);
        } else {
          console.error('Invalid date format:', newDate);
          toast.error('Invalid date format');
          return;
        }
      }

      const updateData = {
        ptp_date: ptpValue,
        updated_at: new Date().toISOString()
      };

      console.log('Sending update data to database:', updateData);

      const { data, error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('applicant_id', application.applicant_id)
        .select('ptp_date, updated_at')
        .single();

      if (error) {
        console.error('Database error updating PTP date:', error);
        toast.error(`Failed to update PTP date: ${error.message}`);
        return;
      }

      console.log('Database update successful, returned data:', data);

      // Add audit log
      const previousValue = application.ptp_date ? new Date(application.ptp_date).toISOString().split('T')[0] : 'Not set';
      const newValue = newDate || 'Not set';
      console.log('Adding audit log for PTP date change');
      await addAuditLog('PTP Date', previousValue, newValue);

      const updatedApp = {
        ...application,
        ptp_date: ptpValue,
        updated_at: data.updated_at
      };
      
      console.log('Calling onSave with updated app:', updatedApp);
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
