import React, { useState, useEffect, useRef } from 'react'
import { Bell, Check, TrendingDown, Package, Zap, AlertTriangle, X } from 'lucide-react'

interface Notification {
  id: string
  type: 'price_drop' | 'new_listing' | 'restock' | 'price_jump' | 'alert'
  title: string
  message: string
  timestamp: string
  read: boolean
}

export const NotificationPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'price_drop',
      title: 'Price Drop Alert',
      message: 'Rolex Submariner dropped to $8,200 - below your target!',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      read: false
    },
    {
      id: '2',
      type: 'new_listing',
      title: 'New Listing',
      message: 'New Porsche 911 Turbo S 2024 listed at $195,000',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false
    },
    {
      id: '3',
      type: 'restock',
      title: 'Back in Stock',
      message: 'Nike Air Jordan 1 Retro High OG size 10.5 is back!',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true
    },
    {
      id: '4',
      type: 'price_jump',
      title: 'Price Increase',
      message: 'Omega Seamaster price increased by 8% to $5,400',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: true
    }
  ])

  const panelRef = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter(n => !n.read).length

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_drop':
        return <TrendingDown className="text-emerald-400" size={16} />
      case 'new_listing':
        return <Package className="text-blue-400" size={16} />
      case 'restock':
        return <Zap className="text-purple-400" size={16} />
      case 'price_jump':
        return <AlertTriangle className="text-amber-400" size={16} />
      default:
        return <Bell className="text-gray-400" size={16} />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'price_drop':
        return 'emerald'
      case 'new_listing':
        return 'blue'
      case 'restock':
        return 'purple'
      case 'price_jump':
        return 'amber'
      default:
        return 'gray'
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative inline-flex items-center justify-center rounded-xl bg-gray-800/50 p-2.5 text-gray-400 transition-all hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <Bell size={20} className={isOpen ? 'text-primary-400' : ''} />

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Pulse ring animation */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 animate-ping rounded-full bg-rose-500 opacity-50"></span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-96 animate-fade-in">
          <div className="rounded-2xl border border-gray-800/50 bg-gray-900/95 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
              <div className="flex items-center gap-2">
                <Bell className="text-primary-400" size={18} />
                <h3 className="text-base font-bold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-800/50 mb-3">
                    <Bell className="text-gray-600" size={20} />
                  </div>
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {notifications.map((notification) => {
                    const color = getNotificationColor(notification.type)

                    return (
                      <div
                        key={notification.id}
                        className={`group relative px-5 py-4 transition-all hover:bg-gray-800/50 ${
                          !notification.read ? 'bg-gray-800/30' : ''
                        }`}
                      >
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary-500"></div>
                        )}

                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-${color}-500/10`}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-white">{notification.title}</p>
                                <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{notification.message}</p>
                                <p className="mt-2 text-xs text-gray-600">{formatTimestamp(notification.timestamp)}</p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-primary-400 transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification.id)}
                                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-rose-400 transition-colors"
                                  title="Delete"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-800 px-5 py-3">
                <button className="w-full text-center text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
