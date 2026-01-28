/**
 * Campaign Editor Component
 * Create, edit, and manage newsletter campaigns
 */

import { useState, useEffect } from 'react';
import { Plus, Eye, Send, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import newsletterService from '../../services/newsletter';

export default function CampaignEditor() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmails, setTestEmails] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const data = await newsletterService.getCampaigns({ limit: 20 });
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      toast('Generating newsletter with AI...', { icon: '🤖' });

      const content = await newsletterService.generateNewsletter();

      // Create campaign from generated content
      const campaign = await newsletterService.createCampaign({
        name: `AI Newsletter - ${new Date().toLocaleDateString()}`,
        subject_line: content.subject_lines[0],
        subject_line_variant: content.subject_lines[1],
        content_markdown: content.content_markdown,
        content_html: content.content_html,
        status: 'draft',
        campaign_type: 'weekly',
        ai_generated: true
      });

      toast.success('Newsletter generated successfully!');
      await fetchCampaigns();
    } catch (error: any) {
      toast.error('Failed to generate newsletter');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async (campaignId: string) => {
    try {
      const data = await newsletterService.getCampaign(campaignId);
      setSelectedCampaign(data.campaign);
      setShowPreview(true);
    } catch (error) {
      toast.error('Failed to load campaign');
    }
  };

  const handleSendTest = async (campaignId: string) => {
    if (!testEmails.trim()) {
      toast.error('Please enter at least one email address');
      return;
    }

    const emails = testEmails.split(',').map(e => e.trim()).filter(e => e);

    try {
      toast('Sending test emails...', { icon: '📧' });
      const result = await newsletterService.sendTestEmail(campaignId, emails);
      toast.success(`Test emails sent to ${result.sent} recipients`);
      setTestEmails('');
    } catch (error) {
      toast.error('Failed to send test emails');
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      await newsletterService.deleteCampaign(campaignId);
      toast.success('Campaign deleted');
      await fetchCampaigns();
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Campaigns</h2>
          <p className="text-gray-400">Manage newsletter campaigns</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {generating ? 'Generating...' : 'Generate with AI'}
        </button>
      </div>

      {/* Campaigns list */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-12 text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-gray-600" />
            <h3 className="mb-2 text-lg font-semibold text-white">No campaigns yet</h3>
            <p className="mb-4 text-gray-400">
              Generate your first newsletter with AI
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-lg bg-purple-600 px-6 py-2 font-semibold text-white hover:bg-purple-700"
            >
              Generate Now
            </button>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {campaign.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        campaign.status === 'sent'
                          ? 'bg-green-500/20 text-green-400'
                          : campaign.status === 'draft'
                          ? 'bg-gray-500/20 text-gray-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {campaign.status}
                    </span>
                    {campaign.ai_generated && (
                      <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs font-semibold text-purple-400">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-gray-400">{campaign.subject_line}</p>
                  <div className="mt-3 flex gap-4 text-sm text-gray-500">
                    <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                    {campaign.total_sent > 0 && (
                      <span>Sent to: {campaign.total_sent} subscribers</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview(campaign.id)}
                    className="rounded-lg bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="rounded-lg bg-gray-800 p-2 text-gray-300 transition-colors hover:bg-gray-700 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Test email section */}
              {campaign.status === 'draft' && (
                <div className="mt-4 flex gap-2 border-t border-gray-800 pt-4">
                  <input
                    type="text"
                    value={testEmails}
                    onChange={(e) => setTestEmails(e.target.value)}
                    placeholder="test@example.com, test2@example.com"
                    className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendTest(campaign.id)}
                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                  >
                    <Send className="h-4 w-4" />
                    Send Test
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Preview modal */}
      {showPreview && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mb-4 rounded-lg bg-gray-800 p-4">
              <p className="text-sm text-gray-400">Subject:</p>
              <p className="text-white">{selectedCampaign.subject_line}</p>
            </div>
            <div
              className="prose prose-invert max-w-none rounded-lg bg-white p-6"
              dangerouslySetInnerHTML={{ __html: selectedCampaign.content_html }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
