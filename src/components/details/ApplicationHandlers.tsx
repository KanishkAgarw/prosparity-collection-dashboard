import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';
import { toast } from 'sonner';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useFieldStatus } from '@/hooks/useFieldStatus';
import { monthToEmiDate } from '@/utils/dateUtils';

export const useApplicationHandlers = (
  application: Application | null,
  user: any,
  addAuditLog: (appId: string, field: string, previousValue: string | null, newValue: string | null, demandDate: string) => Promise<void>,
  addCallingLog: (contactType: string, previousStatus: string, newStatus: string) => Promise<void>,
  onSave: (updatedApp: Application) => void,
  selectedMonth?: string
) => {
  const { getUserName } = useUserProfiles();
  const { fetchFieldStatus } = useFieldStatus();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!application || !user || isUpdating) return;

    setIsUpdating(true);
    try {
      // Fetch previous status for the selected month
      let previousStatus = 'Unpaid';
      if (application && selectedMonth) {
        const statusMap = await fetchFieldStatus([application.applicant_id], selectedMonth);
        previousStatus = statusMap[application.applicant_id] || 'Unpaid';
      }

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
            requested_by_name: getUserName(user.id, user.email),
            demand_date: selectedMonth
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
            updated_at: new Date().toISOString(),
            demand_date: monthToEmiDate(selectedMonth)
          }, {
            onConflict: 'application_id,demand_date'
          });

        if (error) {
          console.error('Error updating field status:', error);
          toast.error('Failed to update status');
          return;
        }

        // Add audit log for the request
        await addAuditLog(application.applicant_id, 'Status', previousStatus, 'Paid (Pending Approval)', monthToEmiDate(selectedMonth));

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
            updated_at: new Date().toISOString(),
            demand_date: monthToEmiDate(selectedMonth)
          }, {
            onConflict: 'application_id,demand_date'
          });

        if (error) {
          console.error('Error updating field status:', error);
          toast.error('Failed to update status');
          return;
        }

        // Add audit log for the status change
        await addAuditLog(application.applicant_id, 'Status', previousStatus, newStatus, monthToEmiDate(selectedMonth));

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
    if (!application || !user || isUpdating || !selectedMonth) return;

    setIsUpdating(true);
    console.log('=== PTP DATE CHANGE HANDLER - WITH DEMAND DATE ===');
    console.log('Application ID:', application.applicant_id);
    console.log('Demand Date:', selectedMonth);
    console.log('User ID:', user.id);
    console.log('Previous PTP date:', application.ptp_date);
    console.log('New PTP date input:', newDate);
    console.log('Is clearing date:', newDate === '');

    try {
      const previousDate = application.ptp_date;
      let formattedDate: string | null = null;

      // Handle clearing vs setting date
      if (newDate && newDate.trim() !== '') {
        // Convert YYYY-MM-DD to ISO string for storage
        formattedDate = new Date(newDate + 'T00:00:00.000Z').toISOString();
        console.log('Formatted date for storage:', formattedDate);
      } else {
        // Clearing the date - explicitly set to null
        formattedDate = null;
        console.log('Clearing date - setting to null');
      }

      // Step 1: Insert PTP date record with demand_date
      console.log('Step 1: Inserting PTP date record...');
      const { error: ptpError, data: ptpData } = await supabase
        .from('ptp_dates')
        .insert({
          application_id: application.applicant_id,
          ptp_date: formattedDate,
          demand_date: monthToEmiDate(selectedMonth),
          user_id: user.id
        })
        .select()
        .single();

      if (ptpError) {
        console.error('❌ PTP Insert Error:', ptpError);
        toast.error(`Failed to update PTP date: ${ptpError.message}`);
        return;
      }

      console.log('✅ PTP date record inserted:', ptpData);

      // Step 2: Format dates for audit log - use consistent DD-MMM-YYYY format
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
      const newDisplayValue = newDate === '' ? 'Cleared' : formatDateForAudit(formattedDate);

      console.log('Step 2: Formatted values for audit log:');
      console.log('Previous:', previousDisplayValue);
      console.log('New:', newDisplayValue);

      // Step 3: Add audit log with enhanced error handling and retry
      console.log('Step 3: Adding audit log...');
      let auditLogSuccess = false;
      let auditAttempts = 0;
      const maxAuditAttempts = 3;

      while (!auditLogSuccess && auditAttempts < maxAuditAttempts) {
        auditAttempts++;
        try {
          console.log(`Audit log attempt ${auditAttempts}/${maxAuditAttempts}`);
          await addAuditLog(application.applicant_id, 'PTP Date', previousDisplayValue, newDisplayValue, monthToEmiDate(selectedMonth));
          auditLogSuccess = true;
          console.log('✅ Audit log added successfully');
        } catch (auditError) {
          console.error(`❌ Audit log attempt ${auditAttempts} failed:`, auditError);
          if (auditAttempts < maxAuditAttempts) {
            // Wait 500ms before retry
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      if (!auditLogSuccess) {
        console.error('❌ All audit log attempts failed');
        // Don't fail the entire operation, but show warning
        toast.error('PTP date updated but logging failed');
      }

      // Step 4: Update local application state
      console.log('Step 4: Updating local application state...');
      const updatedApp = { ...application, ptp_date: formattedDate };
      onSave(updatedApp);

      console.log('✅ PTP date change completed successfully');
    } catch (error) {
      console.error('❌ Unexpected error in PTP date change:', error);
      toast.error('Failed to update PTP date. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCallingStatusChange = async (contactType: string, newStatus: string) => {
    if (!application || !user || isUpdating) return;

    setIsUpdating(true);
    try {
      const previousStatus = application[`${contactType.toLowerCase()}_calling_status` as keyof Application] as string || 'Not Called';

      // Only proceed if status is actually changing
      if (previousStatus === newStatus) {
        setIsUpdating(false);
        return;
      }

      // Update calling status with demand date
      const { error } = await supabase
        .from('contact_calling_status')
        .upsert({
          application_id: application.applicant_id,
          contact_type: contactType,
          status: newStatus,
          user_id: user.id,
          user_email: user.email,
          updated_at: new Date().toISOString(),
          demand_date: monthToEmiDate(selectedMonth)
        }, {
          onConflict: 'application_id,contact_type,demand_date'
        });

      if (error) {
        console.error('Error updating calling status:', error);
        toast.error('Failed to update calling status');
        return;
      }

      // Add calling log
      await addCallingLog(contactType, previousStatus, newStatus);

      // Update local application state
      const updatedApp = { 
        ...application, 
        [`${contactType.toLowerCase()}_calling_status`]: newStatus
      };
      onSave(updatedApp);

      toast.success(`${contactType} calling status updated successfully`);
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
