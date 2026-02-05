import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import ReferralDashboard from '../components/referrals/ReferralDashboard';
import '../styles/Settings.css';

interface UserSettings {
  email: string;
  firstName: string;
  lastName: string;
  emailNotifications: boolean;
  newsletter: boolean;
  priceAlerts: boolean;
  dealScoreThreshold: number;
  emailFrequency: string;
  telegramConnected: boolean;
  telegramChatId: string | null;
  telegramUsername: string | null;
  telegramPreferences: {
    categories: string[];
    minScore: number;
    maxPrice: number | null;
  };
  watchlistAlertThreshold: number;
  interests: string[];
  tier: string;
  stripeCustomerId: string | null;
  subscriptionEndsAt: string | null;
}

const Settings: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useNotifications();
  const [activeTab, setActiveTab] = useState('account');
  const [settings, setSettings] = useState<UserSettings>({
    email: '',
    firstName: '',
    lastName: '',
    emailNotifications: true,
    newsletter: true,
    priceAlerts: true,
    dealScoreThreshold: 8.0,
    emailFrequency: 'daily',
    telegramConnected: false,
    telegramChatId: null,
    telegramUsername: null,
    telegramPreferences: {
      categories: ['watches', 'cars', 'sneakers', 'sports'],
      minScore: 8.0,
      maxPrice: null
    },
    watchlistAlertThreshold: 10,
    interests: ['watches', 'cars', 'sneakers', 'sports'],
    tier: 'free',
    stripeCustomerId: null,
    subscriptionEndsAt: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadSettings();
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/settings`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      setSettings(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load settings:', err);
      error('Failed to load settings');
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      success('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      error('Failed to save settings');
    }
    setSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/settings/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      success('Password changed successfully!');
      e.currentTarget.reset();
    } catch (err: any) {
      error(err.message || 'Failed to change password');
    }
  };

  const connectTelegram = () => {
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'thehub_deals_bot';
    window.open(`https://t.me/${botUsername}?start=connect_${user?.id}`, '_blank');
    success('Opening Telegram bot. Send /connect to link your account.');
  };

  const disconnectTelegram = async () => {
    if (!confirm('Disconnect Telegram? You\'ll stop receiving alerts.')) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/settings/disconnect-telegram`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to disconnect');

      setSettings({ ...settings, telegramConnected: false, telegramChatId: null });
      success('Telegram disconnected');
    } catch (err) {
      error('Failed to disconnect Telegram');
    }
  };

  const manageSubscription = async () => {
    error('Stripe billing portal not yet implemented');
    // TODO: Implement Stripe portal session
  };

  const deleteAccount = async () => {
    const confirmation = prompt('This will permanently delete your account. Type "DELETE" to confirm:');
    if (confirmation !== 'DELETE') return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/settings/delete-account`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete account');

      // Log out and redirect
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      window.location.href = '/';
    } catch (err) {
      error('Failed to delete account');
    }
  };

  const exportData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/settings/export-data`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to export data');

      const data = await response.json();

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `the-hub-data-${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      success('Data exported successfully!');
    } catch (err) {
      error('Failed to export data');
    }
  };


  const updateSetting = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const updateTelegramPreference = (key: string, value: any) => {
    setSettings({
      ...settings,
      telegramPreferences: {
        ...settings.telegramPreferences,
        [key]: value
      }
    });
  };

  const toggleCategory = (category: string, field: 'interests' | 'telegramCategories') => {
    if (field === 'interests') {
      const interests = settings.interests.includes(category)
        ? settings.interests.filter(c => c !== category)
        : [...settings.interests, category];
      updateSetting('interests', interests);
    } else {
      const categories = settings.telegramPreferences.categories.includes(category)
        ? settings.telegramPreferences.categories.filter(c => c !== category)
        : [...settings.telegramPreferences.categories, category];
      updateTelegramPreference('categories', categories);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'account' ? 'active' : ''}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
        <button
          className={activeTab === 'notifications' ? 'active' : ''}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button
          className={activeTab === 'telegram' ? 'active' : ''}
          onClick={() => setActiveTab('telegram')}
        >
          Telegram
        </button>
        <button
          className={activeTab === 'watchlist' ? 'active' : ''}
          onClick={() => setActiveTab('watchlist')}
        >
          Watchlist
        </button>
        <button
          className={activeTab === 'subscription' ? 'active' : ''}
          onClick={() => setActiveTab('subscription')}
        >
          Subscription
        </button>
        <button
          className={activeTab === 'privacy' ? 'active' : ''}
          onClick={() => setActiveTab('privacy')}
        >
          Privacy
        </button>
        <button
          className={activeTab === 'referrals' ? 'active' : ''}
          onClick={() => setActiveTab('referrals')}
        >
          Referrals
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="account-settings">
            <h2>Account Settings</h2>

            <div className="setting-group">
              <label>Email Address</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => updateSetting('email', e.target.value)}
              />
            </div>

            <div className="setting-group">
              <label>First Name</label>
              <input
                type="text"
                value={settings.firstName}
                onChange={(e) => updateSetting('firstName', e.target.value)}
              />
            </div>

            <div className="setting-group">
              <label>Last Name</label>
              <input
                type="text"
                value={settings.lastName}
                onChange={(e) => updateSetting('lastName', e.target.value)}
              />
            </div>

            <div className="setting-group">
              <h3>Change Password</h3>
              <form onSubmit={handlePasswordChange}>
                <input
                  type="password"
                  name="currentPassword"
                  placeholder="Current password"
                  required
                />
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New password (min 8 characters)"
                  minLength={8}
                  required
                />
                <button type="submit" className="btn-secondary">Change Password</button>
              </form>
            </div>

            <div className="setting-group danger-zone">
              <h3>Danger Zone</h3>
              <button className="btn-danger" onClick={deleteAccount}>
                Delete Account
              </button>
              <p className="help-text">This action cannot be undone.</p>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="notification-settings">
            <h2>Notification Preferences</h2>

            <div className="setting-group toggle">
              <label>
                <input
                  type="checkbox"
                  checked={settings.newsletter}
                  onChange={(e) => updateSetting('newsletter', e.target.checked)}
                />
                <span>Newsletter Subscription</span>
              </label>
              <p className="help-text">Receive daily/weekly deal digests via email</p>
            </div>

            <div className="setting-group toggle">
              <label>
                <input
                  type="checkbox"
                  checked={settings.priceAlerts}
                  onChange={(e) => updateSetting('priceAlerts', e.target.checked)}
                />
                <span>Price Drop Alerts</span>
              </label>
              <p className="help-text">Get notified when tracked items drop in price</p>
            </div>

            <div className="setting-group">
              <label>Email Frequency</label>
              <select
                value={settings.emailFrequency}
                onChange={(e) => updateSetting('emailFrequency', e.target.value)}
              >
                <option value="realtime">Real-time</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Roundup</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Deal Score Threshold: {settings.dealScoreThreshold}/10</label>
              <input
                type="range"
                min="7.0"
                max="10.0"
                step="0.5"
                value={settings.dealScoreThreshold}
                onChange={(e) => updateSetting('dealScoreThreshold', parseFloat(e.target.value))}
              />
              <p className="help-text">Only notify me about deals with this score or higher</p>
            </div>

            <div className="setting-group">
              <label>Interested Categories</label>
              <div className="checkbox-group">
                {['watches', 'cars', 'sneakers', 'sports'].map(cat => (
                  <label key={cat}>
                    <input
                      type="checkbox"
                      checked={settings.interests?.includes(cat)}
                      onChange={() => toggleCategory(cat, 'interests')}
                    />
                    <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TELEGRAM TAB */}
        {activeTab === 'telegram' && (
          <div className="telegram-settings">
            <h2>Telegram Integration</h2>

            <div className="connection-status">
              {settings.telegramConnected ? (
                <>
                  <div className="status-badge connected">✓ Connected</div>
                  <p>Receiving personalized deal alerts on Telegram</p>
                  {settings.telegramUsername && (
                    <p className="telegram-username">@{settings.telegramUsername}</p>
                  )}
                  <button className="btn-secondary" onClick={disconnectTelegram}>
                    Disconnect Telegram
                  </button>
                </>
              ) : (
                <>
                  <div className="status-badge disconnected">✗ Not Connected</div>
                  <p>Connect Telegram to receive instant deal alerts</p>
                  <button className="btn-primary" onClick={connectTelegram}>
                    Connect Telegram
                  </button>
                  <p className="help-text">
                    Click to open our bot and follow the connection instructions
                  </p>
                </>
              )}
            </div>

            {settings.telegramConnected && (
              <>
                <div className="setting-group">
                  <label>Alert Categories</label>
                  <div className="checkbox-group">
                    {['watches', 'cars', 'sneakers', 'sports'].map(cat => (
                      <label key={cat}>
                        <input
                          type="checkbox"
                          checked={settings.telegramPreferences?.categories?.includes(cat)}
                          onChange={() => toggleCategory(cat, 'telegramCategories')}
                        />
                        <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="setting-group">
                  <label>Minimum Deal Score: {settings.telegramPreferences?.minScore || 8.0}/10</label>
                  <input
                    type="range"
                    min="7.0"
                    max="10.0"
                    step="0.5"
                    value={settings.telegramPreferences?.minScore || 8.0}
                    onChange={(e) => updateTelegramPreference('minScore', parseFloat(e.target.value))}
                  />
                </div>

                <div className="setting-group">
                  <label>Max Price (optional)</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={settings.telegramPreferences?.maxPrice || ''}
                    onChange={(e) => updateTelegramPreference('maxPrice', e.target.value ? parseInt(e.target.value) : null)}
                  />
                  <p className="help-text">Only alert me about items under this price</p>
                </div>

                <div className="info-box">
                  <p><strong>Alert Limits:</strong></p>
                  <p>
                    {settings.tier === 'premium'
                      ? '✨ Premium: Unlimited instant alerts'
                      : '🆓 Free: 3 alerts per day (upgrade for unlimited)'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* WATCHLIST TAB */}
        {activeTab === 'watchlist' && (
          <div className="watchlist-settings">
            <h2>Watchlist Preferences</h2>

            <div className="setting-group">
              <label>Default Price Alert Threshold</label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.watchlistAlertThreshold}
                onChange={(e) => updateSetting('watchlistAlertThreshold', parseInt(e.target.value))}
              />
              <p className="help-text">Alert me when price drops by this percentage</p>
            </div>

            <div className="info-box">
              <p><strong>Watchlist Limits:</strong></p>
              <p>
                {settings.tier === 'premium'
                  ? '✨ Premium: Unlimited tracked items'
                  : '🆓 Free: 5 items (upgrade for unlimited)'}
              </p>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'subscription' && (
          <div className="subscription-settings">
            <h2>Subscription</h2>

            {settings.tier === 'premium' ? (
              <div className="subscription-card">
                <div className="plan-badge premium">✨ Premium</div>
                <h3>$14.99/month</h3>
                {settings.subscriptionEndsAt && (
                  <p>Next billing: {new Date(settings.subscriptionEndsAt).toLocaleDateString()}</p>
                )}

                <ul className="benefits">
                  <li>✓ Unlimited watchlist items</li>
                  <li>✓ Unlimited Telegram alerts</li>
                  <li>✓ Priority customer support</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Early access to new features</li>
                </ul>

                <button className="btn-primary" onClick={manageSubscription}>
                  Manage Subscription
                </button>
                <p className="help-text">Update payment method, view invoices, or cancel</p>
              </div>
            ) : (
              <div className="subscription-card free">
                <div className="plan-badge free">🆓 Free</div>
                <h3>Current Plan</h3>

                <ul className="limitations">
                  <li>⚠️ 5 watchlist items max</li>
                  <li>⚠️ 3 Telegram alerts per day</li>
                  <li>⚠️ Basic features only</li>
                </ul>

                <button
                  className="btn-primary btn-upgrade"
                  onClick={() => window.location.href = '/premium'}
                >
                  Upgrade to Premium - $14.99/mo
                </button>

                <div className="premium-benefits">
                  <h4>Get with Premium:</h4>
                  <ul>
                    <li>✨ Unlimited watchlist items</li>
                    <li>✨ Unlimited Telegram alerts</li>
                    <li>✨ Priority support</li>
                    <li>✨ Advanced analytics</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div className="privacy-settings">
            <h2>Privacy & Data</h2>

            <div className="setting-group">
              <h3>Export Your Data</h3>
              <p>Download all your data including watchlist, alerts, and preferences</p>
              <button className="btn-secondary" onClick={exportData}>
                Download Data (JSON)
              </button>
            </div>

            <div className="setting-group">
              <h3>Data Collection</h3>
              <p>We collect minimal data to provide our service:</p>
              <ul>
                <li>Email and account info</li>
                <li>Watchlist and price alerts</li>
                <li>Usage analytics (anonymous)</li>
              </ul>
              <p>We never sell your data. Read our <a href="/privacy">Privacy Policy</a>.</p>
            </div>
          </div>
        )}

        {/* REFERRALS TAB */}
        {activeTab === 'referrals' && (
          <div className="referral-settings">
            <h2>Referral Program</h2>
            <p className="text-gray-400 mb-6">
              Share The Hub with friends and earn free Pro months!
            </p>
            <ReferralDashboard />
          </div>
        )}

      </div>

      {/* Save Button */}
      <div className="save-bar">
        <button
          className="btn-primary btn-save"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
