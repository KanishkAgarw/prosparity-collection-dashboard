
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
    
    console.log('=== CRITICAL PTP DATE DEBUG START ===');
    console.log('User attempting PTP update:', {
      userId: user.id,
      userEmail: user.email,
      applicationId: application.applicant_id,
      applicantName: application.applicant_name,
      currentPtpDate: application.ptp_date,
      newDateInput: newDate
    });
    
    try {
      // Step 1: Prepare the PTP value
      let ptpValue = null;
      if (newDate && newDate.trim()) {
        ptpValue = new Date(newDate + 'T00:00:00.000Z').toISOString();
        console.log('Converted PTP value:', ptpValue);
      }

      // Step 2: Check if record exists and current user can access it
      console.log('=== CHECKING RECORD ACCESS ===');
      const { data: checkData, error: checkError } = await supabase
        .from('applications')
        .select('id, applicant_id, applicant_name, ptp_date, user_id')
        .eq('applicant_id', application.applicant_id)
        .single();

      console.log('Record check result:', {
        data: checkData,
        error: checkError,
        userCanAccess: checkData?.user_id === user.id
      });

      if (checkError) {
        console.error('CRITICAL: Cannot access application record:', checkError);
        toast.error(`Cannot access application: ${checkError.message}`);
        return;
      }

      // Step 3: Attempt the update
      console.log('=== ATTEMPTING DATABASE UPDATE ===');
      const updateData = {
        ptp_date: ptpValue,
        updated_at: new Date().toISOString()
      };

      console.log('Update payload:', updateData);

      const { data: updateResult, error: updateError } = await supabase
        .from('applications')
        .update(updateData)
        .eq('applicant_id', application.applicant_id)
        .select('ptp_date, updated_at, applicant_name, user_id')
        .single();

      console.log('=== UPDATE RESULT ===');
      console.log('Update data:', updateResult);
      console.log('Update error:', updateError);

      if (updateError) {
        console.error('CRITICAL: Database update failed:', updateError);
        toast.error(`Database update failed: ${updateError.message}`);
        return;
      }

      if (!updateResult) {
        console.error('CRITICAL: No data returned from update');
        toast.error('No data returned from update');
        return;
      }

      console.log('SUCCESS: PTP date updated in database');

      // Step 4: Verify the update worked
      console.log('=== VERIFICATION QUERY ===');
      const { data: verifyData, error: verifyError } = await supabase
        .from('applications')
        .select('ptp_date, applicant_name, updated_at')
        .eq('applicant_id', application.applicant_id)
        .single();

      console.log('Verification result:', {
        data: verifyData,
        error: verifyError,
        ptpDateSaved: verifyData?.ptp_date
      });

      // Step 5: Add audit log
      const previousValue = application.ptp_date ? 
        new Date(application.ptp_date).toISOString().split('T')[0] : 'Not set';
      const newValue = newDate || 'Not set';
      
      console.log('Adding audit log for PTP date change:', {
        previousValue,
        newValue
      });
      
      await addAuditLog('PTP Date', previousValue, newValue);

      // Step 6: Update local state
      const updatedApp = {
        ...application,
        ptp_date: ptpValue,
        updated_at: updateResult.updated_at
      };
      
      console.log('Calling onSave with updated app:', {
        ptpDate: updatedApp.ptp_date,
        updatedAt: updatedApp.updated_at
      });
      
      onSave(updatedApp);
      toast.success(`PTP date updated successfully for ${application.applicant_name}`);
      
      console.log('=== CRITICAL PTP DATE DEBUG END ===');
      
    } catch (error) {
      console.error('CRITICAL: Exception in handlePtpDateChange:', error);
      toast.error(`Failed to update PTP date: ${error.message}`);
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
