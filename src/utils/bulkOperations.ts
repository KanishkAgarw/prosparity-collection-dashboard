
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
      console.log(`Processing application: ${app.applicant_id}`);
      
      // Separate status and upload mode from application data
      const { status: statusFromTemplate, uploadMode, ...applicationData } = app;
      
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

      const appExists = !!existingApp;

      // Handle based on upload mode
      if (uploadMode === 'add' && appExists) {
        console.log(`Skipping existing application in add-only mode: ${app.applicant_id}`);
        results.errors.push(`Application ${app.applicant_id} already exists (add-only mode)`);
        results.failed++;
        continue;
      }

      if (uploadMode === 'update' && !appExists) {
        console.log(`Skipping non-existent application in update-only mode: ${app.applicant_id}`);
        results.errors.push(`Application ${app.applicant_id} does not exist (update-only mode)`);
        results.failed++;
        continue;
      }

      if (existingApp) {
        console.log(`Updating existing application: ${app.applicant_id}`);
        
        // Update existing application (including collection_rm)
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
              console.log(`Status updated for existing application: ${app.applicant_id}`);
            } catch (statusError) {
              console.error('Error updating status for existing application:', statusError);
              results.errors.push(`Failed to update status for ${app.applicant_id}: ${statusError}`);
            }
          }
        }
      } else {
        console.log(`Creating new application: ${app.applicant_id}`);
        
        // Insert new application (including collection_rm)
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

          // Create initial field status for new applications using upsert
          try {
            const initialStatus = (statusFromTemplate && validStatuses.includes(statusFromTemplate)) 
              ? statusFromTemplate 
              : 'Unpaid';
            
            console.log(`Creating field status for new application: ${app.applicant_id} with status: ${initialStatus}`);
            
            // Use upsert to handle potential duplicates
            const { error: fieldStatusError } = await supabase
              .from('field_status')
              .upsert({
                application_id: app.applicant_id,
                status: initialStatus,
                user_id: user?.id || app.user_id,
                user_email: user?.email || 'system@bulk-upload.local',
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'application_id'
              });

            if (fieldStatusError) {
              console.error('Error creating field status:', fieldStatusError);
              results.errors.push(`Failed to create field status for ${app.applicant_id}: ${fieldStatusError.message}`);
            } else {
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

  console.log('Bulk processing completed:', results);
  return results;
};

const updateFieldStatusFromBulk = async (applicationId: string, newStatus: string, user: any) => {
  try {
    console.log(`Updating field status for ${applicationId} to ${newStatus}`);
    
    // Get current status first
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

    // Use upsert with proper conflict resolution
    const { error } = await supabase
      .from('field_status')
      .upsert({
        application_id: applicationId,
        status: newStatus,
        user_id: user.id,
        user_email: user.email,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'application_id'
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

    console.log(`Successfully updated status for ${applicationId}: ${previousStatus} -> ${newStatus}`);
  } catch (error) {
    console.error('Error in updateFieldStatusFromBulk:', error);
    throw error;
  }
};
