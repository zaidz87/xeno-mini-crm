/**
 * Navbar Component
 * Sidebar navigation layout displaying links to Dashboard, Customers, Segments, and Campaigns.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Layers, Megaphone, Sparkles } from 'lucide-react';

export default function Navbar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Segments', path: '/segments', icon: Layers },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone }
  ];

  return (
    <aside className="w-64 bg-[#1A1D27] border-r border-[#2A2D3A] flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Logo Header */}
        <div className="p-6 border-b border-[#2A2D3A] flex items-center gap-2">
          <div className="bg-[#6366F1]/10 p-2 rounded-lg border border-[#6366F1]/20">
            <Sparkles className="w-6 h-6 text-[#6366F1]" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-100 tracking-tight leading-none">Xeno CRM</h2>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">AI-Native</span>
          </div>
        </div>

        {/* Navigation Link list */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/15'
                      : 'text-slate-400 hover:bg-[#2A2D3A]/50 hover:text-slate-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding Details */}
      <div className="p-6 border-t border-[#2A2D3A] text-[11px] text-slate-500 font-medium">
        <p>© 2026 Xeno Mini CRM</p>
        <p className="mt-1">Pair-programmed by Antigravity</p>
      </div>
    </aside>
  );
}
