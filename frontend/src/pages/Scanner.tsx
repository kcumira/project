import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ScanResult {
  name: string;
  category: string;
  quantityEstimate: number;
  unit: string;
  expiryDaysEstimate: number | null;
  storageSuggestion: string;
  tags: string[];
  confidence: number;
  notes: string;
}

export default function Scanner() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (file?: File) => {
    if (!file) return;
    setSelectedFile(file);
    setScanResult(null);
    setError('');
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!selectedFile || loading) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/scan/food', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || 'Unable to scan image.');
      }

      setScanResult(data);
    } catch (err: any) {
      setError(err.message || 'Unable to scan image.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!scanResult) return;
    navigate('/add-item', {
      state: {
        scanResult,
      },
    });
  };

  return (
    <div className="w-full h-full bg-black text-slate-100 relative flex flex-col overflow-hidden">
      <header className="absolute top-0 left-0 right-0 z-30 pt-12 pb-4 px-5 flex justify-between items-start bg-gradient-to-b from-black/70 to-transparent">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="flex flex-col items-center">
          <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase text-white/90 mb-1 border border-white/10">
            AI Food Scanner
          </span>
          <p className="text-white/70 text-[10px] font-medium drop-shadow-md">Scan first, confirm before saving</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
        >
          <span className="material-symbols-outlined">image</span>
        </button>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => handleFileChange(event.target.files?.[0])}
      />

      <main className="relative flex-1 bg-gray-950 overflow-hidden">
        {previewUrl ? (
          <img src={previewUrl} alt="Selected food" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#334155,_#020617_70%)]" />
        )}

        <div className="absolute inset-0 z-10 flex items-center justify-center p-8 pointer-events-none">
          <div className="relative w-full aspect-square max-w-[320px]">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
            {loading && (
              <div className="absolute top-0 left-0 w-full h-1 bg-primary/70 shadow-[0_0_15px_rgba(255,107,0,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
            )}

            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/95 text-slate-900 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
              <span className={`material-symbols-outlined text-[18px] text-primary ${loading ? 'animate-spin' : ''}`}>
                {loading ? 'progress_activity' : scanResult ? 'check_circle' : 'center_focus_strong'}
              </span>
              <span className="text-xs font-bold">
                {loading ? 'Analyzing...' : scanResult ? `${scanResult.confidence}% confidence` : 'Choose or capture food'}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none bg-black/25"></div>
      </main>

      <section className="bg-black pt-5 pb-8 px-5 z-20 relative rounded-t-3xl -mt-6">
        {scanResult ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white text-slate-900 p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-primary">AI Suggestion</p>
                <h2 className="mt-1 truncate text-xl font-black">{scanResult.name || 'Food item'}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {scanResult.quantityEstimate || 1} {scanResult.unit || 'pcs'} · {scanResult.category || 'Food'}
                </p>
              </div>
              <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-primary">
                {scanResult.confidence}%
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Storage</p>
                <p className="text-sm font-black">{scanResult.storageSuggestion}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Expiry</p>
                <p className="text-sm font-black">
                  {scanResult.expiryDaysEstimate === null ? 'Confirm manually' : `~${scanResult.expiryDaysEstimate} days`}
                </p>
              </div>
            </div>
            {scanResult.notes && (
              <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-500">{scanResult.notes}</p>
            )}
          </div>
        ) : (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <span className="material-symbols-outlined text-primary text-[34px]">photo_camera</span>
            <p className="mt-2 text-sm font-bold text-white">Take or upload a food photo</p>
            <p className="mt-1 text-xs font-medium text-slate-400">AI will only suggest fields. You confirm before saving.</p>
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-slate-100 active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
          </button>
          <button
            onClick={scanResult ? handleConfirm : handleAnalyze}
            disabled={loading || !selectedFile}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-primary/30 active:scale-[0.98] disabled:bg-slate-700 disabled:text-slate-400"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'progress_activity' : scanResult ? 'edit_note' : 'auto_awesome'}
            </span>
            {loading ? 'Scanning...' : scanResult ? 'Review in Add Item' : 'Analyze Photo'}
          </button>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
