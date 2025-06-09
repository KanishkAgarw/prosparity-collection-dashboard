
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';
import { toast } from 'sonner';

export const useApplicationHandlers = (
  application: Application | null,
  user: any,
  addAuditLog: (appId: string, field: string, previousValue: string | null, newValue: string | null) => Promise<void>,
  addCallingLog: (contactType: string, newStatus: string, previousStatus?: string) => Promise<void>,
  onSave: (updatedApp: Application) => void
) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!application || !user || isUpdating) return;

    setIsUpdating(true);
    try {
      const previousStatus = application.field_status || 'Unpaid';

      // Update field_status table
      const { error } = await supabase
        .from('field_status')
        .upsert({
          application_id: application.applicant_id,
          status: newStatus,
          user_id: user.id,
          user_email: user.email,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating field status:', error);
        toast.error('Failed to update status');
        return;
      }

      // Add audit log with correct signature
      await addAuditLog(application.applicant_id, 'Status', previousStatus, newStatus);

      // Update local application state
      const updatedApp = { ...application, field_status: newStatus };
      onSave(updatedApp);

      toast.success('Status updated successfully');
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
      const previousDate = application.ptp_date;
      let formattedDate: string | null = null;

      if (newDate) {
        // Convert YYYY-MM-DD to ISO string for storage
        formattedDate = new Date(newDate + 'T00:00:00.000Z').toISOString();
      }

      // Update ptp_dates table
      const { error } = await supabase
        .from('ptp_dates')
        .upsert({
          application_id: application.applicant_id,
          ptp_date: formattedDate,
          user_id: user.id,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating PTP date:', error);
        toast.error('Failed to update PTP date');
        return;
      }

      // Update applications table
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

      // Add audit log with correct signature
      await addAuditLog(application.applicant_id, 'PTP Date', previousDate || 'Not Set', formattedDate || 'Not Set');

      // Update local application state
      const updatedApp = { ...application, ptp_date: formattedDate };
      onSave(updatedApp);

      toast.success('PTP date updated successfully');
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
