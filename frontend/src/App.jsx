/**
 * App Component
 * Wires up React Router navigation, sidebar layouts, and integrates the custom ToastProvider.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Segments from './pages/Segments';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import { ToastProvider } from './components/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="flex bg-[#0F1117] text-slate-100 min-h-screen font-sans selection:bg-[#6366F1]/30">
          
          {/* Sidebar Navigation */}
          <Navbar />

          {/* Main App Content Viewport */}
          <main className="flex-1 min-w-0 overflow-y-auto h-screen bg-[#0F1117]">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/segments" element={<Segments />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/campaigns/:id" element={<CampaignDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

        </div>
      </Router>
    </ToastProvider>
  );
}
