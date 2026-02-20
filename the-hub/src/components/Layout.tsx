import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Settings, Zap, Home, Menu, X, Search, Watch, Car, Footprints, Trophy, FileText, User, LogIn, UserPlus, LogOut, Crown, Bell } from 'lucide-react'
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
    { path: '/settings/alerts', icon: Bell, label: 'Deal Alerts' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="flex h-screen text-white overflow-hidden" style={{ background: '#0a0a0a' }}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <nav className={clsx(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 p-6 transform transition-transform duration-300 ease-in-out lg:transform-none border-r',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )} style={{ background: '#141414', borderColor: 'rgba(255,255,255,0.08)' }}>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 lg:hidden p-2 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <X size={20} />
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#f0f0f0', letterSpacing: '-0.5px' }}>The Hub</h1>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Personal Data Center</p>
        </div>

        <ul className="space-y-2">
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
                    'flex items-center space-x-3 px-4 py-3 transition-all duration-200 font-medium',
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  )}
                  style={{
                    background: isActive ? '#1a8d5f' : 'transparent',
                    borderRadius: '12px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
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
              className="flex items-center justify-center space-x-2 px-4 py-3 text-white font-semibold transition-all"
              style={{ 
                background: '#1a8d5f',
                borderRadius: '12px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Crown size={20} />
              <span>Upgrade to Premium</span>
            </Link>
          </div>
        )}

        {/* Auth Section in Sidebar */}
        <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {!isAuthenticated ? (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 transition-colors font-medium"
                style={{ 
                  color: '#888',
                  borderRadius: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = '#f0f0f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#888'
                }}
              >
                <LogIn size={20} />
                <span>Login</span>
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-white transition-all font-semibold"
                style={{ 
                  background: '#1a8d5f',
                  borderRadius: '12px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <UserPlus size={20} />
                <span>Sign Up</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="px-4 py-3" style={{ 
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#1a8d5f' }}>
                    <User size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#f0f0f0' }}>
                      {user?.firstName || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs" style={{ color: '#888' }}>{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 rounded font-medium" style={{
                    background: 'rgba(26, 141, 95, 0.15)',
                    color: '#1a8d5f'
                  }}>
                    {user?.tier || 'Free'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 transition-colors font-medium"
                style={{ 
                  color: '#888',
                  borderRadius: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = '#f0f0f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#888'
                }}
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
        <div className="backdrop-blur-sm" style={{ 
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(10,10,10,0.92)'
        }}>
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {/* Left side - Mobile menu + Title */}
            <div className="flex items-center gap-3">
              {/* Hamburger menu - only visible on mobile */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 transition-colors"
                style={{ borderRadius: '8px' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Menu size={20} />
              </button>

              <div>
                <h2 className="text-lg font-semibold" style={{ 
                  color: '#f0f0f0',
                  letterSpacing: '-0.3px'
                }}>
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
                <p className="text-sm hidden sm:block" style={{ color: '#888' }}>Live tracking and monitoring</p>
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
                    className="hidden sm:flex items-center gap-2 px-4 py-2 transition-colors font-medium"
                    style={{ 
                      color: '#888',
                      borderRadius: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = '#f0f0f0'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#888'
                    }}
                  >
                    <LogIn size={18} />
                    <span>Login</span>
                  </Link>

                  {/* Sign Up Button */}
                  <Link
                    to="/signup"
                    className="flex items-center gap-2 px-4 py-2 text-white font-semibold transition-all"
                    style={{ 
                      background: '#1a8d5f',
                      borderRadius: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <UserPlus size={18} />
                    <span>Sign Up</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* User Info */}
                  <div className="hidden sm:flex items-center gap-3 px-3 py-2" style={{ 
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px'
                  }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#1a8d5f' }}>
                      <User size={16} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium" style={{ color: '#f0f0f0' }}>
                        {user?.firstName || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <span className="text-xs" style={{ color: '#888' }}>{user?.tier || 'Free'}</span>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 transition-colors font-medium"
                    title="Logout"
                    style={{ 
                      color: '#888',
                      borderRadius: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = '#f0f0f0'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#888'
                    }}
                  >
                    <LogOut size={18} />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </>
              )}

              {/* Vertical Divider */}
              <div className="hidden sm:block h-8 w-px" style={{ background: 'rgba(255,255,255,0.08)' }}></div>

              {/* Notification Panel */}
              <NotificationPanel />

              {/* Vertical Divider - hidden on mobile */}
              <div className="hidden sm:block h-8 w-px" style={{ background: 'rgba(255,255,255,0.08)' }}></div>

              {/* Connection Status - Inline version */}
              <div className="hidden sm:flex">
                <ConnectionStatus inline={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8" style={{ background: '#0a0a0a' }}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout