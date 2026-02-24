import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import { NotificationProvider } from './contexts/NotificationContext'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import LandingNew from './pages/LandingNew'
import LandingClean from './pages/LandingClean'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Integrations from './pages/Integrations'
import Settings from './pages/Settings'
import WatchListings from './pages/WatchListings'
import Watches from './pages/Watches'
import Cars from './pages/Cars'
import Sneakers from './pages/Sneakers'
import Sports from './pages/Sports'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import BlogAdmin from './pages/BlogAdmin'
import BlogEditor from './pages/BlogEditor'
import AdminSettings from './pages/AdminSettings'
import NewsletterAdmin from './pages/NewsletterAdmin'
import NewsletterUnsubscribe from './pages/NewsletterUnsubscribe'
import ScraperDebug from './pages/ScraperDebug'
import MissionControl from './pages/MissionControl'
import Projects from './pages/Projects'
import Referrals from './pages/Referrals'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Premium from './pages/Premium'
import PremiumSuccess from './pages/PremiumSuccess'
import About from './pages/About'
import Compare from './pages/Compare'
import Deals from './pages/Deals'


import AlertPreferences from './pages/AlertPreferences'
import SniperAlerts from './pages/SniperAlerts'

import { Resellers, Collectors, Dealers } from './pages/for'
import { ConnectionStatus } from './components/ConnectionStatus'
import { InstallPrompt } from './components/InstallPrompt'

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
      <NotificationProvider>
        <Router>
          <InstallPrompt variant="banner" />
          <ConnectionStatus />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                borderRadius: '10px',
                padding: '16px'
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff'
                }
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff'
                }
              }
            }}
          />
          <Routes>
            {/* Landing Page (No Layout) */}
            <Route path="/" element={<LandingClean />} />
            <Route path="/landing-old" element={<Landing />} />
            <Route path="/about" element={<About />} />
            
            {/* Segment Landing Pages (SEO) */}
            <Route path="/for/resellers" element={<Resellers />} />
            <Route path="/for/collectors" element={<Collectors />} />
            <Route path="/for/dealers" element={<Dealers />} />
            
            {/* Comparison Pages (SEO) */}
            <Route path="/compare" element={<Compare />} />
            <Route path="/compare/:competitor" element={<Compare />} />
            
            {/* Programmatic Deal Pages (SEO) */}
            <Route path="/deals" element={<Deals />} />
            <Route path="/deals/:brand" element={<Deals />} />
            <Route path="/deals/category/:category" element={<Deals />} />

            {/* Blog Routes (With Layout) */}
            <Route path="/blog" element={<Layout><Blog /></Layout>} />
            <Route path="/blog/category/:category" element={<Layout><Blog /></Layout>} />
            <Route path="/blog/admin" element={<Layout><BlogAdmin /></Layout>} />
            <Route path="/blog/editor/:id" element={<Layout><BlogEditor /></Layout>} />
            <Route path="/blog/:slug" element={<Layout><BlogPost /></Layout>} />

            {/* Auth Routes (No Layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/premium/success" element={<PremiumSuccess />} />
            <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />

            {/* App Routes (With Layout) */}
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/watch-listings" element={<WatchListings />} />
                  <Route path="/watches" element={<Watches />} />
                  <Route path="/cars" element={<Cars />} />
                  <Route path="/sneakers" element={<Sneakers />} />
                  <Route path="/sports" element={<Sports />} />
                  <Route path="/newsletter/admin" element={<NewsletterAdmin />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/integrations" element={<Integrations />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/settings/alerts" element={<AlertPreferences />} />
                  <Route path="/sniper-alerts" element={<SniperAlerts />} />
                  <Route path="/admin" element={<AdminSettings />} />
                  <Route path="/admin/scraper-debug" element={<ScraperDebug />} />
                  <Route path="/mission-control" element={<MissionControl />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/referrals" element={<Referrals />} />
                </Routes>
              </Layout>
            } />
          </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </HelmetProvider>
  )
}

export default App