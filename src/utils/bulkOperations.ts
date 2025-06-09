
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';

export const processBulkApplications = async (applications: any[]) => {
  console.log('Processing bulk applications:', applications.length);
  
  const results = {
    successful: 0,
    failed: 0,
    updated: 0,
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

      if (existingApp) {
        // Update existing application (including LMS status)
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
            await supabase
              .from('field_status')
              .insert({
                application_id: app.applicant_id,
                status: 'Unpaid',
                user_id: app.user_id,
                user_email: 'system@bulk-upload.local'
              });
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
