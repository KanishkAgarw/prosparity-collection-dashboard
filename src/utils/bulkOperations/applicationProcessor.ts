
import { supabase } from '@/integrations/supabase/client';

export interface ProcessingResults {
  successful: number;
  failed: number;
  updated: number;
  statusUpdated: number;
  errors: string[];
}

export const processApplicationBatch = async (applications: any[], user?: any): Promise<ProcessingResults> => {
  console.log('Processing bulk applications:', applications.length);
  
  const results: ProcessingResults = {
    successful: 0,
    failed: 0,
    updated: 0,
    statusUpdated: 0,
    errors: []
  };

  const validStatuses = ['Unpaid', 'Partially Paid', 'Cash Collected from Customer', 'Customer Deposited to Bank', 'Paid'];

  for (const app of applications) {
    try {
      const { status: statusFromTemplate, uploadMode, ...applicationData } = app;
      
      if (statusFromTemplate && !validStatuses.includes(statusFromTemplate)) {
        console.warn(`Invalid status value: ${statusFromTemplate}. Using 'Unpaid' as default.`);
      }

      const { data: existingApp } = await supabase
        .from('applications')
        .select('id, applicant_id')
        .eq('applicant_id', app.applicant_id)
        .maybeSingle();

      const appExists = !!existingApp;

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
        await updateExistingApplication(app, applicationData, statusFromTemplate, validStatuses, user, results);
      } else {
        await createNewApplication(app, applicationData, statusFromTemplate, validStatuses, user, results);
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

const updateExistingApplication = async (
  app: any, 
  applicationData: any, 
  statusFromTemplate: string,
  validStatuses: string[],
  user: any,
  results: ProcessingResults
) => {
  console.log(`Updating existing application: ${app.applicant_id}`);
  
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

    if (statusFromTemplate && validStatuses.includes(statusFromTemplate) && user) {
      try {
        const { updateFieldStatusFromBulk } = await import('./statusUpdater');
        await updateFieldStatusFromBulk(app.applicant_id, statusFromTemplate, user);
        results.statusUpdated++;
        console.log(`Status updated for existing application: ${app.applicant_id}`);
      } catch (statusError) {
        console.error('Error updating status for existing application:', statusError);
        results.errors.push(`Failed to update status for ${app.applicant_id}: ${statusError}`);
      }
    }
  }
};

const createNewApplication = async (
  app: any,
  applicationData: any,
  statusFromTemplate: string,
  validStatuses: string[],
  user: any,
  results: ProcessingResults
) => {
  console.log(`Creating new application: ${app.applicant_id}`);
  
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

    try {
      const initialStatus = (statusFromTemplate && validStatuses.includes(statusFromTemplate)) 
        ? statusFromTemplate 
        : 'Unpaid';
      
      const { createInitialFieldStatus } = await import('./statusCreator');
      await createInitialFieldStatus(app.applicant_id, initialStatus, user);
      
      if (statusFromTemplate && validStatuses.includes(statusFromTemplate)) {
        results.statusUpdated++;
      }
    } catch (fieldStatusError) {
      console.error('Error creating field status:', fieldStatusError);
      results.errors.push(`Failed to create field status for ${app.applicant_id}: ${fieldStatusError}`);
    }
  }
};
