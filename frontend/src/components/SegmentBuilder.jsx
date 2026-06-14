/**
 * SegmentBuilder Component
 * Provides a form interface for manual rule construction. Allows adding, editing,
 * and deleting individual rule filters (field, operator, value) dynamically.
 */
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const FIELDS = [
  { value: 'totalSpend', label: 'Total Spend (₹)' },
  { value: 'orderCount', label: 'Order Count' },
  { value: 'daysSinceLastOrder', label: 'Days Since Last Order' }
];

const OPERATORS = [
  { value: 'gt', label: 'Greater Than (>)' },
  { value: 'gte', label: 'Greater Than or Equal (>=)' },
  { value: 'lt', label: 'Less Than (<)' },
  { value: 'lte', label: 'Less Than or Equal (<=)' },
  { value: 'eq', label: 'Equal To (=)' }
];

export default function SegmentBuilder({ rules, setRules }) {
  const addRuleRow = () => {
    setRules([...rules, { field: 'totalSpend', operator: 'gt', value: 2000 }]);
  };

  const removeRuleRow = (index) => {
    const updated = rules.filter((_, idx) => idx !== index);
    setRules(updated);
  };

  const handleRuleChange = (index, property, val) => {
    const updated = rules.map((rule, idx) => {
      if (idx === index) {
        return {
          ...rule,
          [property]: property === 'value' ? Number(val) : val
        };
      }
      return rule;
    });
    setRules(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Segmentation Filters</label>
        <button
          type="button"
          onClick={addRuleRow}
          className="flex items-center gap-1.5 text-xs font-bold text-[#6366F1] hover:text-[#818CF8] bg-[#6366F1]/10 hover:bg-[#6366F1]/15 px-3 py-1.5 rounded-lg border border-[#6366F1]/20 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Filter
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center p-6 border border-dashed border-[#2A2D3A] rounded-xl text-slate-500 text-xs">
          No filters set. This segment will match all customers.
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {rules.map((rule, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center bg-[#2A2D3A]/20 border border-[#2A2D3A]/50 p-3 rounded-xl animate-fade-in">
              
              {/* Field Select */}
              <select
                value={rule.field}
                onChange={(e) => handleRuleChange(idx, 'field', e.target.value)}
                className="flex-1 bg-[#1A1D27] border border-[#2A2D3A] text-xs font-semibold text-slate-300 rounded-lg p-2.5 outline-none focus:border-[#6366F1] transition-colors"
              >
                {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>

              {/* Operator Select */}
              <select
                value={rule.operator}
                onChange={(e) => handleRuleChange(idx, 'operator', e.target.value)}
                className="w-full sm:w-44 bg-[#1A1D27] border border-[#2A2D3A] text-xs font-semibold text-slate-300 rounded-lg p-2.5 outline-none focus:border-[#6366F1] transition-colors"
              >
                {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
              </select>

              {/* Numeric Value Input */}
              <input
                type="number"
                value={rule.value}
                onChange={(e) => handleRuleChange(idx, 'value', e.target.value)}
                className="w-full sm:w-28 bg-[#1A1D27] border border-[#2A2D3A] text-xs font-bold text-slate-200 rounded-lg p-2.5 outline-none focus:border-[#6366F1] transition-colors"
                placeholder="Value"
                min="0"
              />

              {/* Delete row */}
              <button
                type="button"
                onClick={() => removeRuleRow(idx)}
                className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/25 transition-all shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
