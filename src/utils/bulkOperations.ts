
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
        .select('*')
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
        
        // For update-only mode, create selective update object
        let updateData: any = {};
        
        if (uploadMode === 'update') {
          // Only update fields that are explicitly provided and not empty/zero
          Object.entries(applicationData).forEach(([key, value]) => {
            if (key === 'user_id') {
              // Always preserve user_id from existing record
              return;
            }
            
            // Only include non-empty values for updates
            if (value !== undefined && value !== null && value !== '' && value !== 0) {
              updateData[key] = value;
            }
          });
          
          // Always update the timestamp
          updateData.updated_at = new Date().toISOString();
          
          console.log(`Selective update for ${app.applicant_id}:`, updateData);
        } else {
          // For mixed mode, use full update (existing behavior)
          updateData = {
            ...applicationData,
            updated_at: new Date().toISOString()
          };
        }

        // Add audit logging for each field being updated
        if (uploadMode === 'update') {
          for (const [field, newValue] of Object.entries(updateData)) {
            if (field !== 'updated_at' && existingApp[field] !== newValue) {
              try {
                await addDetailedAuditLog(
                  app.applicant_id,
                  `${field} (Bulk Update - Update Only)`,
                  existingApp[field]?.toString() || null,
                  newValue?.toString() || null,
                  user
                );
              } catch (auditError) {
                console.warn('Failed to add audit log:', auditError);
              }
            }
          }
        }

        const { error: updateError } = await supabase
          .from('applications')
          .update(updateData)
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
                  await addDetailedAuditLog(
                    app.applicant_id,
                    'Status (Bulk Upload - New Application)',
                    'Unpaid',
                    statusFromTemplate,
                    user
                  );
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

const addDetailedAuditLog = async (
  applicationId: string, 
  field: string, 
  previousValue: string | null, 
  newValue: string | null, 
  user: any
) => {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        field,
        previous_value: previousValue,
        new_value: newValue,
        application_id: applicationId,
        user_id: user.id,
        user_email: user.email
      });
  } catch (error) {
    console.error('Error adding detailed audit log:', error);
    throw error;
  }
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
    await addDetailedAuditLog(
      applicationId,
      'Status (Bulk Upload - Status Update)',
      previousStatus,
      newStatus,
      user
    );

    console.log(`Successfully updated status for ${applicationId}: ${previousStatus} -> ${newStatus}`);
  } catch (error) {
    console.error('Error in updateFieldStatusFromBulk:', error);
    throw error;
  }
};

// New function to recover financial data from audit logs
export const recoverFinancialData = async () => {
  console.log('Starting financial data recovery process...');
  
  try {
    // Find applications where financial fields were reset to 0 during bulk updates
    const { data: affectedLogs, error } = await supabase
      .from('audit_logs')
      .select('application_id, field, previous_value, new_value, created_at')
      .in('field', [
        'principle_due (Bulk Upload)',
        'interest_due (Bulk Upload)', 
        'emi_amount (Bulk Upload)',
        'last_month_bounce (Bulk Upload)'
      ])
      .eq('new_value', '0')
      .neq('previous_value', '0')
      .gte('created_at', '2024-06-01') // Adjust date as needed
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit logs:', error);
      return { success: false, error: error.message };
    }

    console.log('Found affected records:', affectedLogs?.length || 0);

    if (!affectedLogs || affectedLogs.length === 0) {
      return { success: true, message: 'No affected records found', recoveredCount: 0 };
    }

    // Group by application_id to get the most recent valid values
    const recoveryData: Record<string, Record<string, string>> = {};
    
    affectedLogs.forEach(log => {
      if (!recoveryData[log.application_id]) {
        recoveryData[log.application_id] = {};
      }
      
      // Map field names to database column names
      const fieldMapping: Record<string, string> = {
        'principle_due (Bulk Upload)': 'principle_due',
        'interest_due (Bulk Upload)': 'interest_due',
        'emi_amount (Bulk Upload)': 'emi_amount',
        'last_month_bounce (Bulk Upload)': 'last_month_bounce'
      };
      
      const dbField = fieldMapping[log.field];
      if (dbField && log.previous_value && log.previous_value !== '0') {
        recoveryData[log.application_id][dbField] = log.previous_value;
      }
    });

    console.log('Recovery data prepared for applications:', Object.keys(recoveryData).length);

    // Apply recovery updates
    let recoveredCount = 0;
    const errors: string[] = [];

    for (const [applicationId, updates] of Object.entries(recoveryData)) {
      try {
        const { error: updateError } = await supabase
          .from('applications')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('applicant_id', applicationId);

        if (updateError) {
          console.error(`Error recovering data for ${applicationId}:`, updateError);
          errors.push(`Failed to recover ${applicationId}: ${updateError.message}`);
        } else {
          console.log(`Successfully recovered data for ${applicationId}:`, updates);
          recoveredCount++;

          // Add audit log for recovery
          for (const [field, value] of Object.entries(updates)) {
            await supabase
              .from('audit_logs')
              .insert({
                field: `${field} (Data Recovery)`,
                previous_value: '0',
                new_value: value,
                application_id: applicationId,
                user_id: 'system',
                user_email: 'system@data-recovery.local'
              });
          }
        }
      } catch (error) {
        console.error(`Unexpected error recovering ${applicationId}:`, error);
        errors.push(`Unexpected error for ${applicationId}: ${error}`);
      }
    }

    return {
      success: true,
      recoveredCount,
      totalAffected: Object.keys(recoveryData).length,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('Error in recovery process:', error);
    return { success: false, error: String(error) };
  }
};

// Function to get preview of what will be recovered
export const getRecoveryPreview = async () => {
  try {
    const { data: affectedLogs, error } = await supabase
      .from('audit_logs')
      .select('application_id, field, previous_value, new_value, created_at')
      .in('field', [
        'principle_due (Bulk Upload)',
        'interest_due (Bulk Upload)', 
        'emi_amount (Bulk Upload)',
        'last_month_bounce (Bulk Upload)'
      ])
      .eq('new_value', '0')
      .neq('previous_value', '0')
      .gte('created_at', '2024-06-01')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const preview = affectedLogs?.reduce((acc, log) => {
      if (!acc[log.application_id]) {
        acc[log.application_id] = {};
      }
      
      const fieldMapping: Record<string, string> = {
        'principle_due (Bulk Upload)': 'principle_due',
        'interest_due (Bulk Upload)': 'interest_due',
        'emi_amount (Bulk Upload)': 'emi_amount',
        'last_month_bounce (Bulk Upload)': 'last_month_bounce'
      };
      
      const dbField = fieldMapping[log.field];
      if (dbField) {
        acc[log.application_id][dbField] = {
          current: log.new_value,
          willRecover: log.previous_value
        };
      }
      
      return acc;
    }, {} as Record<string, any>) || {};

    return {
      success: true,
      preview,
      affectedApplications: Object.keys(preview).length
    };

  } catch (error) {
    return { success: false, error: String(error) };
  }
};
