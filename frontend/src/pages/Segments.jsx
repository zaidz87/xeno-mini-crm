/**
 * Segments Page
 * Lists saved segments, provides segment deletion, and contains the audience builder modal
 * that integrates both manual builders and Gemini AI prompts with real-time customer preview counts.
 */
import React, { useEffect, useState } from 'react';
import { 
  Layers, Plus, Trash2, Calendar, Users, X, Info, Sparkles, Loader2 
} from 'lucide-react';

import { segmentApi } from '../services/api';
import SegmentBuilder from '../components/SegmentBuilder';
import AISegmentInput from '../components/AISegmentInput';
import { useToast } from '../components/ToastContext';

export default function Segments() {
  const toast = useToast();
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [segName, setSegName] = useState('');
  const [segDesc, setSegDesc] = useState('');
  const [rules, setRules] = useState([]);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'ai'
  
  // Preview states
  const [previewCount, setPreviewCount] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSegments = async () => {
    try {
      setLoading(true);
      const data = await segmentApi.getSegments();
      if (data.success) {
        setSegments(data.segments);
      }
    } catch (error) {
      console.error('Failed to load segments:', error);
      toast.error('Failed to load audience segments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSegments();
  }, []);

  // Fetch count preview when rules change
  useEffect(() => {
    if (!modalOpen) return;

    const controller = new AbortController();
    
    async function getPreview() {
      try {
        setPreviewing(true);
        const data = await segmentApi.previewRules(rules);
        if (data.success) {
          setPreviewCount(data.matchedCount);
        }
      } catch (error) {
        console.error('Failed to preview rule counts:', error);
      } finally {
        setPreviewing(false);
      }
    }

    // Debounce to prevent API slamming
    const delayDebounceFn = setTimeout(() => {
      getPreview();
    }, 400);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [rules, modalOpen]);

  const handleDeleteSegment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this segment? This action cannot be undone.')) {
      return;
    }

    try {
      const data = await segmentApi.deleteSegment(id);
      if (data.success) {
        toast.success(data.message || 'Segment deleted successfully.');
        loadSegments();
      }
    } catch (error) {
      console.error('Delete segment failed:', error);
      toast.error('Failed to delete segment.');
    }
  };

  const handleCreateSegmentSubmit = async (e) => {
    e.preventDefault();
    if (!segName.trim()) {
      toast.error('Segment name is required.');
      return;
    }

    try {
      setSaving(true);
      const data = await segmentApi.createSegment({
        name: segName.trim(),
        description: segDesc.trim(),
        rules
      });

      if (data.success) {
        toast.success(data.message || 'Segment saved successfully.');
        setModalOpen(false);
        resetModalState();
        loadSegments();
      }
    } catch (error) {
      console.error('Save segment error:', error);
      const errMsg = error.response?.data?.message || error.message || 'Failed to save segment.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const resetModalState = () => {
    setSegName('');
    setSegDesc('');
    setRules([]);
    setPreviewCount(null);
    setActiveTab('manual');
  };

  const formatRuleReadable = (rule) => {
    const fieldNames = {
      totalSpend: 'Spend',
      orderCount: 'Orders',
      daysSinceLastOrder: 'Inactivity'
    };
    const operators = {
      gt: '>',
      gte: '≥',
      lt: '<',
      lte: '≤',
      eq: '='
    };
    const suffix = rule.field === 'totalSpend' ? ' ₹' : rule.field === 'daysSinceLastOrder' ? ' days' : '';
    
    return `${fieldNames[rule.field]} ${operators[rule.operator]} ${rule.value.toLocaleString('en-IN')}${suffix}`;
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-7xl mx-auto w-full">
      {/* Header section */}
      <div className="flex justify-between items-center border-b border-[#2A2D3A] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Layers className="w-8 h-8 text-[#6366F1]" />
            Audience Segments
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Build and filter marketing targets manually or using conversational AI prompts.
          </p>
        </div>

        <button
          onClick={() => {
            resetModalState();
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#818CF8] px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-[#6366F1]/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Create Segment
        </button>
      </div>

      {loading ? (
        // Loading Cards
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl h-56 animate-pulse-glow" />
          ))}
        </div>
      ) : segments.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center p-16 text-slate-500 bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl">
          <Layers className="w-16 h-16 text-[#2A2D3A] mb-4" />
          <h3 className="text-lg font-bold text-slate-300">No Segments Created</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">
            You haven't defined any audience groups yet. Create a segment using criteria filters or type your ideas in the AI assistant.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-6 bg-[#6366F1] hover:bg-[#818CF8] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-[#6366F1]/10"
          >
            Create Your First Segment
          </button>
        </div>
      ) : (
        // Segments Grid
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {segments.map((seg) => (
            <div
              key={seg._id}
              className="bg-[#1A1D27] border border-[#2A2D3A] hover:border-[#6366F1]/30 rounded-2xl p-6 flex flex-col justify-between shadow-sm group hover:shadow-lg transition-all duration-300"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="truncate pr-4">
                    <h3 className="font-bold text-slate-100 text-base truncate group-hover:text-[#6366F1] transition-colors duration-300">
                      {seg.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{seg.description || 'No description provided.'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSegment(seg._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Rule Tag compilation */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {seg.rules && seg.rules.length > 0 ? (
                    seg.rules.map((rule, idx) => (
                      <span
                        key={idx}
                        className="bg-[#2A2D3A]/40 border border-[#2A2D3A] text-slate-300 text-[10px] font-bold px-2 py-1 rounded-md"
                      >
                        {formatRuleReadable(rule)}
                      </span>
                    ))
                  ) : (
                    <span className="bg-slate-500/5 border border-slate-500/10 text-slate-400 text-[10px] font-semibold px-2 py-1 rounded-md">
                      Matches All Customers
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer details */}
              <div className="mt-6 border-t border-[#2A2D3A]/60 pt-4 flex justify-between items-center text-xs text-slate-500 font-semibold">
                <div className="flex items-center gap-1.5 text-slate-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-md">
                  <Users className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span>{seg.matchedCount.toLocaleString('en-IN')} matches</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {new Date(seg.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateSegmentSubmit}
            className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2A2D3A]">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#6366F1]" />
                Build Audience Segment
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                disabled={saving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              
              {/* Meta Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Segment Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. High Value Inactive Customers"
                    value={segName}
                    onChange={(e) => setSegName(e.target.value)}
                    className="w-full bg-[#1A1D27] border border-[#2A2D3A] text-sm text-slate-200 placeholder-slate-600 rounded-xl p-3 outline-none focus:border-[#6366F1] transition-colors"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Customers with ₹5k+ spend and >60 days since last purchase"
                    value={segDesc}
                    onChange={(e) => setSegDesc(e.target.value)}
                    className="w-full bg-[#1A1D27] border border-[#2A2D3A] text-sm text-slate-200 placeholder-slate-600 rounded-xl p-3 outline-none focus:border-[#6366F1] transition-colors"
                  />
                </div>
              </div>

              {/* Creator Tabs */}
              <div className="border-b border-[#2A2D3A]">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all ${
                      activeTab === 'manual'
                        ? 'border-[#6366F1] text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Manual Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ai')}
                    className={`pb-3 text-sm font-semibold tracking-wide border-b-2 flex items-center gap-1.5 transition-all ${
                      activeTab === 'ai'
                        ? 'border-[#6366F1] text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
                    AI Assistant
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="bg-[#2A2D3A]/10 border border-[#2A2D3A]/40 rounded-2xl p-5">
                {activeTab === 'manual' ? (
                  <SegmentBuilder rules={rules} setRules={setRules} />
                ) : (
                  <AISegmentInput onRulesGenerated={setRules} />
                )}
              </div>

              {/* Rule Summary Display (if rules are active in AI tab) */}
              {activeTab === 'ai' && rules.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Generated Filter List</span>
                  <div className="flex flex-wrap gap-2 p-3 bg-[#2A2D3A]/20 border border-[#2A2D3A]/60 rounded-xl">
                    {rules.map((rule, idx) => (
                      <span key={idx} className="bg-[#2A2D3A] border border-[#2A2D3A] text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-lg">
                        {formatRuleReadable(rule)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Hud */}
              <div className="flex items-center gap-3 p-4 bg-[#6366F1]/5 border border-[#6366F1]/20 rounded-xl">
                <Info className="w-5 h-5 text-[#6366F1] shrink-0" />
                <div className="flex-1 flex justify-between items-center text-sm font-semibold text-slate-200">
                  <span>Preview Target Audience Count:</span>
                  
                  {previewing ? (
                    <div className="flex items-center gap-1 text-slate-500 font-normal text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
                      Recalculating...
                    </div>
                  ) : (
                    <span className="text-[#6366F1] font-bold text-base">
                      {previewCount !== null ? `${previewCount.toLocaleString('en-IN')} customers` : '0 customers'}
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 p-6 border-t border-[#2A2D3A] bg-[#2A2D3A]/10">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#818CF8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-[#6366F1]/15 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Segment'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
