/**
 * StatCard Component
 * Displays key statistical metric with a custom icon, support for currency symbols,
 * and an animated count-up transition on mount.
 */
import React, { useEffect, useState } from 'react';

export default function StatCard({ title, value, icon: Icon, prefix = '', suffix = '', delay = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const endValue = Number(value);
    if (isNaN(endValue)) {
      // If the value is a string (e.g. "85.4%"), just show it directly
      setDisplayValue(value);
      return;
    }

    if (endValue === 0) {
      setDisplayValue(0);
      return;
    }

    let start = 0;
    const duration = 1000; // Animation duration in ms
    const frameRate = 1000 / 60; // 60 FPS
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      // Ease out quad animation curve
      const progress = frame / totalFrames;
      const easeProgress = progress * (2 - progress);
      const currentVal = Math.round(endValue * easeProgress);

      if (frame >= totalFrames) {
        clearInterval(counter);
        setDisplayValue(endValue);
      } else {
        setDisplayValue(currentVal);
      }
    }, frameRate);

    return () => clearInterval(counter);
  }, [value]);

  const formattedDisplay = typeof displayValue === 'number' 
    ? displayValue.toLocaleString('en-IN') 
    : displayValue;

  return (
    <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl p-6 shadow-sm hover:border-[#6366F1]/30 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-100 mt-2 tracking-tight group-hover:text-[#6366F1] transition-colors duration-300">
            {prefix}{formattedDisplay}{suffix}
          </h3>
        </div>
        
        {Icon && (
          <div className="p-3 bg-[#2A2D3A]/40 rounded-xl group-hover:bg-[#6366F1]/10 group-hover:border-[#6366F1]/20 border border-transparent transition-all duration-300">
            <Icon className="w-6 h-6 text-slate-400 group-hover:text-[#6366F1] transition-colors duration-300" />
          </div>
        )}
      </div>
    </div>
  );
}
