
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseRealtimeUpdatesProps {
  onApplicationUpdate?: () => void;
  onCallingLogUpdate?: () => void;
  onAuditLogUpdate?: () => void;
  onCommentUpdate?: () => void;
  onPtpDateUpdate?: () => void;
}

export const useRealtimeUpdates = ({
  onApplicationUpdate,
  onCallingLogUpdate,
  onAuditLogUpdate,
  onCommentUpdate,
  onPtpDateUpdate
}: UseRealtimeUpdatesProps) => {
  const { user } = useAuth();
  const channelsRef = useRef<any[]>([]);
  const isActiveRef = useRef(true);

  useEffect(() => {
    if (!user) return;

    console.log('=== SETTING UP OPTIMIZED REAL-TIME SUBSCRIPTIONS ===');

    // Track page visibility to pause/resume connections
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      
      if (document.hidden) {
        console.log('🛑 Tab hidden - pausing real-time updates');
        // Don't unsubscribe, just mark as inactive to reduce processing
      } else {
        console.log('👁️ Tab visible - resuming real-time updates');
        // Trigger a refresh when tab becomes active again
        setTimeout(() => {
          if (isActiveRef.current) {
            onApplicationUpdate?.();
          }
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Create optimized real-time subscriptions
    const createSubscription = (tableName: string, callback: () => void) => {
      return supabase
        .channel(`${tableName}-changes-optimized`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName
          },
          (payload) => {
            // Only process updates if tab is active
            if (isActiveRef.current) {
              console.log(`✅ ${tableName} update received:`, payload);
              callback();
            } else {
              console.log(`⏸️ ${tableName} update received but tab inactive`);
            }
          }
        )
        .subscribe();
    };

    // Subscribe to critical tables only
    const subscriptions = [
      createSubscription('ptp_dates', () => {
        onPtpDateUpdate?.();
        // Small delay to ensure database consistency
        setTimeout(() => {
          if (isActiveRef.current) {
            onApplicationUpdate?.();
          }
        }, 300);
      }),
      
      createSubscription('audit_logs', () => {
        onAuditLogUpdate?.();
      }),
      
      createSubscription('applications', () => {
        onApplicationUpdate?.();
      }),
      
      createSubscription('calling_logs', () => {
        onCallingLogUpdate?.();
      }),
      
      createSubscription('contact_calling_status', () => {
        onCallingLogUpdate?.();
      }),
      
      createSubscription('comments', () => {
        onCommentUpdate?.();
      })
    ];

    channelsRef.current = subscriptions;

    return () => {
      console.log('🧹 Cleaning up optimized real-time subscriptions');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscriptions.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [user, onApplicationUpdate, onCallingLogUpdate, onAuditLogUpdate, onCommentUpdate, onPtpDateUpdate]);

  // Return current connection status
  return {
    isActive: isActiveRef.current,
    connectionCount: channelsRef.current.length
  };
};
