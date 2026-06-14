/**
 * CommunicationTable Component
 * Renders a data table listing all customer communication logs for a campaign.
 * Styles status cells as custom-colored badges matching status requirements:
 * delivered (blue), failed (red), opened (amber), clicked (green), sent (gray).
 */
import React, { useState } from 'react';
import { 
  FileText, MessageCircle, Smartphone, Mail, ChevronLeft, ChevronRight 
} from 'lucide-react';

const STATUS_STYLE = {
  sent: { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400', label: 'Sent' },
  delivered: { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400', label: 'Delivered' },
  failed: { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-400', label: 'Failed' },
  opened: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400', label: 'Opened' },
  clicked: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', label: 'Clicked' }
};

const CHANNEL_ICON = {
  whatsapp: MessageCircle,
  sms: Smartphone,
  email: Mail
};

export default function CommunicationTable({ logs }) {
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl">
        <FileText className="w-12 h-12 text-[#2A2D3A] mb-3" />
        <p className="text-sm font-medium">No communication logs recorded.</p>
        <p className="text-xs text-slate-600 mt-1">If sending is active, logs will populate shortly.</p>
      </div>
    );
  }

  // Calculate pagination boundaries
  const totalRecords = logs.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentLogs = logs.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
    <div className="space-y-4">
      {/* Logs Table */}
      <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A2D3A] bg-[#2A2D3A]/20 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Customer Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6 text-center">Channel</th>
                <th className="py-4 px-6">Personalized Message</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Last Updated</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[#2A2D3A]/50 text-xs text-slate-300">
              {currentLogs.map((log) => {
                const style = STATUS_STYLE[log.status] || { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400', label: log.status };
                const ChannelIcon = CHANNEL_ICON[log.channel] || MessageCircle;

                // Find timestamp of last history item
                const lastHistoryItem = log.statusHistory && log.statusHistory.length > 0
                  ? log.statusHistory[log.statusHistory.length - 1]
                  : null;
                const lastUpdatedTime = lastHistoryItem 
                  ? new Date(lastHistoryItem.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'N/A';

                return (
                  <tr key={log._id} className="hover:bg-[#2A2D3A]/10 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-200">{log.customerName}</td>
                    <td className="py-3.5 px-6 text-slate-500 font-medium">{log.customerEmail}</td>
                    <td className="py-3.5 px-6 text-center">
                      <span className="inline-block p-1.5 bg-[#2A2D3A] rounded-lg text-slate-400">
                        <ChannelIcon className="w-4 h-4" />
                      </span>
                    </td>
                    <td className="py-3.5 px-6 max-w-xs truncate text-slate-300" title={log.message}>
                      {log.message}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-bold text-[10px] uppercase tracking-wide ${style.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono text-slate-500 font-semibold">{lastUpdatedTime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs font-semibold">
          <p className="text-slate-500">
            Showing <span className="text-slate-300">{currentLogs.length}</span> of <span className="text-slate-300">{totalRecords}</span> logs
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 bg-[#1A1D27] hover:bg-[#2A2D3A] border border-[#2A2D3A] rounded-lg disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <span className="text-slate-300 font-bold px-2">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 bg-[#1A1D27] hover:bg-[#2A2D3A] border border-[#2A2D3A] rounded-lg disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
