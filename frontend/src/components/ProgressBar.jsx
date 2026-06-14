/**
 * ProgressBar Component
 * Renders custom stylized horizontal loading indicators for metrics like
 * Delivery Rate, Open Rate, and Click Rate.
 */
import React from 'react';

export default function ProgressBar({ label, value, total, colorClass = 'bg-[#6366F1]' }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-semibold tracking-wider text-slate-400">
        <span className="uppercase">{label}</span>
        <span className="text-slate-200">{percentage}% <span className="text-slate-500 font-normal">({value}/{total})</span></span>
      </div>
      
      <div className="w-full bg-[#2A2D3A] h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
