
import { supabase } from '@/integrations/supabase/client';

export const createFieldStatus = async (applicationId: string, status: string, userId: any, userEmail: any, demandDate: string) => {
  await supabase
    .from('field_status')
    .insert({
      application_id: applicationId,
      status: status,
      user_id: userId,
      user_email: userEmail,
      demand_date: demandDate,
      updated_at: new Date().toISOString(),
    });
};

export const createAuditLog = async (
  applicationId: string,
  field: string,
  previousValue: string,
  newValue: string,
  userId: any,
  userEmail: any,
  demandDate: string
) => {
  await supabase
    .from('audit_logs')
    .insert({
      field: field,
      previous_value: previousValue,
      new_value: newValue,
      application_id: applicationId,
      user_id: userId,
      user_email: userEmail,
      demand_date: demandDate,
    });
};
