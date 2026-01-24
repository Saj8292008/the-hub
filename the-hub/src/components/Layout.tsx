import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BarChart3, Settings, Zap, Home, Menu, X, Search } from 'lucide-react'
import clsx from 'clsx'
import { NotificationPanel } from './NotificationPanel'
import { ConnectionStatus } from './ConnectionStatus'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/watch-listings', icon: Search, label: 'Watch Listings' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/integrations', icon: Zap, label: 'Integrations' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <nav className={clsx(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 p-6 transform transition-transform duration-300 ease-in-out lg:transform-none',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary-500">The Hub</h1>
          <p className="text-gray-400 text-sm mt-1">Personal Data Center</p>
        </div>

        <ul className="space-y-3">
          {navItems.map(({ path, icon: Icon, label }) => (
            <li key={path}>
              <Link
                to={path}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                  location.pathname === path
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Nav Bar */}
        <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {/* Left side - Mobile menu + Title */}
            <div className="flex items-center gap-3">
              {/* Hamburger menu - only visible on mobile */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Menu size={20} />
              </button>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-400 hidden sm:block">Live tracking and monitoring</p>
              </div>
            </div>

            {/* Right side - Actions and Status */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Notification Panel */}
              <NotificationPanel />

              {/* Vertical Divider - hidden on mobile */}
              <div className="hidden sm:block h-8 w-px bg-gray-800"></div>

              {/* Connection Status - Inline version */}
              <div className="hidden sm:flex">
                <ConnectionStatus inline={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout