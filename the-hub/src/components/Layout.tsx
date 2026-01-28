import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Settings, Zap, Home, Menu, X, Search, Watch, Car, Footprints, Trophy, FileText, User, LogIn, UserPlus, LogOut, Crown } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../contexts/AuthContext'
import { NotificationPanel } from './NotificationPanel'
import { ConnectionStatus } from './ConnectionStatus'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/watches', icon: Watch, label: 'Watches' },
    { path: '/cars', icon: Car, label: 'Cars' },
    { path: '/sneakers', icon: Footprints, label: 'Sneakers' },
    { path: '/sports', icon: Trophy, label: 'Sports' },
    { path: '/watch-listings', icon: Search, label: 'All Listings' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/blog', icon: FileText, label: 'Blog' },
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
          {navItems.map(({ path, icon: Icon, label }) => {
            // Check if current path matches or if it's a sub-path (for blog, newsletter)
            const isActive = location.pathname === path ||
              (path !== '/' && location.pathname.startsWith(path));

            return (
              <li key={path}>
                <Link
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Upgrade Button - Show for authenticated free tier users */}
        {isAuthenticated && user?.tier === 'free' && (
          <div className="mt-6">
            <Link
              to="/premium"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium transition-all shadow-lg shadow-purple-500/25"
            >
              <Crown size={20} />
              <span>Upgrade to Premium</span>
            </Link>
          </div>
        )}

        {/* Auth Section in Sidebar */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          {!isAuthenticated ? (
            <div className="space-y-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <LogIn size={20} />
                <span>Login</span>
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-colors"
              >
                <UserPlus size={20} />
                <span>Sign Up</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="px-4 py-3 rounded-lg bg-gray-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {user?.firstName || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-300 font-medium">
                    {user?.tier || 'Free'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
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
                  {(() => {
                    // Check exact match first
                    const exactMatch = navItems.find(item => item.path === location.pathname);
                    if (exactMatch) return exactMatch.label;

                    // Check if we're on a blog-related page
                    if (location.pathname.startsWith('/blog')) return 'Blog';
                    if (location.pathname.startsWith('/newsletter')) return 'Newsletter';
                    if (location.pathname.startsWith('/premium')) return 'Premium';

                    // Check if we're on admin settings
                    if (location.pathname === '/admin') return 'Admin Settings';

                    return 'Dashboard';
                  })()}
                </h2>
                <p className="text-sm text-gray-400 hidden sm:block">Live tracking and monitoring</p>
              </div>
            </div>

            {/* Right side - Actions and Status */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Auth Buttons / User Info */}
              {!isAuthenticated ? (
                <>
                  {/* Login Button */}
                  <Link
                    to="/login"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <LogIn size={18} />
                    <span>Login</span>
                  </Link>

                  {/* Sign Up Button */}
                  <Link
                    to="/signup"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium transition-all"
                  >
                    <UserPlus size={18} />
                    <span>Sign Up</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* User Info */}
                  <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">
                        {user?.firstName || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <span className="text-xs text-gray-400">{user?.tier || 'Free'}</span>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={18} />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </>
              )}

              {/* Vertical Divider */}
              <div className="hidden sm:block h-8 w-px bg-gray-800"></div>

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