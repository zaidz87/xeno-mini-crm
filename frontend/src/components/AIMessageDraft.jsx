/**
 * AIMessageDraft Component
 * Integrates with Google Gemini AI to draft campaign message copy from description inputs.
 */
import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { aiApi } from '../services/api';
import { useToast } from './ToastContext';

export default function AIMessageDraft({ onMessageDrafted, channel }) {
  const toast = useToast();
  const [goal, setGoal] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerateMessage = async () => {
    if (!goal.trim()) return;

    try {
      setGenerating(true);
      toast.info('AI is drafting your copy...');
      const data = await aiApi.generateMessage(goal);
      
      if (data.success && data.message) {
        toast.success('AI successfully drafted your message!');
        onMessageDrafted(data.message);
      } else {
        toast.error('AI Copywriter was unable to generate copy.');
      }
    } catch (error) {
      console.error('AI message draft generation failed:', error);
      const errMsg = error.response?.data?.message || error.message || 'Failed to generate copy.';
      toast.error(errMsg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#6366F1]" />
          Draft Message with AI Copywriter
        </label>
        <input
          type="text"
          placeholder="e.g. Win back customers who spent ₹5000+ with 15% off using code MISSYOU15"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          disabled={generating}
          className="w-full bg-[#1A1D27] border border-[#2A2D3A] text-xs text-slate-200 placeholder-slate-600 rounded-xl p-3 outline-none focus:border-[#6366F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-500 font-semibold leading-relaxed">
          AI will automatically generate a message formatted for {channel || 'WhatsApp/SMS'}.
        </span>
        <button
          type="button"
          onClick={handleGenerateMessage}
          disabled={!goal.trim() || generating}
          className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#818CF8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
        >
          {generating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Writing...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
