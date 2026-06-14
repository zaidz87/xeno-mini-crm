/**
 * CampaignDetail Page
 * Renders analytics for a single campaign. Shows a 5-card stat row, progress rate bars
 * (Delivery, Open, Click), customer logs list, and triggers a 5s auto-refresh while 'sending'.
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Megaphone, Calendar, Layers, Activity, 
  Send, CheckCircle, AlertTriangle, Eye, MousePointerClick, RefreshCw, Trash2 
} from 'lucide-react';

import { campaignApi } from '../services/api';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import CommunicationTable from '../components/CommunicationTable';
import { useToast } from '../components/ToastContext';

const STATUS_THEME = {
  draft: { label: 'Draft', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', dot: 'bg-slate-400' },
  sending: { label: 'Sending Live', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20 animate-pulse', dot: 'bg-blue-400 animate-ping' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' }
};

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [campaign, setCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(false);

  const handleDeleteCampaign = async () => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      const data = await campaignApi.deleteCampaign(id);
      if (data.success) {
        toast.success(data.message || 'Campaign deleted successfully.');
        navigate('/campaigns');
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      const errMsg = error.response?.data?.message || error.message || 'Delete process failed.';
      toast.error(errMsg);
    }
  };

  useEffect(() => {
    let intervalId;

    async function fetchCampaignData() {
      try {
        const campaignRes = await campaignApi.getCampaignDetail(id);
        const logsRes = await campaignApi.getCampaignLogs(id);

        if (campaignRes.success) {
          setCampaign(campaignRes.campaign);
          
          const isSending = campaignRes.campaign.status === 'sending';
          setPollingActive(isSending);

          // If the campaign has finished sending, terminate the polling sequence
          if (!isSending && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
        
        if (logsRes.success) {
          setLogs(logsRes.logs);
        }
      } catch (error) {
        console.error('Error fetching campaign details:', error);
        toast.error('Failed to sync campaign analytics.');
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    fetchCampaignData();

    // Begin 5-second polling if campaign sending process is active
    intervalId = setInterval(() => {
      fetchCampaignData();
    }, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-500 w-full">
        <Activity className="w-12 h-12 text-[#6366F1] animate-spin mb-4" />
        <p className="text-sm font-semibold">Syncing campaign dashboard...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">Campaign Not Found</h3>
        <p className="text-sm text-slate-500">The campaign analytics board you are looking for does not exist.</p>
        <button
          onClick={() => navigate('/campaigns')}
          className="bg-[#2A2D3A] text-slate-200 px-4 py-2 rounded-xl text-xs font-bold border border-[#2A2D3A] hover:bg-slate-700 transition-colors"
        >
          Back to Campaigns List
        </button>
      </div>
    );
  }

  const statusStyle = STATUS_THEME[campaign.status] || STATUS_THEME.draft;

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-7xl mx-auto w-full">
      
      {/* Navigation and Polling status indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </button>

        {pollingActive && (
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-500/15 border border-blue-500/20 px-3 py-1.5 rounded-full">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Polling status real-time (5s)
          </div>
        )}
      </div>

      {/* Campaign Metadata Header Card */}
      <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-[#6366F1]" />
            {campaign.name}
          </h1>
          
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold text-slate-500 mt-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-600" />
              <span>Target: <span className="text-slate-400">{campaign.segmentName}</span></span>
            </div>
            
            <span>•</span>
            
            <div className="flex items-center gap-1.5 uppercase">
              <Activity className="w-4 h-4 text-slate-600" />
              <span>Channel: <span className="text-slate-400 font-bold">{campaign.channel}</span></span>
            </div>
            
            <span>•</span>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span>Created on {new Date(campaign.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </div>

        {/* Big Status Badge & Delete Button */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 border rounded-full font-bold text-xs ${statusStyle.bg} ${statusStyle.color}`}>
            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </div>
          
          <button
            onClick={handleDeleteCampaign}
            className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 transition-all duration-200"
            title="Delete Campaign"
          >
            <Trash2 className="w-4 h-4" />
            Delete Campaign
          </button>
        </div>
      </div>

      {/* 5-Metrics Counter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Sent (Audience)" value={campaign.sent || 0} icon={Send} />
        <StatCard title="Delivered" value={campaign.delivered || 0} icon={CheckCircle} />
        <StatCard title="Failed" value={campaign.failed || 0} icon={AlertTriangle} />
        <StatCard title="Opened" value={campaign.opened || 0} icon={Eye} />
        <StatCard title="Clicked" value={campaign.clicked || 0} icon={MousePointerClick} />
      </div>

      {/* Conversion Rate Progress Bars */}
      <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">Conversion Funnel</h2>
          <p className="text-xs text-slate-400 mt-0.5">Rates represent ratios relative to prior funnel stages.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Delivery Rate = delivered / sent */}
          <ProgressBar
            label="Delivery Rate"
            value={campaign.delivered || 0}
            total={campaign.sent || 0}
            colorClass="bg-[#3B82F6]" // Blue
          />

          {/* Open Rate = opened / delivered */}
          <ProgressBar
            label="Open Rate (of Delivered)"
            value={campaign.opened || 0}
            total={campaign.delivered || 0}
            colorClass="bg-[#F59E0B]" // Amber
          />

          {/* Click Rate = clicked / opened */}
          <ProgressBar
            label="Click Through Rate (of Opened)"
            value={campaign.clicked || 0}
            total={campaign.opened || 0}
            colorClass="bg-[#10B981]" // Green
          />
        </div>
      </div>

      {/* Granular Logs Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">Granular Delivery Logs</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time listing of customer delivery states.</p>
        </div>

        <CommunicationTable logs={logs} />
      </div>

    </div>
  );
}
