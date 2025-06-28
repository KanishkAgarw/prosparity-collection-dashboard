
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseOptimizedRealtimeUpdatesProps {
  onApplicationUpdate?: () => void;
  onStatusUpdate?: () => void;
  selectedEmiMonth?: string | null;
  currentApplicationIds?: string[];
}

export const useOptimizedRealtimeUpdates = ({
  onApplicationUpdate,
  onStatusUpdate,
  selectedEmiMonth,
  currentApplicationIds = []
}: UseOptimizedRealtimeUpdatesProps) => {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const isActiveRef = useRef(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Throttled update function to batch multiple rapid changes
  const throttledUpdate = useCallback((updateType: 'application' | 'status') => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        console.log(`Throttled ${updateType} update triggered`);
        if (updateType === 'application') {
          onApplicationUpdate?.();
        } else {
          onStatusUpdate?.();
        }
      }
    }, 1000); // 1 second throttle
  }, [onApplicationUpdate, onStatusUpdate]);

  useEffect(() => {
    if (!user || !selectedEmiMonth || currentApplicationIds.length === 0) {
      return;
    }

    console.log('=== SETTING UP OPTIMIZED REAL-TIME SUBSCRIPTIONS ===');
    console.log('Monitoring applications:', currentApplicationIds.slice(0, 5), '... and', currentApplicationIds.length - 5, 'more');

    // Handle visibility changes
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      if (!document.hidden) {
        console.log('Tab visible - resuming updates');
        // Trigger update after coming back to tab
        setTimeout(() => {
          if (isActiveRef.current) {
            onApplicationUpdate?.();
          }
        }, 500);
      } else {
        console.log('Tab hidden - pausing updates');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Create a single channel for all subscriptions
    const channel = supabase.channel(`optimized-updates-${selectedEmiMonth}`)
      
    // Only subscribe to collection changes for current month
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'collection',
        filter: `demand_date=gte.${selectedEmiMonth}-01,demand_date=lte.${selectedEmiMonth}-31`
      },
      (payload) => {
        if (isActiveRef.current && payload.new && currentApplicationIds.includes(payload.new.application_id)) {
          console.log('Collection update for visible application:', payload.new.application_id);
          throttledUpdate('application');
        }
      }
    )
    
    // Subscribe to field_status changes for current applications only
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'field_status'
      },
      (payload) => {
        if (isActiveRef.current && payload.new && currentApplicationIds.includes(payload.new.application_id)) {
          console.log('Status update for visible application:', payload.new.application_id);
          throttledUpdate('status');
        }
      }
    )
    
    // Subscribe to PTP changes for current applications
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ptp_dates'
      },
      (payload) => {
        if (isActiveRef.current && payload.new && currentApplicationIds.includes(payload.new.application_id)) {
          console.log('PTP update for visible application:', payload.new.application_id);
          throttledUpdate('status');
        }
      }
    )
    
    .subscribe((status) => {
      console.log('Optimized realtime subscription status:', status);
    });

    channelRef.current = channel;

    return () => {
      console.log('🧹 Cleaning up optimized real-time subscriptions');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, selectedEmiMonth, currentApplicationIds, throttledUpdate]);

  return {
    isActive: isActiveRef.current,
    connectionActive: !!channelRef.current
  };
};
