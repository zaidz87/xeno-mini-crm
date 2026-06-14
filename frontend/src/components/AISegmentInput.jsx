/**
 * AISegmentInput Component
 * Allows users to describe their target audience in plain English.
 * Calls backend Gemini AI endpoint to convert text into segmentation rules.
 */
import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { aiApi } from '../services/api';
import { useToast } from './ToastContext';

export default function AISegmentInput({ onRulesGenerated }) {
  const toast = useToast();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerateRules = async () => {
    if (!prompt.trim()) return;

    try {
      setGenerating(true);
      toast.info('AI is interpreting your description...');
      const data = await aiApi.parseSegmentRules(prompt);
      
      if (data.success && data.rules) {
        toast.success('AI successfully generated rules!');
        onRulesGenerated(data.rules);
      } else {
        toast.error('AI was unable to compile rules. Try describing it in simpler terms.');
      }
    } catch (error) {
      console.error('AI Segment generation failed:', error);
      const errMsg = error.response?.data?.message || error.message || 'Failed to interpret prompt.';
      toast.error(errMsg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#6366F1]" />
          Describe Audience in Plain English
        </label>
        <textarea
          rows="3"
          placeholder="e.g. Customers who spent more than Rs 5000 and placed at least 3 orders, or customers who haven't ordered in the last 60 days."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={generating}
          className="w-full bg-[#1A1D27] border border-[#2A2D3A] text-sm text-slate-200 placeholder-slate-500 rounded-xl p-3.5 outline-none focus:border-[#6366F1] transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-500 font-semibold leading-relaxed">
          AI supports filters on spend (₹), orders, and last order dates.
        </span>
        
        <button
          type="button"
          onClick={handleGenerateRules}
          disabled={!prompt.trim() || generating}
          className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#818CF8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-[#6366F1]/10 transition-all duration-200"
        >
          {generating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Generate Rules
            </>
          )}
        </button>
      </div>
    </div>
  );
}
