import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFoodCategoryMeta } from '../data/foodCategories';
import { getCurrentUser } from '../lib/auth';

const DEFAULT_LAT = 24.98;
const DEFAULT_LNG = 121.57;

interface InventoryItem {
  inventoryId: number;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  imageUrl: string | null;
  expiryDate: string;
  daysLeft?: number;
}

function toDateTimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getDefaultCustomTime() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(18, 0, 0, 0);
  return toDateTimeLocalValue(date);
}

function formatQuantity(value: number | null | undefined) {
  if (value == null) return '1';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function ShareSurplus() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [locationName, setLocationName] = useState('NCCU Community Pickup Point');
  const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [availableUntil, setAvailableUntil] = useState('Today 6PM');
  const [customUntil, setCustomUntil] = useState(getDefaultCustomTime);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    fetch(`/api/sharing/inventory/${user.userId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Inventory API failed: ${response.status}`);
        return response.json();
      })
      .then((data: InventoryItem[]) => {
        const shareableItems = data.filter(
          (item) => (item.quantity ?? 0) > 0 && (item.daysLeft == null || item.daysLeft >= 0),
        );
        setInventory(shareableItems);
        setSelectedItemId(shareableItems[0]?.inventoryId ?? null);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to fetch shareable inventory:', err);
        setError('無法載入庫存，請稍後再試。');
      })
      .finally(() => setLoading(false));
  }, [navigate, user]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedItemId]);

  const selectedItem = inventory.find((item) => item.inventoryId === selectedItemId);
  const maxQty = selectedItem?.quantity ?? 1;
  const selectedMeta = getFoodCategoryMeta(selectedItem?.category);

  const expiryDate = useMemo(() => {
    const date = new Date();

    if (availableUntil === 'Tomorrow') {
      date.setDate(date.getDate() + 1);
      date.setHours(23, 59, 59, 0);
      return date;
    }

    if (availableUntil === 'Item expiry' && selectedItem?.expiryDate) {
      return new Date(selectedItem.expiryDate);
    }

    if (availableUntil === 'Custom') {
      return new Date(customUntil);
    }

    date.setHours(18, 0, 0, 0);
    return date;
  }, [availableUntil, customUntil, selectedItem?.expiryDate]);

  const canSubmit =
    Boolean(selectedItemId) &&
    quantity > 0 &&
    quantity <= maxQty &&
    locationName.trim().length > 0 &&
    !isSubmitting;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('這個瀏覽器不支援定位，已使用預設取貨點。');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationName('Current location pickup point');
        setError(null);
      },
      () => setError('定位失敗，請手動輸入取貨地點。'),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    );
  };

  const handleSubmit = async () => {
    if (!user || !selectedItem || !canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/sharing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          inventoryId: selectedItem.inventoryId,
          quantity,
          instructions: instructions.trim(),
          locationName: locationName.trim(),
          lat: coords.lat,
          lng: coords.lng,
          availableUntil: expiryDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to share surplus');
      }

      navigate('/map');
    } catch (err) {
      console.error('Failed to share surplus:', err);
      setError(err instanceof Error ? err.message : '分享失敗，請稍後再試。');
      setIsSubmitting(false);
    }
  };

  const renderAvailableBtn = (label: string) => {
    const isSelected = availableUntil === label;
    return (
      <button
        key={label}
        onClick={() => setAvailableUntil(label)}
        className={`rounded-xl px-2 py-2.5 text-center text-xs shadow-sm transition-all ${
          isSelected
            ? 'border-2 border-primary bg-primary/5 font-bold text-primary'
            : 'border border-slate-200 bg-white font-medium text-slate-600 hover:border-slate-300'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="relative flex h-full flex-col bg-white">
      <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 pb-3 pt-12">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-slate-100"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900">Share Surplus</h1>
        <button
          onClick={() => navigate('/map')}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-slate-100"
          aria-label="Food map"
        >
          <span className="material-symbols-outlined">map</span>
        </button>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto pb-32">
        {error && (
          <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <section className="py-4">
          <div className="mb-3 flex items-center justify-between px-5">
            <h2 className="text-base font-bold text-slate-900">Select from Inventory</h2>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {inventory.length} shareable
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : inventory.length === 0 ? (
            <div className="mx-5 rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-500">
              目前沒有可分享的庫存。新增未過期食材後，數量大於 0 的項目會出現在這裡。
            </div>
          ) : (
            <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-2">
              {inventory.map((item) => {
                const isSelected = selectedItemId === item.inventoryId;
                const meta = getFoodCategoryMeta(item.category);

                return (
                  <button
                    key={item.inventoryId}
                    onClick={() => setSelectedItemId(item.inventoryId)}
                    className={`group flex w-28 shrink-0 snap-start flex-col gap-2 text-left transition-opacity ${
                      isSelected ? '' : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`relative aspect-square overflow-hidden rounded-2xl border-[3px] ${
                        isSelected ? 'border-primary shadow-lg shadow-primary/10' : 'border-transparent'
                      }`}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center ${meta.tone}`}>
                          <span className="material-symbols-outlined text-4xl">{meta.icon}</span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {formatQuantity(item.quantity)} {item.unit || 'units'}
                      </div>
                    </div>
                    <p
                      className={`truncate px-1 text-center text-sm font-semibold ${
                        isSelected ? 'text-primary' : 'text-slate-600 group-hover:text-slate-900'
                      }`}
                    >
                      {item.name}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="my-2 h-px w-full bg-slate-100" />

        <section className="space-y-6 px-5 py-4">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-200 shadow-inner">
              {selectedItem?.imageUrl ? (
                <img src={selectedItem.imageUrl} alt={selectedItem.name} className="h-full w-full object-cover" />
              ) : (
                <div className={`flex h-full w-full items-center justify-center ${selectedMeta.tone}`}>
                  <span className="material-symbols-outlined text-3xl">{selectedMeta.icon}</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quantity to Share
              </label>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100 disabled:opacity-50"
                    aria-label="Decrease quantity"
                  >
                    <span className="material-symbols-outlined text-lg">remove</span>
                  </button>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    max={maxQty}
                    value={quantity}
                    onChange={(event) => setQuantity(Number(event.target.value))}
                    className="h-9 w-16 rounded-lg border border-slate-200 bg-white text-center text-base font-bold text-slate-900 focus:border-primary focus:ring-primary"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                    disabled={quantity >= maxQty}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/30 transition-colors hover:bg-orange-600 disabled:opacity-50"
                    aria-label="Increase quantity"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                  </button>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className="text-sm font-medium text-slate-600">{selectedItem?.unit || 'units'}</span>
                  <span className="text-[10px] text-slate-400">Max: {formatQuantity(maxQty)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900" htmlFor="instructions">
              <span className="material-symbols-outlined text-lg text-primary">edit_note</span>
              Pickup Instructions
            </label>
            <div className="relative">
              <textarea
                id="instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Door code, shelf, exact meeting spot..."
                rows={3}
                maxLength={160}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm transition-shadow placeholder-slate-400 focus:border-transparent focus:ring-2 focus:ring-primary"
              />
              <div className="absolute bottom-2 right-2 rounded bg-white/70 px-1 text-[10px] text-slate-400">
                {instructions.length}/160
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-900" htmlFor="locationName">
                <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                Pickup Location
              </label>
              <button
                onClick={handleUseCurrentLocation}
                className="text-xs font-bold text-primary hover:text-orange-600"
              >
                Use current
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
              <input
                id="locationName"
                value={locationName}
                onChange={(event) => setLocationName(event.target.value)}
                className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-primary focus:ring-primary"
                placeholder="Pickup point name"
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Lat
                  <input
                    type="number"
                    value={coords.lat}
                    onChange={(event) => setCoords((current) => ({ ...current, lat: Number(event.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-slate-900 focus:border-primary focus:ring-primary"
                  />
                </label>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Lng
                  <input
                    type="number"
                    value={coords.lng}
                    onChange={(event) => setCoords((current) => ({ ...current, lng: Number(event.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-slate-900 focus:border-primary focus:ring-primary"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2 pb-6">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className="material-symbols-outlined text-lg text-primary">schedule</span>
              Available Until
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Today 6PM', 'Tomorrow', 'Item expiry', 'Custom'].map(renderAvailableBtn)}
            </div>
            {availableUntil === 'Custom' && (
              <input
                type="datetime-local"
                value={customUntil}
                onChange={(event) => setCustomUntil(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 focus:border-primary focus:ring-primary"
              />
            )}
          </div>
        </section>
      </main>

      <div className="absolute inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white p-5 pb-8 shadow-[0_-8px_20px_-5px_rgba(0,0,0,0.1)]">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-orange-600 active:scale-[0.98] disabled:bg-slate-300 disabled:text-slate-500"
        >
          {isSubmitting ? (
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined">send</span>
          )}
          {isSubmitting ? 'Posting...' : 'Post to Community Map'}
        </button>
      </div>
    </div>
  );
}
