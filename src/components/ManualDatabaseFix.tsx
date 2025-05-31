
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ManualDatabaseFix = () => {
  const [isFixing, setIsFixing] = useState(false);

  const handleManualFix = async () => {
    setIsFixing(true);
    try {
      console.log('=== STARTING MANUAL DATABASE FIX ===');
      
      // Fix 1: Update Jamil Khan's PTP date to 2025-05-03
      console.log('Fixing Jamil Khan PTP date...');
      const { data: ptpUpdateResult, error: ptpError } = await supabase
        .from('applications')
        .update({ 
          ptp_date: '2025-05-03T00:00:00.000Z',
          updated_at: new Date().toISOString()
        })
        .eq('applicant_name', 'Jamil Khan')
        .select('applicant_name, ptp_date');

      if (ptpError) {
        console.error('PTP update error:', ptpError);
        toast.error(`PTP update failed: ${ptpError.message}`);
      } else {
        console.log('PTP update success:', ptpUpdateResult);
        toast.success('PTP date updated successfully');
      }

      // Fix 2: Update Manish's profile with full_name
      console.log('Fixing Manish profile...');
      const { data: profileUpdateResult, error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: 'Manish',
          updated_at: new Date().toISOString()
        })
        .eq('id', '5c44a519-bdad-45b1-ad24-612fabd4a4a8')
        .select('id, full_name, email');

      if (profileError) {
        console.error('Profile update error:', profileError);
        toast.error(`Profile update failed: ${profileError.message}`);
      } else {
        console.log('Profile update success:', profileUpdateResult);
        toast.success('Profile updated successfully');
      }

      // Fix 3: Verify the updates
      console.log('=== VERIFICATION ===');
      
      // Verify PTP date
      const { data: verifyApp, error: verifyAppError } = await supabase
        .from('applications')
        .select('applicant_name, ptp_date')
        .eq('applicant_name', 'Jamil Khan')
        .single();

      console.log('Jamil Khan verification:', { data: verifyApp, error: verifyAppError });

      // Verify profile
      const { data: verifyProfile, error: verifyProfileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', '5c44a519-bdad-45b1-ad24-612fabd4a4a8')
        .single();

      console.log('Manish profile verification:', { data: verifyProfile, error: verifyProfileError });

      toast.success('Manual database fix completed! Check console for verification.');

    } catch (error) {
      console.error('Manual fix error:', error);
      toast.error(`Manual fix failed: ${error.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="text-red-600">Manual Database Fix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>This will:</strong></p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Update Jamil Khan's PTP date to 2025-05-03</li>
              <li>Update user 5c44a519... full_name to "Manish"</li>
              <li>Verify both updates worked</li>
            </ul>
          </div>
          <Button 
            onClick={handleManualFix} 
            disabled={isFixing}
            variant="destructive"
            className="w-full"
          >
            {isFixing ? 'Fixing Database...' : 'Run Manual Database Fix'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualDatabaseFix;
