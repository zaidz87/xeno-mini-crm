/**
 * Customers Page
 * Renders the customer database list, pagination, and tools to search, seed,
 * and import CSV templates (Customers and Orders).
 */
import React, { useEffect, useState, useCallback } from 'react';
import { 
  Users, Search, Upload, Download, Database, ChevronLeft, ChevronRight, 
  Loader2, AlertCircle, ShoppingBag 
} from 'lucide-react';

import { customerApi, orderApi } from '../services/api';
import CSVUpload from '../components/CSVUpload';
import { useToast } from '../components/ToastContext';

export default function Customers() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [activeUploadModal, setActiveUploadModal] = useState(null); // 'customers' | 'orders' | null
  const [seeding, setSeeding] = useState(false);

  // Load customer lists from API
  const loadCustomers = useCallback(async (searchQuery = '', pageNum = 1) => {
    try {
      setLoading(true);
      const data = await customerApi.getCustomers(searchQuery, pageNum, 20);
      if (data.success) {
        setCustomers(data.customers);
        setPage(data.pagination.page);
        setTotalPages(data.pagination.pages);
        setTotalRecords(data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast.error('Failed to retrieve customer records.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load data on mount and pagination/search changes
  useEffect(() => {
    // Simple debounce for search
    const timer = setTimeout(() => {
      loadCustomers(search, page);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, page, loadCustomers]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // reset page to 1 when search query changes
  };

  // Trigger database seeding
  const handleSeedData = async () => {
    try {
      setSeeding(true);
      toast.info('Seeding database with demo profiles...');
      const data = await customerApi.seedCustomers();
      if (data.success) {
        toast.success(`Seeding complete. Seeded ${data.data.customersCount} customers.`);
        setPage(1);
        loadCustomers(search, 1);
      }
    } catch (error) {
      console.error('Seeding failed:', error);
      toast.error('Seeding process failed.');
    } finally {
      setSeeding(false);
    }
  };

  // Generate and download mock CSV templates locally
  const downloadCSVTemplate = (type) => {
    let headers = '';
    let filename = '';
    
    if (type === 'customers') {
      headers = 'name,email,phone,totalSpend,orderCount,lastOrderDate\nPriya Sharma,priya@example.com,9876543210,5200,8,2024-03-15\nRahul Verma,rahul@example.com,9876543211,1200,2,2024-01-20\n';
      filename = 'xeno_customers_template.csv';
    } else {
      headers = 'customerEmail,amount,date,items\npriya@example.com,1500,2024-03-15,Kurta Set\npriya@example.com,3700,2024-02-10,Saree\n';
      filename = 'xeno_orders_template.csv';
    }

    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${filename} successfully.`);
  };

  const handleUploadSuccess = () => {
    setActiveUploadModal(null);
    setPage(1);
    loadCustomers(search, 1);
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-7xl mx-auto w-full">
      {/* Header controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-[#2A2D3A] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-[#6366F1]" />
            Customer Database
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Search, edit, seed, or import customer profiles and recent transaction history.
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Seeding */}
          <button
            onClick={handleSeedData}
            disabled={seeding || loading}
            className="flex items-center gap-2 bg-[#2A2D3A] hover:bg-[#2A2D3A]/80 disabled:opacity-50 disabled:cursor-not-allowed border border-[#2A2D3A] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" /> : <Database className="w-4 h-4 text-slate-400" />}
            Seed Demo Data
          </button>

          {/* Template Downloads */}
          <div className="relative group">
            <button className="flex items-center gap-2 bg-[#2A2D3A] hover:bg-[#2A2D3A]/80 border border-[#2A2D3A] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200">
              <Download className="w-4 h-4 text-slate-400" />
              Download Templates
            </button>
            <div className="absolute left-0 mt-2 w-48 bg-[#1A1D27] border border-[#2A2D3A] rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-10">
              <button 
                onClick={() => downloadCSVTemplate('customers')} 
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-[#2A2D3A] hover:text-white transition-colors"
              >
                Customers CSV Template
              </button>
              <button 
                onClick={() => downloadCSVTemplate('orders')} 
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-[#2A2D3A] hover:text-white transition-colors border-t border-[#2A2D3A]"
              >
                Orders CSV Template
              </button>
            </div>
          </div>

          {/* Import CSVs */}
          <button
            onClick={() => setActiveUploadModal('customers')}
            className="flex items-center gap-2 bg-[#6366F1]/10 hover:bg-[#6366F1]/20 border border-[#6366F1]/20 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#6366F1] transition-all duration-200"
          >
            <Upload className="w-4 h-4" />
            Import Customers
          </button>

          <button
            onClick={() => setActiveUploadModal('orders')}
            className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-400 transition-all duration-200"
          >
            <ShoppingBag className="w-4 h-4" />
            Import Orders
          </button>
        </div>
      </div>

      {/* Search Filter input */}
      <div className="flex bg-[#1A1D27] border border-[#2A2D3A] rounded-xl px-4 py-3 items-center gap-3 max-w-md">
        <Search className="w-5 h-5 text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, email, or phone number..."
          value={search}
          onChange={handleSearchChange}
          className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-500 w-full"
        />
      </div>

      {/* Main Database Table Container */}
      <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          // Loading Skeletons
          <div className="p-6 space-y-4">
            <div className="h-10 bg-[#2A2D3A]/40 rounded-xl animate-pulse-glow" />
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="h-14 bg-[#2A2D3A]/20 rounded-xl animate-pulse-glow" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center p-16 text-slate-500">
            <Users className="w-16 h-16 text-[#2A2D3A] mb-4" />
            <h3 className="text-lg font-bold text-slate-300">No Customers Found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">
              {search 
                ? "We couldn't find anyone matching your search query. Try typing something else." 
                : "Your customer database is empty. You can seed mock profiles or import a customer list CSV."}
            </p>
            {!search && (
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSeedData}
                  className="bg-[#2A2D3A] hover:bg-[#2A2D3A]/80 border border-[#2A2D3A] px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-300"
                >
                  Seed Demo Data
                </button>
                <button
                  onClick={() => setActiveUploadModal('customers')}
                  className="bg-[#6366F1] hover:bg-[#818CF8] px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-[#6366F1]/10"
                >
                  Import Customers CSV
                </button>
              </div>
            )}
          </div>
        ) : (
          // Customer Table
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2A2D3A] bg-[#2A2D3A]/20 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Customer Details</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6 text-right">Total Spend</th>
                  <th className="py-4 px-6 text-center">Orders</th>
                  <th className="py-4 px-6 text-right">Last Purchase Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2D3A]/50 text-sm text-slate-300">
                {customers.map((cust, idx) => (
                  <tr key={cust._id} className={idx % 2 === 0 ? 'bg-transparent' : 'bg-[#2A2D3A]/10'}>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-200">{cust.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{cust.email}</p>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400">{cust.phone}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-[#6366F1]">
                      ₹{(cust.totalSpend || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6 text-center font-bold">{cust.orderCount || 0}</td>
                    <td className="py-4 px-6 text-right font-medium text-slate-400">
                      {cust.lastOrderDate 
                        ? new Date(cust.lastOrderDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'No orders recorded'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && totalRecords > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs font-semibold text-slate-500">
            Showing <span className="text-slate-300">{customers.length}</span> of <span className="text-slate-300">{totalRecords}</span> customers
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-[#1A1D27] hover:bg-[#2A2D3A] border border-[#2A2D3A] rounded-lg disabled:opacity-30 disabled:hover:bg-[#1A1D27] transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <span className="text-xs font-bold text-slate-300 px-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-[#1A1D27] hover:bg-[#2A2D3A] border border-[#2A2D3A] rounded-lg disabled:opacity-30 disabled:hover:bg-[#1A1D27] transition-all"
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* Active CSV Import Modal overlays */}
      {activeUploadModal === 'customers' && (
        <CSVUpload
          title="Import Customer Database CSV"
          uploadApiFn={customerApi.importCustomers}
          onClose={() => setActiveUploadModal(null)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {activeUploadModal === 'orders' && (
        <CSVUpload
          title="Import Order Transactions CSV"
          uploadApiFn={orderApi.importOrders}
          onClose={() => setActiveUploadModal(null)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
