
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';
import { FilterState } from '@/types/filters';

interface UseOptimizedApplicationsV2Props {
  filters: FilterState;
  searchTerm: string;
  page: number;
  pageSize: number;
  selectedEmiMonth?: string | null;
}

interface ApplicationsResponse {
  applications: Application[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

// Utility function to normalize EMI month format
const normalizeEmiMonth = (emiMonth: string): string => {
  if (!emiMonth) return '';
  
  // Check if it's an Excel serial number (numeric string)
  const numericValue = parseFloat(emiMonth);
  if (!isNaN(numericValue) && numericValue > 25000 && numericValue < 100000) {
    // Excel serial date conversion
    const excelEpoch = new Date(1900, 0, 1);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const date = new Date(excelEpoch.getTime() + (numericValue - 2) * millisecondsPerDay);
    return date.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
  }
  
  // If it's already in YYYY-MM format, return as is
  if (emiMonth.match(/^\d{4}-\d{2}$/)) {
    return emiMonth;
  }
  
  // If it's in YYYY-MM-DD format, extract YYYY-MM
  if (emiMonth.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return emiMonth.substring(0, 7);
  }
  
  return emiMonth;
};

export const useOptimizedApplicationsV2 = ({
  filters,
  searchTerm,
  page,
  pageSize,
  selectedEmiMonth
}: UseOptimizedApplicationsV2Props): ApplicationsResponse => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    if (!user || !selectedEmiMonth) {
      setApplications([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching applications with:', { 
        filters, 
        searchTerm, 
        page, 
        pageSize, 
        selectedEmiMonth 
      });

      const normalizedMonth = normalizeEmiMonth(selectedEmiMonth);

      // Build query for applications table
      let applicationsQuery = supabase
        .from('applications')
        .select('*')
        .eq('demand_date', normalizedMonth);

      // Build query for collection table
      let collectionQuery = supabase
        .from('collection')
        .select(`
          application_id,
          demand_date,
          emi_amount,
          amount_collected,
          lms_status,
          collection_rm,
          team_lead,
          rm_name,
          repayment,
          last_month_bounce
        `)
        .eq('demand_date', normalizedMonth);

      // Apply filters to both queries
      if (filters.branch?.length > 0) {
        applicationsQuery = applicationsQuery.in('branch_name', filters.branch);
      }
      if (filters.teamLead?.length > 0) {
        applicationsQuery = applicationsQuery.in('team_lead', filters.teamLead);
        collectionQuery = collectionQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        applicationsQuery = applicationsQuery.in('rm_name', filters.rm);
        collectionQuery = collectionQuery.in('rm_name', filters.rm);
      }
      if (filters.collectionRm?.length > 0) {
        // Normalize collection RM values - treat N/A and NA as the same
        const normalizedCollectionRms = filters.collectionRm.map(rm => 
          rm === 'N/A' || rm === 'NA' ? 'N/A' : rm
        );
        applicationsQuery = applicationsQuery.or(
          `collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`
        );
        collectionQuery = collectionQuery.or(
          `collection_rm.in.(${normalizedCollectionRms.join(',')}),collection_rm.is.null`
        );
      }
      if (filters.repayment?.length > 0) {
        applicationsQuery = applicationsQuery.in('repayment', filters.repayment);
        collectionQuery = collectionQuery.in('repayment', filters.repayment);
      }
      if (filters.vehicleStatus?.length > 0) {
        if (filters.vehicleStatus.includes('None')) {
          applicationsQuery = applicationsQuery.or(`vehicle_status.is.null,vehicle_status.in.(${filters.vehicleStatus.filter(v => v !== 'None').join(',')})`);
        } else {
          applicationsQuery = applicationsQuery.in('vehicle_status', filters.vehicleStatus);
        }
      }

      // Apply search if provided
      if (searchTerm.trim()) {
        applicationsQuery = applicationsQuery.or(`applicant_name.ilike.%${searchTerm}%,applicant_id.ilike.%${searchTerm}%,applicant_mobile.ilike.%${searchTerm}%`);
        collectionQuery = collectionQuery.or(`application_id.ilike.%${searchTerm}%`);
      }

      // Fetch data from both tables
      const [applicationsResult, collectionResult] = await Promise.all([
        applicationsQuery,
        collectionQuery
      ]);

      if (applicationsResult.error) {
        console.error('Error fetching applications:', applicationsResult.error);
        throw applicationsResult.error;
      }

      if (collectionResult.error) {
        console.error('Error fetching collection:', collectionResult.error);
        throw collectionResult.error;
      }

      // Combine and deduplicate data
      const applicationsMap = new Map();
      
      // Add applications data
      (applicationsResult.data || []).forEach(app => {
        applicationsMap.set(app.applicant_id, {
          ...app,
          id: app.id || app.applicant_id,
          field_status: 'Unpaid',
        });
      });

      // Add collection data (merge with existing or create new entries)
      (collectionResult.data || []).forEach(col => {
        const existing = applicationsMap.get(col.application_id);
        if (existing) {
          // Merge collection data with existing application
          applicationsMap.set(col.application_id, {
            ...existing,
            emi_amount: col.emi_amount || existing.emi_amount,
            amount_collected: col.amount_collected || existing.amount_collected,
            lms_status: col.lms_status || existing.lms_status,
            collection_rm: col.collection_rm || existing.collection_rm,
            team_lead: col.team_lead || existing.team_lead,
            rm_name: col.rm_name || existing.rm_name,
            repayment: col.repayment || existing.repayment,
            last_month_bounce: col.last_month_bounce || existing.last_month_bounce
          });
        } else {
          // Create new entry from collection data
          applicationsMap.set(col.application_id, {
            id: col.application_id,
            applicant_id: col.application_id,
            demand_date: col.demand_date,
            emi_amount: col.emi_amount || 0,
            amount_collected: col.amount_collected || 0,
            lms_status: col.lms_status || 'Unpaid',
            collection_rm: col.collection_rm || 'N/A',
            team_lead: col.team_lead || '',
            rm_name: col.rm_name || '',
            repayment: col.repayment || '',
            last_month_bounce: col.last_month_bounce || 0,
            field_status: 'Unpaid',
            // Default values for missing application fields
            applicant_name: 'Unknown',
            applicant_mobile: '',
            applicant_address: '',
            branch_name: '',
            dealer_name: '',
            lender_name: '',
            principle_due: 0,
            interest_due: 0,
            loan_amount: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user.id
          });
        }
      });

      const allApplications = Array.from(applicationsMap.values());
      const totalCount = allApplications.length;
      setTotalCount(totalCount);

      // Apply pagination
      const offset = (page - 1) * pageSize;
      const paginatedApplications = allApplications.slice(offset, offset + pageSize);

      console.log(`Fetched ${paginatedApplications.length} applications (page ${page}/${Math.ceil(totalCount / pageSize)}) - Total: ${totalCount}`);
      
      setApplications(paginatedApplications);

    } catch (error) {
      console.error('Error in fetchApplications:', error);
      setApplications([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [user, selectedEmiMonth, filters, searchTerm, page, pageSize]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  // Refetch function for external use
  const refetch = useCallback(async () => {
    await fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    totalCount,
    totalPages,
    loading,
    refetch
  };
};
