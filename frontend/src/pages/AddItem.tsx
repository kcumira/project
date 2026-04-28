import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { foodCategories } from '../data/foodCategories';
import { getCurrentUser } from '../lib/auth';

interface ScanResultState {
  scanResult?: {
    name?: string;
    category?: string;
    quantityEstimate?: number;
    unit?: string;
    expiryDaysEstimate?: number | null;
    storageSuggestion?: string;
    tags?: string[];
    notes?: string;
  };
}

const tags = ['Fresh', 'Frozen', 'Opened', 'Organic', 'Cooked', 'Leftover'];
const units = ['pcs', 'g', 'kg', 'ml', 'L', 'pack'];
const storageOptions = ['Fridge', 'Freezer', 'Pantry', 'Counter'];
const expiryPresets = [
  { label: '2d', days: 2 },
  { label: '5d', days: 5 },
  { label: '1w', days: 7 },
  { label: '2w', days: 14 },
];

function inputDateFromOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function calcDaysLeft(expiryDate: string) {
  if (!expiryDate) return null;
  const today = new Date(new Date().toISOString().split('T')[0]).getTime();
  const expiry = new Date(`${expiryDate}T00:00:00`).getTime();
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function formatFreshness(daysLeft: number | null) {
  if (daysLeft === null) return 'Pick a date';
  if (daysLeft < 0) return 'Expired';
  if (daysLeft === 0) return 'Expires today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}

export default function AddItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useState(() => getCurrentUser());
  const scanResult = (location.state as ScanResultState | null)?.scanResult;

  const today = new Date().toISOString().split('T')[0];
  const scannedCategory = foodCategories.find((item) => item.value === scanResult?.category)?.id;
  const scannedUnit = scanResult?.unit || 'pcs';
  const scannedUnitIsPreset = units.includes(scannedUnit);
  const [foodName, setFoodName] = useState(scanResult?.name || '');
  const [quantity, setQuantity] = useState(scanResult?.quantityEstimate || 1);
  const [unit, setUnit] = useState(scannedUnitIsPreset ? scannedUnit : 'pcs');
  const [customUnit, setCustomUnit] = useState(scannedUnitIsPreset ? '' : scannedUnit);
  const [selectedCategory, setSelectedCategory] = useState(scannedCategory || 'veggies');
  const [selectedTags, setSelectedTags] = useState(scanResult?.tags?.length ? scanResult.tags : ['Fresh']);
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [expiryDate, setExpiryDate] = useState(
    typeof scanResult?.expiryDaysEstimate === 'number'
      ? inputDateFromOffset(scanResult.expiryDaysEstimate)
      : inputDateFromOffset(7)
  );
  const [storageLocation, setStorageLocation] = useState(scanResult?.storageSuggestion || 'Fridge');
  const [note, setNote] = useState(scanResult?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const category = foodCategories.find((item) => item.id === selectedCategory) ?? foodCategories[0];
  const activeUnit = customUnit.trim() || unit;
  const daysLeft = calcDaysLeft(expiryDate);
  const freshnessText = formatFreshness(daysLeft);
  const freshnessTone =
    daysLeft !== null && daysLeft <= 1
      ? 'text-red-600 bg-red-50 border-red-100'
      : daysLeft !== null && daysLeft <= 3
      ? 'text-orange-600 bg-orange-50 border-orange-100'
      : 'text-emerald-600 bg-emerald-50 border-emerald-100';

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((item) => item !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!foodName.trim()) {
      setError('Please enter a food name');
      return;
    }

    if (!expiryDate) {
      setError('Please select an expiration date');
      return;
    }

    setLoading(true);

    try {
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      const noteParts = [
        selectedTags.length ? `Tags: ${selectedTags.join(', ')}` : '',
        storageLocation ? `Storage: ${storageLocation}` : '',
        note.trim() ? `Note: ${note.trim()}` : '',
      ].filter(Boolean);

      const payload = {
        userId: user.userId,
        name: foodName.trim(),
        category: category.value,
        quantity,
        unit: activeUnit,
        expiryDate,
        purchaseDate: purchaseDate || null,
        imageUrl: null,
        barcode: null,
        notes: noteParts.length ? noteParts.join(' | ') : null,
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to add item');
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error('add inventory error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 h-full flex flex-col relative">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-100 pt-safe-top">
        <div className="flex items-center p-4 justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Inventory</p>
            <h2 className="text-lg font-black leading-tight text-slate-900">Add Item</h2>
          </div>
          <button
            onClick={() => navigate('/scanner')}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">photo_camera</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar w-full max-w-md mx-auto px-4 py-4 pb-32 space-y-4">
        <section className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-orange-50 via-white to-emerald-50 p-4">
            <div className="flex items-center gap-4">
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border ${category.tone}`}>
                <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {category.icon}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Preview</p>
                <h3 className="truncate text-xl font-black text-slate-900">
                  {foodName.trim() || 'New food item'}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {quantity} {activeUnit} · {category.value}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <span className={`rounded-full border px-3 py-1.5 text-xs font-black ${freshnessTone}`}>
                {freshnessText}
              </span>
              <span className="rounded-full border border-slate-100 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
                {storageLocation}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
          <label className="mb-2 block text-sm font-black text-slate-900">Food Name</label>
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">restaurant</span>
            <input
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g., Avocados"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-base font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
          <h3 className="mb-3 text-sm font-black text-slate-900">Category</h3>
          <div className="grid grid-cols-3 gap-2">
            {foodCategories.map((item) => {
              const selected = selectedCategory === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedCategory(item.id)}
                  className={`flex h-20 flex-col items-center justify-center gap-1 rounded-2xl border text-xs font-black transition-all active:scale-[0.98] ${
                    selected
                      ? `${item.tone} ring-2 ring-primary/15`
                      : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-orange-100 hover:bg-orange-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[25px]">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Quantity</h3>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black text-primary">
              {quantity} {activeUnit}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-2">
            <button
              onClick={() => setQuantity(Math.max(0.25, Number((quantity - 1).toFixed(2))))}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0.25, Number(e.target.value) || 0.25))}
              className="mx-3 h-12 min-w-0 flex-1 bg-transparent text-center text-3xl font-black text-slate-900 outline-none"
            />
            <button
              onClick={() => setQuantity(Number((quantity + 1).toFixed(2)))}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-orange-200 active:scale-95"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
            {units.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setUnit(item);
                  setCustomUnit('');
                }}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black transition-colors ${
                  !customUnit.trim() && unit === item
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:text-primary'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
            <span className="material-symbols-outlined text-[18px] text-slate-400">edit</span>
            <input
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              maxLength={12}
              placeholder="Custom unit, e.g. bunch"
              className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
            />
            {customUnit.trim() && (
              <button
                onClick={() => setCustomUnit('')}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-400"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
          <h3 className="mb-3 text-sm font-black text-slate-900">Dates</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative rounded-2xl border border-slate-100 bg-slate-50 p-3 transition-colors hover:border-primary/40 hover:bg-orange-50/40">
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    <span className="material-symbols-outlined text-[15px] text-primary">calendar_today</span>
                    Purchased
                  </div>
                  <p className="mt-1 text-sm font-black text-slate-900">{formatDisplayDate(purchaseDate)}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-slate-400">Tap to choose</p>
                </div>
                <span className="material-symbols-outlined mt-4 text-[18px] text-slate-300">expand_more</span>
              </div>
            </label>
            <label className="relative rounded-2xl border border-slate-100 bg-slate-50 p-3 transition-colors hover:border-primary/40 hover:bg-orange-50/40">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    <span className="material-symbols-outlined text-[15px] text-primary">event_busy</span>
                    Expires
                  </div>
                  <p className="mt-1 text-sm font-black text-slate-900">{formatDisplayDate(expiryDate)}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-slate-400">Tap to choose</p>
                </div>
                <span className="material-symbols-outlined mt-4 text-[18px] text-slate-300">expand_more</span>
              </div>
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            {expiryPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setExpiryDate(inputDateFromOffset(preset.days))}
                className="flex-1 rounded-xl border border-slate-100 bg-slate-50 py-2 text-xs font-black text-slate-500 transition-colors hover:border-primary hover:text-primary"
              >
                +{preset.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
          <h3 className="mb-3 text-sm font-black text-slate-900">Storage</h3>
          <div className="grid grid-cols-4 gap-2">
            {storageOptions.map((item) => (
              <button
                key={item}
                onClick={() => setStorageLocation(item)}
                className={`rounded-xl border px-2 py-2 text-[11px] font-black transition-colors ${
                  storageLocation === item
                    ? 'border-primary bg-orange-50 text-primary'
                    : 'border-slate-100 bg-slate-50 text-slate-500'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
          <h3 className="mb-3 text-sm font-black text-slate-900">Quick Tags</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-2 text-xs font-black transition-colors ${
                  selectedTags.includes(tag)
                    ? 'border-primary bg-orange-50 text-primary'
                    : 'border-slate-100 bg-slate-50 text-slate-500 hover:text-primary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
          <label className="mb-2 block text-sm font-black text-slate-900">Notes</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={160}
            placeholder="Brand, recipe idea, pickup plan..."
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
          />
          <p className="mt-1 text-right text-[10px] font-bold text-slate-400">{note.length}/160</p>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}
      </main>

      <div className="absolute bottom-0 left-0 right-0 z-20 w-full border-t border-slate-200/70 bg-white/90 p-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md gap-2">
          <button
            onClick={() => navigate('/scanner')}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-500"
          >
            <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-primary/25 transition-all active:scale-[0.99] disabled:opacity-60"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'progress_activity' : 'add_circle'}
            </span>
            {loading ? 'Adding...' : 'Add to Inventory'}
          </button>
        </div>
      </div>
    </div>
  );
}
