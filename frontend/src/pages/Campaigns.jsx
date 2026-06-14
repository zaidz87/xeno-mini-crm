/**
 * Campaigns Page
 * Lists saved campaigns, shows real-time stats at a high level, allows sending drafts,
 * and hosts the CampaignForm modal trigger.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Megaphone, Plus, MessageCircle, Smartphone, Mail, Play, CheckCircle, 
  Loader2, Eye, Calendar, Users 
} from 'lucide-react';

import { campaignApi } from '../services/api';
import CampaignForm from '../components/CampaignForm';
import { useToast } from '../components/ToastContext';

const CHANNEL_CONFIG = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  sms: { label: 'SMS', icon: Smartphone, text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  email: { label: 'Email', icon: Mail, text: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' }
};

const STATUS_CONFIG = {
  draft: { label: 'Draft', dot: 'bg-slate-400', border: 'border-slate-500/20', bg: 'bg-slate-500/10', text: 'text-slate-400' },
  sending: { label: 'Sending', dot: 'bg-blue-400 animate-pulse', border: 'border-blue-500/20', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  completed: { label: 'Completed', dot: 'bg-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400' }
};

export default function Campaigns() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignApi.getCampaigns();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast.error('Failed to load marketing campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleSendCampaign = async (e, id) => {
    e.stopPropagation(); // prevent card click nav redirect

    if (!window.confirm('Are you sure you want to send this campaign now? This will dispatch messages to all customers in the segment.')) {
      return;
    }

    try {
      setSendingId(id);
      toast.info('Initiating message dispatch sequence...');
      const data = await campaignApi.sendCampaign(id);
      
      if (data.success) {
        toast.success(data.message || 'Campaign dispatch started successfully!');
        loadCampaigns();
        // Redirect to detail page to watch progress live
        navigate(`/campaigns/${id}`);
      }
    } catch (error) {
      console.error('Failed to send campaign:', error);
      const errMsg = error.response?.data?.message || error.message || 'Send process failed.';
      toast.error(errMsg);
    } finally {
      setSendingId(null);
    }
  };

  const handleCreateSuccess = (newCampaign) => {
    setModalOpen(false);
    loadCampaigns();
    toast.success(`Campaign "${newCampaign.name}" saved as draft.`);
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-7xl mx-auto w-full">
      {/* Header Panel */}
      <div className="flex justify-between items-center border-b border-[#2A2D3A] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-8 h-8 text-[#6366F1]" />
            Marketing Campaigns
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Dispatch, monitor, and configure marketing broadcasts for targeted segments.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#818CF8] px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-[#6366F1]/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {loading ? (
        // Loading Cards
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl h-56 animate-pulse-glow" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center p-16 text-slate-500 bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl">
          <Megaphone className="w-16 h-16 text-[#2A2D3A] mb-4" />
          <h3 className="text-lg font-bold text-slate-300">No Campaigns Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">
            Configure a campaign, select a target audience, write a personalized message, and dispatch to channels.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-6 bg-[#6366F1] hover:bg-[#818CF8] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-[#6366F1]/10"
          >
            Create Your First Campaign
          </button>
        </div>
      ) : (
        // Campaigns Grid list
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((camp) => {
            const channel = CHANNEL_CONFIG[camp.channel] || { label: camp.channel, icon: Megaphone, text: 'text-slate-400', bg: 'bg-[#2A2D3A]' };
            const ChannelIcon = channel.icon;

            const status = STATUS_CONFIG[camp.status] || { label: camp.status, dot: 'bg-slate-500', border: 'border-transparent', bg: 'bg-[#2A2D3A]', text: 'text-slate-300' };

            return (
              <div
                key={camp._id}
                onClick={() => navigate(`/campaigns/${camp._id}`)}
                className="bg-[#1A1D27] border border-[#2A2D3A] hover:border-[#6366F1]/30 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <div>
                  {/* Card Header Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="truncate">
                      <h3 className="font-bold text-slate-100 text-base truncate group-hover:text-[#6366F1] transition-colors duration-300">
                        {camp.name}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-semibold">
                        <Users className="w-3.5 h-3.5" />
                        <span>Audience: <span className="text-slate-400">{camp.segmentName}</span></span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.bg} ${status.text} ${status.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Channel Tag */}
                  <div className="mt-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${channel.bg} ${channel.text}`}>
                      <ChannelIcon className="w-3.5 h-3.5" />
                      {channel.label}
                    </span>
                  </div>

                  {/* Quick message preview */}
                  <p className="mt-4 text-xs text-slate-400 font-semibold line-clamp-2 leading-relaxed bg-[#2A2D3A]/20 border border-[#2A2D3A]/40 rounded-xl p-3">
                    {camp.message}
                  </p>
                </div>

                {/* Footer and Dispatch Button */}
                <div className="mt-6 border-t border-[#2A2D3A]/60 pt-4 flex justify-between items-center text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(camp.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {camp.status === 'draft' ? (
                    <button
                      onClick={(e) => handleSendCampaign(e, camp._id)}
                      disabled={sendingId === camp._id}
                      className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#818CF8] disabled:opacity-50 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-[#6366F1]/10 transition-all"
                    >
                      {sendingId === camp._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white" />
                      )}
                      Send Campaign
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/campaigns/${camp._id}`);
                      }}
                      className="flex items-center gap-1 text-[#6366F1] hover:text-[#818CF8] px-2 py-1 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Analytics
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal form */}
      {modalOpen && (
        <CampaignForm 
          onClose={() => setModalOpen(false)} 
          onSuccess={handleCreateSuccess} 
        />
      )}
    </div>
  );
}
