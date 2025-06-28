
import { supabase } from '@/integrations/supabase/client';

export const updateFieldStatusFromBulk = async (applicationId: string, newStatus: string, user: any, demandDate?: string) => {
  try {
    console.log(`Updating field status for ${applicationId} to ${newStatus}`);
    
    const currentDemandDate = demandDate || new Date().toISOString().split('T')[0];
    
    const { data: currentStatus } = await supabase
      .from('field_status')
      .select('status')
      .eq('application_id', applicationId)
      .eq('demand_date', currentDemandDate)
      .maybeSingle();

    const previousStatus = currentStatus?.status || 'Unpaid';

    if (previousStatus === newStatus) {
      console.log(`Status for ${applicationId} is already ${newStatus}, skipping update`);
      return;
    }

    const { error } = await supabase
      .from('field_status')
      .upsert({
        application_id: applicationId,
        status: newStatus,
        user_id: user.id,
        user_email: user.email,
        demand_date: currentDemandDate,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'application_id,demand_date'
      });

    if (error) {
      console.error('Error updating field status:', error);
      throw error;
    }

    await supabase
      .from('audit_logs')
      .insert({
        field: 'Status (Bulk Upload)',
        previous_value: previousStatus,
        new_value: newStatus,
        application_id: applicationId,
        user_id: user.id,
        user_email: user.email,
        demand_date: currentDemandDate
      });

    console.log(`Successfully updated status for ${applicationId}: ${previousStatus} -> ${newStatus}`);
  } catch (error) {
    console.error('Error in updateFieldStatusFromBulk:', error);
    throw error;
  }
};
