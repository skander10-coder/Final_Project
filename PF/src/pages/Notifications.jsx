import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/ui/Card';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success': return 'border-l-4 border-l-green-500';
      case 'warning': return 'border-l-4 border-l-amber-500';
      case 'error': return 'border-l-4 border-l-red-500';
      default: return 'border-l-4 border-l-indigo-500';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  // 🔥 دالة معالجة الضغط على الإشعار
  const handleNotificationClick = (notification) => {
    // تعليم الإشعار كمقروء إذا لم يكن مقروءاً
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // إذا كان هناك رابط (PDF)، افتحه في تبويب جديد
    if (notification.action_url) {
      window.open(notification.action_url, '_blank');
    } else if (notification.related_application_id) {
      // إذا كان مرتبط بطلب، اذهب لصفحة الطلبات
      navigate('/student/applications');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">🔔 Notifications</h1>
        <p className="text-slate-500 mt-1">Stay updated with your internship activities</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'read' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          Read
        </button>

        <div className="flex-1"></div>

        <button
          onClick={() => markAllAsRead()}
          className="px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-slate-500 font-medium">No notifications</p>
          <p className="text-slate-400 text-sm mt-1">When you receive notifications, they will appear here</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`bg-white rounded-xl border border-slate-100 p-5 transition-all hover:shadow-md cursor-pointer ${getTypeStyles(notification.type)} ${!notification.is_read ? 'bg-indigo-50/20' : ''}`}
            >
              <div className="flex gap-4">
                <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`text-slate-900 ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-slate-600 text-sm mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-2">{notification.time_ago}</p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // منع انتشار الحدث
                          markAsRead(notification.id);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}