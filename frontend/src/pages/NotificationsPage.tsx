import { CheckCheck, Bell, Inbox, ShieldAlert, Route, Lightbulb, Radio, Siren } from 'lucide-react';
import { Card, Button, LoadingSpinner, EmptyState, PageHeader } from '@/components/ui';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/utils';

const typeIcons: Record<string, React.ReactNode> = {
  incident_alert: <ShieldAlert className="w-5 h-5 text-rose-600" />,
  route_update: <Route className="w-5 h-5 text-brand-600" />,
  safety_tip: <Lightbulb className="w-5 h-5 text-amber-600" />,
  system: <Radio className="w-5 h-5 text-slate-600" />,
  sos_response: <Siren className="w-5 h-5 text-rose-600" />,
};

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Notifications & Alerts"
        subtitle="Critical security dispatches, dynamic route advisories, and campus bulletins."
        badge={unreadCount > 0 ? `${unreadCount} Unread` : 'All Read'}
        badgeVariant={unreadCount > 0 ? 'warning' : 'safe'}
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markAllRead.mutate()}
              isLoading={markAllRead.isPending}
              leftIcon={<CheckCheck className="w-4 h-4 text-brand-600" />}
            >
              Mark All as Read
            </Button>
          ) : undefined
        }
      />

      {!notifications || notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-slate-400" />}
          title="No notifications"
          description="You're all caught up! Real-time alerts and campus safety bulletins will appear here."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notification) => {
            let timeAgo = '';
            try {
              timeAgo = formatDistanceToNow(
                new Date(notification.created_at || Date.now()),
                { addSuffix: true }
              );
            } catch {
              timeAgo = 'Just now';
            }

            return (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.is_read) {
                    markRead.mutate(notification.id);
                  }
                }}
                className={cn(
                  'p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-start gap-3.5 group',
                  !notification.is_read
                    ? 'bg-brand-50/40 border-brand-200/80 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  {typeIcons[notification.type] || (
                    <Bell className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3
                        className={cn(
                          'text-xs tracking-tight',
                          notification.is_read
                            ? 'font-medium text-slate-700'
                            : 'font-bold text-slate-900'
                        )}
                      >
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 font-mono">
                      {timeAgo}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
