import React, { useState } from 'react';
import { Bell, CheckCheck, Mail, MessageSquare, AlertCircle, Calendar, CreditCard, Sparkles } from 'lucide-react';
import { useDentalStore } from '../../services/useDentalStore';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { AppNotification } from '../../types';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { notifications, activeUser, markNotificationAsRead, markAllNotificationsAsRead } = useDentalStore();

  // Filter notifications for active user or general
  const userNotifications = notifications.filter((n) => !n.userId || n.userId === activeUser.id);
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const displayList = filter === 'unread' ? userNotifications.filter((n) => !n.read) : userNotifications;

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'appointment_confirmed':
      case 'appointment_rescheduled':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'appointment_cancelled':
      case 'no_show_notice':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'waitlist_slot_available':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'payment_receipt':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative neo-btn p-2.5 rounded-2xl text-slate-700 hover:text-blue-600 transition-all cursor-pointer flex items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-extrabold text-white shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-80 sm:w-96 z-50 neo-raised-lg rounded-3xl p-4 bg-[#E8EEF5] text-slate-800 shadow-2xl border border-white/50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-300/60">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead(activeUser.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Read All
                  </button>
                )}
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 my-2.5">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  filter === 'all' ? 'neo-inset text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({userNotifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  filter === 'unread' ? 'neo-inset text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notification items list */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {displayList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No notifications to display.
                </div>
              ) : (
                displayList.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={`p-3 rounded-2xl transition-all cursor-pointer ${
                      notif.read ? 'neo-inset-sm opacity-80' : 'neo-raised bg-[#EDF3FA] border-l-4 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-xl neo-inset shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{notif.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {notif.channel === 'sms' && <MessageSquare className="w-2.5 h-2.5" />}
                            {notif.channel === 'email' && <Mail className="w-2.5 h-2.5" />}
                            {notif.channel === 'in_app' && <Bell className="w-2.5 h-2.5" />}
                            {notif.channel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
