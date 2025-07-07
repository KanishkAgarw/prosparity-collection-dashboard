
import { useState, useCallback, useRef } from 'react';
import { useFieldStatusManager } from '@/hooks/useFieldStatusManager';
import { useCollectionStatusManager } from '@/hooks/useCollectionStatusManager';

interface EnhancedStatusOptions {
  selectedMonth?: string | null;
  includeAllMonths?: boolean;
}

export const useEnhancedStatusManager = () => {
  const { fetchFieldStatus, loading: fieldLoading } = useFieldStatusManager();
  const { fetchCollectionStatus, loading: collectionLoading } = useCollectionStatusManager();
  const [loading, setLoading] = useState(false);

  const fetchEnhancedStatus = useCallback(async (
    applicationIds: string[],
    options: EnhancedStatusOptions = {}
  ): Promise<Record<string, string>> => {
    if (applicationIds.length === 0) return {};

    setLoading(true);
    
    try {
      console.log('=== ENHANCED STATUS MANAGER ===');
      console.log('Application IDs:', applicationIds.length);
      console.log('Options:', options);

      // Fetch both field status and collection status in parallel
      const [fieldStatusData, collectionStatusData] = await Promise.allSettled([
        fetchFieldStatus(applicationIds, options.selectedMonth, options.includeAllMonths),
        fetchCollectionStatus(applicationIds, options.selectedMonth)
      ]);

      const fieldStatuses = fieldStatusData.status === 'fulfilled' ? fieldStatusData.value : {};
      const collectionStatuses = collectionStatusData.status === 'fulfilled' ? collectionStatusData.value : {};

      // Merge statuses with priority logic:
      // 1. If collection.lms_status is "Paid", use that
      // 2. Otherwise, use field_status if available
      // 3. Fall back to collection.lms_status if no field_status
      // 4. Default to "Unpaid" if nothing available
      const enhancedStatuses: Record<string, string> = {};

      applicationIds.forEach(appId => {
        const collectionStatus = collectionStatuses[appId];
        const fieldStatus = fieldStatuses[appId];

        if (collectionStatus === 'Paid') {
          // Collection status "Paid" takes highest priority
          enhancedStatuses[appId] = 'Paid';
        } else if (fieldStatus) {
          // Use field status if available
          enhancedStatuses[appId] = fieldStatus;
        } else if (collectionStatus) {
          // Fall back to collection status
          enhancedStatuses[appId] = collectionStatus;
        } else {
          // Default fallback
          enhancedStatuses[appId] = 'Unpaid';
        }
      });

      console.log('✅ Enhanced status merge complete:', {
        fieldStatuses: Object.keys(fieldStatuses).length,
        collectionStatuses: Object.keys(collectionStatuses).length,
        enhancedStatuses: Object.keys(enhancedStatuses).length,
        paidFromCollection: Object.values(collectionStatuses).filter(s => s === 'Paid').length
      });

      return enhancedStatuses;
    } catch (error) {
      console.error('❌ Error in enhanced status fetch:', error);
      // Return empty object on error
      return {};
    } finally {
      setLoading(false);
    }
  }, [fetchFieldStatus, fetchCollectionStatus]);

  return {
    fetchEnhancedStatus,
    loading: loading || fieldLoading || collectionLoading
  };
};
