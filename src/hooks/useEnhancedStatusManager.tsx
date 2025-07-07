
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
      console.log('=== ENHANCED STATUS MANAGER DEBUG ===');
      console.log('Application IDs:', applicationIds.length, 'first few:', applicationIds.slice(0, 3));
      console.log('Options:', options);
      console.log('Selected Month:', options.selectedMonth);

      // Fetch both field status and collection status in parallel
      const [fieldStatusData, collectionStatusData] = await Promise.allSettled([
        fetchFieldStatus(applicationIds, options.selectedMonth, options.includeAllMonths),
        fetchCollectionStatus(applicationIds, options.selectedMonth)
      ]);

      const fieldStatuses = fieldStatusData.status === 'fulfilled' ? fieldStatusData.value : {};
      const collectionStatuses = collectionStatusData.status === 'fulfilled' ? collectionStatusData.value : {};

      console.log('📊 Raw data fetched:');
      console.log('- Field statuses:', Object.keys(fieldStatuses).length, 'records');
      console.log('- Collection statuses:', Object.keys(collectionStatuses).length, 'records');
      
      // Debug specific application from screenshot
      const debugAppId = 'PROSAPP240926000003';
      if (applicationIds.includes(debugAppId)) {
        console.log(`🔍 DEBUG for ${debugAppId}:`);
        console.log('- Field status:', fieldStatuses[debugAppId]);
        console.log('- Collection status:', collectionStatuses[debugAppId]);
      }

      // Merge statuses with STRICT priority logic:
      // 1. If collection.lms_status is "Paid", use that (HIGHEST PRIORITY)
      // 2. Otherwise, use field_status if available
      // 3. Fall back to collection.lms_status if no field_status
      // 4. Default to "Unpaid" if nothing available
      const enhancedStatuses: Record<string, string> = {};

      applicationIds.forEach(appId => {
        const collectionStatus = collectionStatuses[appId];
        const fieldStatus = fieldStatuses[appId];

        let finalStatus: string;

        // STRICT PRIORITY: Collection "Paid" always wins
        if (collectionStatus === 'Paid') {
          finalStatus = 'Paid';
          console.log(`✅ ${appId}: Collection status "Paid" takes priority`);
        } else if (fieldStatus && fieldStatus !== 'Unpaid') {
          // Use field status if it's not just the default "Unpaid"
          finalStatus = fieldStatus;
          console.log(`📝 ${appId}: Using field status "${fieldStatus}"`);
        } else if (collectionStatus) {
          // Fall back to collection status
          finalStatus = collectionStatus;
          console.log(`📦 ${appId}: Using collection status "${collectionStatus}"`);
        } else {
          // Default fallback
          finalStatus = 'Unpaid';
          console.log(`⚪ ${appId}: Default to "Unpaid"`);
        }

        enhancedStatuses[appId] = finalStatus;

        // Extra debug for the specific application
        if (appId === debugAppId) {
          console.log(`🎯 FINAL STATUS for ${debugAppId}: "${finalStatus}"`);
          console.log(`   - Collection status: "${collectionStatus}"`);
          console.log(`   - Field status: "${fieldStatus}"`);
          console.log(`   - Logic used: ${collectionStatus === 'Paid' ? 'Collection Paid Priority' : fieldStatus ? 'Field Status' : collectionStatus ? 'Collection Status' : 'Default'}`);
        }
      });

      console.log('✅ Enhanced status merge complete:', {
        fieldStatuses: Object.keys(fieldStatuses).length,
        collectionStatuses: Object.keys(collectionStatuses).length,
        enhancedStatuses: Object.keys(enhancedStatuses).length,
        paidFromCollection: Object.values(collectionStatuses).filter(s => s === 'Paid').length,
        finalPaidCount: Object.values(enhancedStatuses).filter(s => s === 'Paid').length
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
