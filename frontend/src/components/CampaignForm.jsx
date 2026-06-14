/**
 * CampaignForm Modal Component
 * Renders the dialog box to create a new campaign draft.
 * Connects with segment models, provides channel selectors with custom themes,
 * mounts the AIMessageDraft editor, and renders real-time personalized previews.
 */
import React, { useEffect, useState } from 'react';
import { 
  X, Megaphone, Sparkles, MessageCircle, Smartphone, Mail, Info, Loader2 
} from 'lucide-react';

import { segmentApi, campaignApi } from '../services/api';
import AIMessageDraft from './AIMessageDraft';
import { useToast } from './ToastContext';

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { value: 'sms', label: 'SMS', icon: Smartphone, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' }
];

export default function CampaignForm({ onClose, onSuccess }) {
  const toast = useToast();
  const [segments, setSegments] = useState([]);
  const [loadingSegments, setLoadingSegments] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [message, setMessage] = useState('');
  
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load saved segments to select target
  useEffect(() => {
    async function loadSegments() {
      try {
        setLoadingSegments(true);
        const data = await segmentApi.getSegments();
        if (data.success) {
          setSegments(data.segments);
          if (data.segments.length > 0) {
            setSegmentId(data.segments[0]._id);
          }
        }
      } catch (error) {
        console.error('Failed to load segments:', error);
        toast.error('Failed to retrieve audience segments.');
      } finally {
        setLoadingSegments(false);
      }
    }
    loadSegments();
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !segmentId || !message.trim()) {
      toast.error('All fields (name, segment, message) are required.');
      return;
    }

    try {
      setSaving(true);
      const data = await campaignApi.createCampaign({
        name: name.trim(),
        segmentId,
        channel,
        message: message.trim()
      });

      if (data.success) {
        toast.success(data.message || 'Campaign draft created successfully.');
        if (onSuccess) onSuccess(data.campaign);
      }
    } catch (error) {
      console.error('Create campaign error:', error);
      const errMsg = error.response?.data?.message || error.message || 'Failed to create campaign.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Real-time personalized preview helper replacing {{name}} -> Priya Sharma
  const getPersonalizedPreview = () => {
    if (!message) return 'A preview of your message will appear here.';
    return message.replace(/{{name}}/g, 'Priya Sharma');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2D3A]">
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#6366F1]" />
            Configure Marketing Campaign
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* Campaign Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Festival Season Sale Reminder"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1A1D27] border border-[#2A2D3A] text-sm text-slate-200 placeholder-slate-600 rounded-xl p-3 outline-none focus:border-[#6366F1] transition-colors"
            />
          </div>

          {/* Segment Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Segment</label>
            {loadingSegments ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 p-3 bg-[#1A1D27] border border-[#2A2D3A] rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
                Loading segments...
              </div>
            ) : segments.length === 0 ? (
              <div className="flex items-start gap-2.5 text-xs font-semibold text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>You don't have any segments created. Go create an audience segment first.</span>
              </div>
            ) : (
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className="w-full bg-[#1A1D27] border border-[#2A2D3A] text-sm text-slate-200 rounded-xl p-3 outline-none focus:border-[#6366F1] transition-colors font-semibold"
              >
                {segments.map(seg => (
                  <option key={seg._id} value={seg._id}>
                    {seg.name} ({seg.matchedCount} matches)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Channel Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dispatch Channel</label>
            <div className="grid grid-cols-3 gap-3">
              {CHANNELS.map(ch => {
                const Icon = ch.icon;
                const isSelected = channel === ch.value;
                return (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => setChannel(ch.value)}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all duration-200 ${
                      isSelected
                        ? `${ch.bg} border-[#6366F1] text-slate-100 shadow-md shadow-[#6366F1]/5`
                        : 'border-[#2A2D3A] bg-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${ch.color}`} />
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Area with AI Assist Toggle */}
          <div className="space-y-2 border-t border-[#2A2D3A]/60 pt-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                Campaign Message Body
                <span className="text-[10px] text-indigo-400 font-normal lowercase">(supports {"{{name}}"} tag)</span>
              </label>
              
              <button
                type="button"
                onClick={() => setShowAiDraft(!showAiDraft)}
                className="flex items-center gap-1 text-xs font-bold text-[#6366F1] hover:text-[#818CF8]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {showAiDraft ? 'Close AI Writer' : 'Draft with AI'}
              </button>
            </div>

            {/* AI Copywriter expansion card */}
            {showAiDraft && (
              <div className="bg-[#6366F1]/5 border border-[#6366F1]/20 rounded-2xl p-4 animate-fade-in mb-3">
                <AIMessageDraft 
                  channel={channel} 
                  onMessageDrafted={(text) => {
                    setMessage(text);
                    setShowAiDraft(false);
                  }} 
                />
              </div>
            )}

            <textarea
              rows="4"
              required
              placeholder="Hey {{name}}, check out our new arrivals! Get a flat 10% discount on your next order today."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#1A1D27] border border-[#2A2D3A] text-sm text-slate-200 placeholder-slate-600 rounded-xl p-3 outline-none focus:border-[#6366F1] transition-colors resize-none"
            />
          </div>

          {/* Message Preview bubble */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Delivery Preview</label>
            <div className="p-4 bg-[#2A2D3A]/30 border border-[#2A2D3A] rounded-xl text-xs font-medium text-slate-300 italic font-mono leading-relaxed break-words">
              {getPersonalizedPreview()}
            </div>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 p-6 border-t border-[#2A2D3A] bg-[#2A2D3A]/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={saving || segments.length === 0}
            className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#818CF8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-[#6366F1]/15 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Campaign Draft'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
