/**
 * CSVUpload Modal Component
 * Renders a drop-zone / file-picker modal for uploading CSV templates (Customers/Orders)
 * to the backend database with loading overlays and callbacks.
 */
import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from './ToastContext';

export default function CSVUpload({ title, uploadApiFn, onClose, onSuccess }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setErrorMsg('');
    if (!selectedFile.name.endsWith('.csv')) {
      setErrorMsg('Only CSV files are supported.');
      toast.error('Invalid file type! Please select a .csv file.');
      return;
    }
    setFile(selectedFile);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleUploadSubmit = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setErrorMsg('');
      const data = await uploadApiFn(file);
      
      if (data.success) {
        toast.success(data.message || 'File uploaded and processed successfully.');
        if (onSuccess) onSuccess(data);
      } else {
        setErrorMsg(data.message || 'Failed to process file.');
        toast.error(data.message || 'Failed to import CSV.');
      }
    } catch (err) {
      console.error('CSV upload error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Server error during CSV processing.';
      setErrorMsg(errMsg);
      toast.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2D3A]">
          <h3 className="font-bold text-lg text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            disabled={uploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />

          {/* Drag & Drop Area */}
          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                dragActive 
                  ? 'border-[#6366F1] bg-[#6366F1]/5' 
                  : 'border-[#2A2D3A] hover:border-[#6366F1]/50 hover:bg-[#2A2D3A]/20'
              }`}
            >
              <div className="p-3 bg-[#2A2D3A]/50 rounded-xl mb-4 text-slate-400">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                Drag and drop your file here, or <span className="text-[#6366F1]">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1.5">Supports CSV files up to 5MB</p>
            </div>
          ) : (
            // File Selected View
            <div className="flex items-center gap-3 p-4 bg-[#2A2D3A]/30 border border-[#2A2D3A] rounded-xl">
              <div className="p-2 bg-[#6366F1]/10 rounded-lg text-[#6366F1]">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-semibold text-slate-200 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {!uploading && (
                <button
                  onClick={() => setFile(null)}
                  className="text-slate-400 hover:text-slate-200 p-1 hover:bg-[#2A2D3A] rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-[#2A2D3A] bg-[#2A2D3A]/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
          
          <button
            onClick={handleUploadSubmit}
            disabled={!file || uploading}
            className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#818CF8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Import File'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
