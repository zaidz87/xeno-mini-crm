/**
 * Dashboard Page
 * Provides a welcome header, four animated stat cards, recent campaigns table,
 * performance charts utilizing Recharts, and quick navigation actions.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Layers, Megaphone, Send, Plus, 
  ArrowRight, BarChart3, TrendingUp, Sparkles 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

import { customerApi, segmentApi, campaignApi } from '../services/api';
import StatCard from '../components/StatCard';
import { useToast } from '../components/ToastContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalSegments: 0,
    totalCampaigns: 0,
    totalSent: 0
  });
  
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        // Fetch all needed metrics from centralized API service
        const customersRes = await customerApi.getCustomers('', 1, 1);
        const segmentsRes = await segmentApi.getSegments();
        const campaignsRes = await campaignApi.getCampaigns();

        const totalCustomers = customersRes?.pagination?.total || 0;
        const totalSegments = segmentsRes?.segments?.length || 0;
        const campaigns = campaignsRes?.campaigns || [];
        const totalCampaigns = campaigns.length;

        // Sum up total messages sent
        let totalSent = 0;
        campaigns.forEach(c => {
          if (c.status !== 'draft') {
            totalSent += (c.sent || 0);
          }
        });

        setStats({
          totalCustomers,
          totalSegments,
          totalCampaigns,
          totalSent
        });

        // Set recent 5 campaigns
        setRecentCampaigns(campaigns.slice(0, 5));

        // Format chart data for Recharts (recent campaigns performance)
        const activeCampaigns = campaigns
          .filter(c => c.status !== 'draft')
          .slice(0, 6)
          .reverse(); // oldest to newest for chronological chart display

        const formattedChart = activeCampaigns.map(c => ({
          name: c.name.length > 15 ? c.name.slice(0, 12) + '...' : c.name,
          Sent: c.sent || 0,
          Delivered: c.delivered || 0,
          Opened: c.opened || 0,
          Clicked: c.clicked || 0
        }));

        setChartData(formattedChart);
      } catch (error) {
        console.error('Failed to load dashboard metrics:', error);
        toast.error('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-7xl mx-auto w-full">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Welcome to Xeno CRM
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Grow your brand with AI-powered segmentation and smart marketing messaging.
          </p>
        </div>

        {/* Quick Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/segments')}
            className="flex items-center gap-2 bg-[#2A2D3A] hover:bg-[#2A2D3A]/80 border border-[#2A2D3A] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            Create Segment
          </button>
          
          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#818CF8] px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-[#6366F1]/20 transition-all duration-200"
          >
            <Send className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {loading ? (
        // Loading Skeletons
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl p-6 h-28 animate-pulse-glow" />
          ))}
        </div>
      ) : (
        // Stats Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} />
          <StatCard title="Total Segments" value={stats.totalSegments} icon={Layers} />
          <StatCard title="Total Campaigns" value={stats.totalCampaigns} icon={Megaphone} />
          <StatCard title="Messages Sent" value={stats.totalSent} icon={Send} />
        </div>
      )}

      {/* Main Grid: Charts & Recents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#6366F1]" />
                Campaign Performance
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Stats of your last 6 dispatched campaigns.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-full border border-[#10B981]/20">
              <TrendingUp className="w-3.5 h-3.5" />
              Live Feed
            </div>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="w-full h-full bg-[#2A2D3A]/20 rounded-xl animate-pulse-glow" />
            ) : chartData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-[#2A2D3A] rounded-xl p-4">
                <BarChart3 className="w-12 h-12 text-[#2A2D3A] mb-3" />
                <p className="text-sm">No dispatched campaigns to display.</p>
                <p className="text-xs text-slate-600 mt-1">Send a campaign to start gathering stats.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1D27', borderColor: '#2A2D3A', borderRadius: '12px' }}
                    labelStyle={{ color: '#F1F5F9', fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="Sent" fill="#6B7280" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Delivered" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Opened" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Clicked" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Campaigns list */}
        <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">Recent Campaigns</h2>
            <button
              onClick={() => navigate('/campaigns')}
              className="text-xs font-bold text-[#6366F1] hover:text-[#818CF8] flex items-center gap-1 transition-colors"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-16 bg-[#2A2D3A]/20 rounded-xl animate-pulse-glow" />
              ))}
            </div>
          ) : recentCampaigns.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-[#2A2D3A] rounded-xl p-4">
              <Megaphone className="w-10 h-10 text-[#2A2D3A] mb-3" />
              <p className="text-sm font-medium">No campaigns created yet.</p>
              <button 
                onClick={() => navigate('/campaigns')}
                className="mt-4 text-xs font-bold text-[#6366F1] hover:underline"
              >
                Create your first campaign &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((camp) => {
                let statusColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                if (camp.status === 'sending') {
                  statusColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                } else if (camp.status === 'completed') {
                  statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                }

                return (
                  <div
                    key={camp._id}
                    onClick={() => navigate(`/campaigns/${camp._id}`)}
                    className="p-4 bg-[#2A2D3A]/20 hover:bg-[#2A2D3A]/40 border border-[#2A2D3A] rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 group"
                  >
                    <div className="truncate pr-2">
                      <h4 className="font-bold text-sm text-slate-200 truncate group-hover:text-slate-100 transition-colors">
                        {camp.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        Channel: <span className="uppercase text-slate-400">{camp.channel}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                        {camp.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
