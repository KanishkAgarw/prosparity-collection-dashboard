
import { useEffect } from 'react';
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

  useEffect(() => {
    if (!user) return;

    console.log('=== SETTING UP ENHANCED REAL-TIME SUBSCRIPTIONS ===');

    // Subscribe to PTP dates changes - CRITICAL for immediate updates
    const ptpDatesChannel = supabase
      .channel('ptp-dates-changes-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ptp_dates'
        },
        (payload) => {
          console.log('✅ PTP date update received:', payload);
          // Trigger multiple updates to ensure UI consistency
          onPtpDateUpdate?.();
          onApplicationUpdate?.(); // Also trigger app update for main list
          // Small delay to ensure database consistency
          setTimeout(() => {
            onApplicationUpdate?.();
          }, 500);
        }
      )
      .subscribe();

    // Subscribe to audit logs changes - CRITICAL for PTP date logging
    const auditLogsChannel = supabase
      .channel('audit-logs-changes-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          console.log('✅ Audit log update received:', payload);
          onAuditLogUpdate?.();
          // If this is a PTP-related audit log, also refresh main list
          if (payload.new && typeof payload.new === 'object' && 'field' in payload.new && payload.new.field === 'PTP Date') {
            onApplicationUpdate?.();
          }
        }
      )
      .subscribe();

    // Subscribe to application changes
    const applicationsChannel = supabase
      .channel('applications-changes-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications'
        },
        (payload) => {
          console.log('✅ Application update received:', payload);
          onApplicationUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to calling logs changes
    const callingLogsChannel = supabase
      .channel('calling-logs-changes-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calling_logs'
        },
        (payload) => {
          console.log('✅ Calling log update received:', payload);
          onCallingLogUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to contact calling status changes
    const contactStatusChannel = supabase
      .channel('contact-status-changes-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_calling_status'
        },
        (payload) => {
          console.log('✅ Contact status update received:', payload);
          onCallingLogUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel('comments-changes-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        (payload) => {
          console.log('✅ Comment update received:', payload);
          onCommentUpdate?.();
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up enhanced real-time subscriptions');
      supabase.removeChannel(ptpDatesChannel);
      supabase.removeChannel(auditLogsChannel);
      supabase.removeChannel(applicationsChannel);
      supabase.removeChannel(callingLogsChannel);
      supabase.removeChannel(contactStatusChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [user, onApplicationUpdate, onCallingLogUpdate, onAuditLogUpdate, onCommentUpdate, onPtpDateUpdate]);
};
