import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import Layout from './components/Layout'
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
import { ConnectionStatus } from './components/ConnectionStatus'

function App() {
  return (
    <HelmetProvider>
      <Router>
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
        <ConnectionStatus />
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/watch-listings" element={<WatchListings />} />
            <Route path="/watches" element={<Watches />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/sneakers" element={<Sneakers />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/admin" element={<BlogAdmin />} />
            <Route path="/blog/editor/:id" element={<BlogEditor />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminSettings />} />
          </Routes>
        </Layout>
      </Router>
    </HelmetProvider>
  )
}

export default App