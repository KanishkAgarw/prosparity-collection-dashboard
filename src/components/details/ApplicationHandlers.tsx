
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
    
    console.log('=== CRITICAL PTP DATE CHANGE DEBUG ===');
    console.log('Application ID:', application.applicant_id);
    console.log('Application name:', application.applicant_name);
    console.log('Current PTP date:', application.ptp_date);
    console.log('New date input:', newDate);
    console.log('User ID:', user.id);
    console.log('User email:', user.email);
    
    try {
      let ptpValue = null;
      if (newDate && newDate.trim()) {
        // Use ISO format for PostgreSQL timestamp with timezone
        ptpValue = new Date(newDate + 'T00:00:00.000Z').toISOString();
        console.log('Converted PTP value:', ptpValue);
      }

      const updateData = {
        ptp_date: ptpValue,
        updated_at: new Date().toISOString()
      };

      console.log('=== DATABASE UPDATE ATTEMPT ===');
      console.log('Update data:', updateData);
      console.log('Updating for applicant_id:', application.applicant_id);

      // First, let's check if the record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('applications')
        .select('id, applicant_id, applicant_name, ptp_date')
        .eq('applicant_id', application.applicant_id)
        .single();

      console.log('Existing record check:', existingRecord);
      console.log('Check error:', checkError);

      if (checkError) {
        console.error('CRITICAL: Cannot find application record:', checkError);
        toast.error(`Application not found: ${checkError.message}`);
        return;
      }

      // Now perform the update
      const { data: updateResult, error: updateError } = await supabase
        .from('applications')
        .update(updateData)
        .eq('applicant_id', application.applicant_id)
        .select('ptp_date, updated_at, applicant_name')
        .single();

      console.log('=== UPDATE RESULT ===');
      console.log('Update result:', updateResult);
      console.log('Update error:', updateError);

      if (updateError) {
        console.error('CRITICAL: Database update failed:', updateError);
        toast.error(`Failed to update PTP date: ${updateError.message}`);
        return;
      }

      console.log('SUCCESS: PTP date updated in database');

      // Verify the update by fetching the record again
      const { data: verifyData, error: verifyError } = await supabase
        .from('applications')
        .select('ptp_date, applicant_name')
        .eq('applicant_id', application.applicant_id)
        .single();

      console.log('=== VERIFICATION ===');
      console.log('Verified data:', verifyData);
      console.log('Verify error:', verifyError);

      // Add audit log with proper date formatting for display
      const previousValue = application.ptp_date ? 
        new Date(application.ptp_date).toISOString().split('T')[0] : 'Not set';
      const newValue = newDate || 'Not set';
      
      console.log('Adding audit log for PTP date change');
      await addAuditLog('PTP Date', previousValue, newValue);

      const updatedApp = {
        ...application,
        ptp_date: ptpValue,
        updated_at: updateResult.updated_at
      };
      
      console.log('Calling onSave with updated app:', updatedApp);
      onSave(updatedApp);
      toast.success(`PTP date updated successfully for ${application.applicant_name}`);
      
    } catch (error) {
      console.error('CRITICAL: Error in handlePtpDateChange:', error);
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
