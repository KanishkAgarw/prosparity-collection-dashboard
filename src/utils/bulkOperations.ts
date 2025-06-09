
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const processBulkApplications = async (applications: any[], user?: any) => {
  console.log('Processing bulk applications:', applications.length);
  
  const results = {
    successful: 0,
    failed: 0,
    updated: 0,
    statusUpdated: 0,
    errors: [] as string[]
  };

  for (const app of applications) {
    try {
      // Check if application already exists
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id, applicant_id')
        .eq('applicant_id', app.applicant_id)
        .maybeSingle();

      const statusFromTemplate = app.status || app.Status;

      if (existingApp) {
        // Update existing application
        const { error: updateError } = await supabase
          .from('applications')
          .update({
            ...app,
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
          if (statusFromTemplate && user) {
            await updateFieldStatusFromBulk(app.applicant_id, statusFromTemplate, user);
            results.statusUpdated++;
          }
        }
      } else {
        // Insert new application
        const { error: insertError } = await supabase
          .from('applications')
          .insert([{
            ...app,
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
            const initialStatus = statusFromTemplate || 'Unpaid';
            await supabase
              .from('field_status')
              .insert({
                application_id: app.applicant_id,
                status: initialStatus,
                user_id: user?.id || app.user_id,
                user_email: user?.email || 'system@bulk-upload.local'
              });

            if (statusFromTemplate) {
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
            // Don't fail the whole operation for this
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
      return;
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
  }
};
