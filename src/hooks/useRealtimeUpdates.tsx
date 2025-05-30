
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseRealtimeUpdatesProps {
  onApplicationUpdate?: () => void;
  onCallingLogUpdate?: () => void;
  onAuditLogUpdate?: () => void;
  onCommentUpdate?: () => void;
}

export const useRealtimeUpdates = ({
  onApplicationUpdate,
  onCallingLogUpdate,
  onAuditLogUpdate,
  onCommentUpdate
}: UseRealtimeUpdatesProps) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions');

    // Subscribe to application changes
    const applicationsChannel = supabase
      .channel('applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications'
        },
        (payload) => {
          console.log('Application update received:', payload);
          onApplicationUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to calling logs changes
    const callingLogsChannel = supabase
      .channel('calling-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calling_logs'
        },
        (payload) => {
          console.log('Calling log update received:', payload);
          onCallingLogUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to audit logs changes
    const auditLogsChannel = supabase
      .channel('audit-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          console.log('Audit log update received:', payload);
          onAuditLogUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to contact calling status changes
    const contactStatusChannel = supabase
      .channel('contact-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_calling_status'
        },
        (payload) => {
          console.log('Contact status update received:', payload);
          onCallingLogUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        (payload) => {
          console.log('Comment update received:', payload);
          onCommentUpdate?.();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(applicationsChannel);
      supabase.removeChannel(callingLogsChannel);
      supabase.removeChannel(auditLogsChannel);
      supabase.removeChannel(contactStatusChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [user, onApplicationUpdate, onCallingLogUpdate, onAuditLogUpdate, onCommentUpdate]);
};
