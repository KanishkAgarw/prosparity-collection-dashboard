import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';
import { toast } from 'sonner';
import { useUserProfiles } from '@/hooks/useUserProfiles';

export const useApplicationHandlers = (
  application: Application | null,
  user: any,
  addAuditLog: (appId: string, field: string, previousValue: string | null, newValue: string | null) => Promise<void>,
  addCallingLog: (contactType: string, newStatus: string, previousStatus?: string) => Promise<void>,
  onSave: (updatedApp: Application) => void
) => {
  const { getUserName } = useUserProfiles();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!application || !user || isUpdating) return;

    setIsUpdating(true);
    try {
      const previousStatus = application.field_status || 'Unpaid';

      // Only proceed if status is actually changing
      if (previousStatus === newStatus) {
        setIsUpdating(false);
        return;
      }

      // Check if this is a request for "Paid" status - requires approval
      if (newStatus === 'Paid') {
        // Create a status change request
        const { error: requestError } = await supabase
          .from('status_change_requests')
          .insert({
            application_id: application.applicant_id,
            requested_status: newStatus,
            current_status: previousStatus,
            requested_by_user_id: user.id,
            requested_by_email: user.email,
            requested_by_name: getUserName(user.id, user.email)
          });

        if (requestError) {
          console.error('Error creating status change request:', requestError);
          toast.error('Failed to create status change request');
          return;
        }

        // Update field_status to show pending approval state
        const { error } = await supabase
          .from('field_status')
          .upsert({
            application_id: application.applicant_id,
            status: 'Paid (Pending Approval)',
            requested_status: newStatus,
            status_approval_needed: true,
            user_id: user.id,
            user_email: user.email,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'application_id'
          });

        if (error) {
          console.error('Error updating field status:', error);
          toast.error('Failed to update status');
          return;
        }

        // Add audit log for the request
        await addAuditLog(application.applicant_id, 'Status', previousStatus, 'Paid (Pending Approval)');

        // Update local application state
        const updatedApp = { 
          ...application, 
          field_status: 'Paid (Pending Approval)'
        };
        onSave(updatedApp);

        toast.success('Status change request submitted for approval');
      } else {
        // Handle normal status changes (non-Paid statuses)
        const { error } = await supabase
          .from('field_status')
          .upsert({
            application_id: application.applicant_id,
            status: newStatus,
            requested_status: null,
            status_approval_needed: false,
            user_id: user.id,
            user_email: user.email,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'application_id'
          });

        if (error) {
          console.error('Error updating field status:', error);
          toast.error('Failed to update status');
          return;
        }

        // Add audit log for the status change
        await addAuditLog(application.applicant_id, 'Status', previousStatus, newStatus);

        // Update local application state
        const updatedApp = { ...application, field_status: newStatus };
        onSave(updatedApp);

        toast.success('Status updated successfully');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePtpDateChange = async (newDate: string) => {
    if (!application || !user || isUpdating) return;

    setIsUpdating(true);
    try {
      console.log('=== PTP DATE CHANGE HANDLER ===');
      console.log('Application ID:', application.applicant_id);
      console.log('Previous PTP date:', application.ptp_date);
      console.log('New PTP date input:', newDate);

      const previousDate = application.ptp_date;
      let formattedDate: string | null = null;

      if (newDate) {
        // Convert YYYY-MM-DD to ISO string for storage
        formattedDate = new Date(newDate + 'T00:00:00.000Z').toISOString();
        console.log('Formatted date for storage:', formattedDate);
      }

      // Update ptp_dates table first
      console.log('Inserting PTP date record...');
      const { error: ptpError } = await supabase
        .from('ptp_dates')
        .insert({
          application_id: application.applicant_id,
          ptp_date: formattedDate,
          user_id: user.id
        });

      if (ptpError) {
        console.error('Error updating PTP date:', ptpError);
        toast.error('Failed to update PTP date');
        return;
      }

      // Update applications table
      console.log('Updating applications table...');
      const { error: appError } = await supabase
        .from('applications')
        .update({
          ptp_date: formattedDate,
          updated_at: new Date().toISOString()
        })
        .eq('applicant_id', application.applicant_id);

      if (appError) {
        console.error('Error updating application PTP date:', appError);
        toast.error('Failed to update PTP date');
        return;
      }

      // Format dates for audit log - use consistent DD-MMM-YYYY format
      const formatDateForAudit = (dateString: string | null): string => {
        if (!dateString) return 'Not Set';
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          });
        } catch (error) {
          console.error('Error formatting date for audit:', error);
          return 'Invalid Date';
        }
      };

      const previousDisplayValue = formatDateForAudit(previousDate);
      const newDisplayValue = formatDateForAudit(formattedDate);

      console.log('Adding audit log with values:');
      console.log('Previous:', previousDisplayValue);
      console.log('New:', newDisplayValue);

      // Add audit log - this is critical for showing in Recent Changes
      try {
        await addAuditLog(application.applicant_id, 'PTP Date', previousDisplayValue, newDisplayValue);
        console.log('✓ Audit log added successfully');
      } catch (auditError) {
        console.error('Failed to add audit log:', auditError);
        // Don't fail the whole operation if audit log fails
        toast.error('PTP date updated but logging failed');
      }

      // Update local application state
      const updatedApp = { ...application, ptp_date: formattedDate };
      onSave(updatedApp);

      toast.success('PTP date updated successfully');
      console.log('✓ PTP date change completed successfully');
    } catch (error) {
      console.error('Error updating PTP date:', error);
      toast.error('Failed to update PTP date');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCallingStatusChange = async (contactType: string, newStatus: string) => {
    if (!application || !user || isUpdating) return;

    setIsUpdating(true);
    try {
      // Get current status for this contact type
      const { data: currentStatus } = await supabase
        .from('contact_calling_status')
        .select('status')
        .eq('application_id', application.applicant_id)
        .eq('contact_type', contactType)
        .maybeSingle();

      const previousStatus = currentStatus?.status || 'Not Called';

      // Update contact calling status
      const { error } = await supabase
        .from('contact_calling_status')
        .upsert({
          application_id: application.applicant_id,
          contact_type: contactType,
          status: newStatus,
          user_id: user.id,
          user_email: user.email,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating calling status:', error);
        toast.error('Failed to update calling status');
        return;
      }

      // Add calling log
      await addCallingLog(contactType, newStatus, previousStatus);

      toast.success(`${contactType} status updated successfully`);
    } catch (error) {
      console.error('Error updating calling status:', error);
      toast.error('Failed to update calling status');
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    handleStatusChange,
    handlePtpDateChange,
    handleCallingStatusChange,
    isUpdating
  };
};
