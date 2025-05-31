
import { supabase } from '@/integrations/supabase/client';

// Utility to update missing PTP dates based on audit log analysis
export const updateMissingPtpDates = async () => {
  console.log('=== UPDATING MISSING PTP DATES ===');
  
  const updates = [
    {
      applicant_id: 'PROSAPP250425000016', // Jitendra Kumar
      ptp_date: '2025-05-03T00:00:00.000Z',
      applicant_name: 'Jitendra Kumar'
    },
    {
      applicant_id: 'PROSAPP250502000104', // Mahesh
      ptp_date: '2025-05-03T00:00:00.000Z', 
      applicant_name: 'Mahesh'
    }
  ];

  for (const update of updates) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({ ptp_date: update.ptp_date })
        .eq('applicant_id', update.applicant_id)
        .select();

      if (error) {
        console.error(`Error updating PTP date for ${update.applicant_name}:`, error);
      } else {
        console.log(`✓ Updated PTP date for ${update.applicant_name} (${update.applicant_id})`);
      }
    } catch (error) {
      console.error(`Exception updating PTP date for ${update.applicant_name}:`, error);
    }
  }
};

// Call this function to apply the missing updates
// updateMissingPtpDates();
