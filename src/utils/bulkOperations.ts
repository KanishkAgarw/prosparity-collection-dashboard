
import { supabase } from '@/integrations/supabase/client';

export const processBulkApplications = async (applications: any[], user?: any) => {
  console.log('Processing bulk applications:', applications.length);
  
  const results = {
    successful: 0,
    failed: 0,
    updated: 0,
    statusUpdated: 0,
    errors: [] as string[]
  };

  // Define valid status values for validation
  const validStatuses = ['Unpaid', 'Partially Paid', 'Cash Collected from Customer', 'Customer Deposited to Bank', 'Paid'];

  for (const app of applications) {
    try {
      // Separate status from application data
      const { status: statusFromTemplate, ...applicationData } = app;
      
      // Validate status if provided
      if (statusFromTemplate && !validStatuses.includes(statusFromTemplate)) {
        console.warn(`Invalid status value: ${statusFromTemplate}. Using 'Unpaid' as default.`);
      }

      // Check if application already exists
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id, applicant_id')
        .eq('applicant_id', app.applicant_id)
        .maybeSingle();

      if (existingApp) {
        // Update existing application (excluding status field)
        const { error: updateError } = await supabase
          .from('applications')
          .update({
            ...applicationData,
            updated_at: new Date().toISOString()
          })
          .eq('applicant_id', app.applicant_id);

        if (updateError) {
          console.error('Error updating application:', updateError);
          results.failed++;
          results.errors.push(`Failed to update ${app.applicant_id}: ${updateError.message}`);
        } else {
          console.log('Updated application:', app.applicant_id);
          results.updated++;

          // Handle status update if Status column is provided
          if (statusFromTemplate && validStatuses.includes(statusFromTemplate) && user) {
            try {
              await updateFieldStatusFromBulk(app.applicant_id, statusFromTemplate, user);
              results.statusUpdated++;
            } catch (statusError) {
              console.error('Error updating status for existing application:', statusError);
              results.errors.push(`Failed to update status for ${app.applicant_id}: ${statusError}`);
            }
          }
        }
      } else {
        // Insert new application (excluding status field)
        const { error: insertError } = await supabase
          .from('applications')
          .insert([{
            ...applicationData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('Error inserting application:', insertError);
          results.failed++;
          results.errors.push(`Failed to insert ${app.applicant_id}: ${insertError.message}`);
        } else {
          console.log('Inserted application:', app.applicant_id);
          results.successful++;

          // Create initial field status for new applications
          try {
            const initialStatus = (statusFromTemplate && validStatuses.includes(statusFromTemplate)) 
              ? statusFromTemplate 
              : 'Unpaid';
            
            await supabase
              .from('field_status')
              .insert({
                application_id: app.applicant_id,
                status: initialStatus,
                user_id: user?.id || app.user_id,
                user_email: user?.email || 'system@bulk-upload.local'
              });

            if (statusFromTemplate && validStatuses.includes(statusFromTemplate)) {
              results.statusUpdated++;
              
              // Add audit log for status setting
              if (user) {
                await supabase
                  .from('audit_logs')
                  .insert({
                    field: 'Status (Bulk Upload)',
                    previous_value: 'Unpaid',
                    new_value: statusFromTemplate,
                    application_id: app.applicant_id,
                    user_id: user.id,
                    user_email: user.email
                  });
              }
            }
          } catch (fieldStatusError) {
            console.error('Error creating field status:', fieldStatusError);
            results.errors.push(`Failed to create field status for ${app.applicant_id}: ${fieldStatusError}`);
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error processing application:', error);
      results.failed++;
      results.errors.push(`Unexpected error for ${app.applicant_id}: ${error}`);
    }
  }

  return results;
};

const updateFieldStatusFromBulk = async (applicationId: string, newStatus: string, user: any) => {
  try {
    // Get current status
    const { data: currentStatus } = await supabase
      .from('field_status')
      .select('status')
      .eq('application_id', applicationId)
      .maybeSingle();

    const previousStatus = currentStatus?.status || 'Unpaid';

    // Only update if status is actually changing
    if (previousStatus === newStatus) {
      console.log(`Status for ${applicationId} is already ${newStatus}, skipping update`);
      return;
    }

    // Update or insert field status
    const { error } = await supabase
      .from('field_status')
      .upsert({
        application_id: applicationId,
        status: newStatus,
        user_id: user.id,
        user_email: user.email,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating field status:', error);
      throw error;
    }

    // Add audit log for status change
    await supabase
      .from('audit_logs')
      .insert({
        field: 'Status (Bulk Upload)',
        previous_value: previousStatus,
        new_value: newStatus,
        application_id: applicationId,
        user_id: user.id,
        user_email: user.email
      });

    console.log(`Updated status for ${applicationId}: ${previousStatus} -> ${newStatus}`);
  } catch (error) {
    console.error('Error in updateFieldStatusFromBulk:', error);
    throw error;
  }
};
