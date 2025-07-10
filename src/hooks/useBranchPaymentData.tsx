
import { useState, useEffect } from 'react';
import { Application } from '@/types/application';
import { supabase } from '@/integrations/supabase/client';
import { getMonthDateRange, convertEmiMonthToDatabase } from '@/utils/dateUtils';

export interface PaymentStatusRow {
  rm_name: string;
  branch_name: string;
  unpaid: number;
  partially_paid: number;
  paid_pending_approval: number;
  paid: number;
  others: number;
  total: number;
}

export interface BranchPaymentStatus {
  branch_name: string;
  total_stats: PaymentStatusRow;
  rm_stats: PaymentStatusRow[];
}

export const useBranchPaymentData = (applications: Application[], selectedEmiMonth?: string) => {
  const [data, setData] = useState<BranchPaymentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPaymentData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('📊 Fetching optimized payment data for month:', selectedEmiMonth);
        
        // Use a single optimized query to get all the data we need
        let query = supabase
          .from('applications')
          .select(`
            applicant_id,
            branch_name,
            rm_name,
            collection_rm,
            lms_status,
            demand_date
          `);

        // Apply month filtering if specified
        if (selectedEmiMonth && selectedEmiMonth !== 'All') {
          const dbFormatMonth = convertEmiMonthToDatabase(selectedEmiMonth);
          if (!dbFormatMonth || !dbFormatMonth.match(/^\d{4}-\d{2}$/)) {
            console.error('Invalid month format after conversion:', dbFormatMonth);
            throw new Error(`Invalid month format: ${selectedEmiMonth}`);
          }
          
          const { start, end } = getMonthDateRange(dbFormatMonth);
          console.log('📊 Date range for payment data:', { start, end });
          query = query.gte('demand_date', start).lte('demand_date', end);
        }

        const { data: applications, error: appError } = await query;

        if (appError) {
          console.error('Error fetching applications:', appError);
          throw new Error(`Failed to fetch applications: ${appError.message}`);
        }

        if (!applications || applications.length === 0) {
          console.log('No applications found for month:', selectedEmiMonth);
          setData([]);
          return;
        }

        console.log(`Found ${applications.length} applications for ${selectedEmiMonth}`);

        // Get field status in a single optimized query
        const dbFormatMonth = selectedEmiMonth && selectedEmiMonth !== 'All' ? convertEmiMonthToDatabase(selectedEmiMonth) : undefined;
        let statusQuery = supabase
          .from('field_status')
          .select('application_id, status')
          .in('application_id', applications.map(app => app.applicant_id));

        if (dbFormatMonth) {
          const { start, end } = getMonthDateRange(dbFormatMonth);
          statusQuery = statusQuery.gte('created_at', start).lte('created_at', end + 'T23:59:59.999Z');
        }

        const { data: fieldStatusData, error: statusError } = await statusQuery
          .order('created_at', { ascending: false });

        if (statusError) {
          console.error('Error fetching field status:', statusError);
          // Continue with applications data only, using lms_status
        }

        // Create status map (latest status per application)
        const statusMap = new Map<string, string>();
        if (fieldStatusData) {
          fieldStatusData.forEach(status => {
            if (!statusMap.has(status.application_id)) {
              statusMap.set(status.application_id, status.status);
            }
          });
        }

        console.log('🔍 Field status map loaded:', statusMap.size, 'applications');
        
        const branchMap = new Map<string, BranchPaymentStatus>();
        
        // Process applications directly (much faster than collection join)
        applications.forEach(app => {
          const branchName = app.branch_name || 'Unknown Branch';
          const rmName = app.collection_rm || app.rm_name || 'Unknown RM';
          
          // Get status from field_status map, fallback to lms_status
          const fieldStatus = statusMap.get(app.applicant_id) || app.lms_status || 'Unpaid';
          
          if (!branchMap.has(branchName)) {
            branchMap.set(branchName, {
              branch_name: branchName,
              total_stats: {
                rm_name: branchName,
                branch_name: branchName,
                unpaid: 0,
                partially_paid: 0,
                paid_pending_approval: 0,
                paid: 0,
                others: 0,
                total: 0
              },
              rm_stats: []
            });
          }
          
          const branch = branchMap.get(branchName)!;
          
          let rmStats = branch.rm_stats.find(rm => rm.rm_name === rmName);
          if (!rmStats) {
            rmStats = {
              rm_name: rmName,
              branch_name: branchName,
              unpaid: 0,
              partially_paid: 0,
              paid_pending_approval: 0,
              paid: 0,
              others: 0,
              total: 0
            };
            branch.rm_stats.push(rmStats);
          }
          
          rmStats.total++;
          branch.total_stats.total++;
          
          // Update counts based on field status
          
          switch (fieldStatus) {
            case 'Unpaid':
              rmStats.unpaid++;
              branch.total_stats.unpaid++;
              break;
            case 'Partially Paid':
              rmStats.partially_paid++;
              branch.total_stats.partially_paid++;
              break;
            case 'Paid (Pending Approval)':
              rmStats.paid_pending_approval++;
              branch.total_stats.paid_pending_approval++;
              break;
            case 'Paid':
              rmStats.paid++;
              branch.total_stats.paid++;
              break;
            case 'Cash Collected from Customer':
            case 'Customer Deposited to Bank':
            default:
              rmStats.others++;
              branch.total_stats.others++;
              break;
          }
        });
        
        const result = Array.from(branchMap.values())
          .map(branch => ({
            ...branch,
            rm_stats: branch.rm_stats.sort((a, b) => b.total - a.total)
          }))
          .sort((a, b) => b.total_stats.total - a.total_stats.total);
          
        console.log('📈 Payment data processing complete. Final status distribution:');
        result.forEach(branch => {
          console.log(`Branch ${branch.branch_name}:`, {
            unpaid: branch.total_stats.unpaid,
            partially_paid: branch.total_stats.partially_paid,
            paid_pending_approval: branch.total_stats.paid_pending_approval,
            paid: branch.total_stats.paid,
            others: branch.total_stats.others,
            total: branch.total_stats.total
          });
        });
        
        setData(result);
      } catch (err) {
        console.error('Error in fetchPaymentData:', err);
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (applications && applications.length > 0) {
      fetchPaymentData();
    } else {
      console.log('No applications provided to useBranchPaymentData');
      setData([]);
      setLoading(false);
    }
  }, [selectedEmiMonth, applications]);

  return { data, loading, error };
};
