import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { getFoodCategoryMeta } from '../data/foodCategories';
import { getCurrentUser } from '../lib/auth';

const sortOptions = [
  { id: 'urgency', label: 'Urgency', icon: 'priority_high' },
  { id: 'name', label: 'Name', icon: 'sort_by_alpha' },
  { id: 'category', label: 'Category', icon: 'category' },
  { id: 'quantity', label: 'Quantity', icon: 'pin' },
];

interface InventoryItem {
  inventoryId: number;
  name?: string;
  category?: string | null;
  quantity?: number | null;
  unit?: string | null;
  daysLeft?: number | null;
  status?: string | null;
}

function urgencyRank(item: InventoryItem) {
  if (typeof item.daysLeft === 'number') return item.daysLeft;
  if (item.status === 'expiring') return 0;
  if (item.status === 'useSoon') return 2;
  return 99;
}

export default function Dashboard() {
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('urgency');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState({
    expiring: 0,
    useSoon: 0,
    fresh: 0,
  });
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    fetch(`/api/inventory/${user.userId}`)
      .then(res => res.json())
      .then(data => {
        console.log("inventory:", data);
        setItems(data);
      })
      .catch(err => console.error("fetch inventory error:", err));

    fetch(`/api/home/${user.userId}/summary`)
      .then(res => res.json())
      .then(data => {
        console.log("summary:", data);
        setSummary(data.inventoryStatus);
      })
      .catch(err => console.error("fetch summary error:", err));
  }, [navigate, user]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }

      if (sortBy === 'category') {
        const categoryCompare = (a.category || '').localeCompare(b.category || '');
        return categoryCompare || urgencyRank(a) - urgencyRank(b);
      }

      if (sortBy === 'quantity') {
        return (Number(b.quantity) || 0) - (Number(a.quantity) || 0);
      }

      return urgencyRank(a) - urgencyRank(b);
    });
  }, [items, sortBy]);

  const activeSortLabel = sortOptions.find((option) => option.id === sortBy)?.label || 'Urgency';

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <header className="shrink-0 z-20 flex items-center justify-between px-5 pt-12 pb-4 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 ring-2 ring-primary ring-offset-2 ring-offset-white"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDdFw5STj1KGiE_zdsfEVKiW8rhzPDehw-KCVY7vqQUjmSU4I4GgFycRJaH4tm60dD8qgiEEBAS2qbkgLBVvqDZyaYCKs1PbHDAJIUTfAXpgOSW30okjeAd-a3q0NmM2XkjNgYL4mKsS_W82_WShLuGMqjuPNafbs--RIZuPmD0T0psb6L5jfvHOTP01oa0OtWg42UQZDUGbgEEbq8Q8LC2KrWM8-XVTZoKjwEjGQ13QZkDNjcwL4NzW5_rxvyg_tCGvEUnNx8sPJUq')"
              }}
            ></div>
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-primary rounded-full border-2 border-white"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-500">Good Morning,</span>
            <h2 className="text-base font-bold leading-tight tracking-tight text-slate-900">
              {user?.userName || 'SmartFood User'}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
          <span className="material-symbols-outlined text-emerald-600 text-[18px]">eco</span>
          <span className="text-[11px] font-bold text-emerald-800">12.5kg CO2</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 pb-32">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-900">Inventory Status</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 no-scrollbar snap-x">
              <div className="snap-start flex min-w-[140px] flex-col justify-between gap-3 rounded-xl p-4 bg-white border border-red-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <span className="material-symbols-outlined text-red-500 text-[48px]">warning</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-[11px] font-medium text-red-500 uppercase tracking-wider">Expiring</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{summary.expiring}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Needs action</p>
                </div>
              </div>
              <div className="snap-start flex min-w-[140px] flex-col justify-between gap-3 rounded-xl p-4 bg-white border border-orange-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <span className="material-symbols-outlined text-orange-400 text-[48px]">schedule</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-400"></div>
                  <span className="text-[11px] font-medium text-orange-400 uppercase tracking-wider">Use Soon</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{summary.useSoon}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Next 3 days</p>
                </div>
              </div>
              <div className="snap-start flex min-w-[140px] flex-col justify-between gap-3 rounded-xl p-4 bg-white border border-primary/20 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <span className="material-symbols-outlined text-primary text-[48px]">check_circle</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                  <span className="text-[11px] font-medium text-primary uppercase tracking-wider">Fresh</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{summary.fresh}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Good condition</p>
                </div>
              </div>
            </div>
          </section>

          <div className="rounded-xl bg-gradient-to-r from-primary/15 to-orange-200/15 p-3.5 flex items-center justify-between border border-primary/20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-orange-600 shrink-0">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">AI Suggestion</p>
                <p className="text-[10px] text-slate-600 truncate">Make a smoothie with spinach?</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/recipes')}
              className="shrink-0 px-2.5 py-1.5 bg-white text-[10px] font-bold rounded-lg shadow-sm text-orange-600 border border-primary/10"
            >
              View Recipe
            </button>
          </div>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">My Items</h3>
              <div className="relative">
                <button
                  onClick={() => setIsSortOpen((value) => !value)}
                  className="text-primary text-[11px] font-bold flex items-center gap-0.5 rounded-full bg-orange-50 px-2.5 py-1.5 border border-orange-100"
                >
                  Sort by {activeSortLabel}
                  <span className="material-symbols-outlined text-[14px]">sort</span>
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 top-9 z-30 w-40 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg">
                    {sortOptions.map((option) => {
                      const selected = sortBy === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSortBy(option.id);
                            setIsSortOpen(false);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold transition-colors ${
                            selected ? 'bg-orange-50 text-primary' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{option.icon}</span>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {sortedItems.map((item) => {
                const categoryMeta = getFoodCategoryMeta(item.category);
                const borderClass =
                  item.status === 'expiring'
                    ? 'border-red-500'
                    : item.status === 'useSoon'
                    ? 'border-orange-400'
                    : 'border-primary';

                const badgeClass =
                  item.status === 'expiring'
                    ? 'bg-red-100 text-red-600'
                    : item.status === 'useSoon'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-primary/10 text-orange-600';

                const badgeText =
                  item.daysLeft < 0
                    ? 'Expired'
                    : item.status === 'fresh'
                    ? 'Fresh'
                    : `${item.daysLeft} ${item.daysLeft === 1 ? 'Day' : 'Days'} Left`;

                return (
                  <div
                    key={item.inventoryId}
                    className={`flex items-center gap-3 p-2.5 bg-white rounded-xl border-l-[4px] ${borderClass} shadow-sm`}
                  >
                    <div className={`h-12 w-12 shrink-0 rounded-xl border flex items-center justify-center ${categoryMeta.tone}`}>
                      <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {categoryMeta.icon}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">
                        {item.category || 'Food'} • {item.quantity}
                        {item.unit ? item.unit : ''}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${badgeClass}`}
                      >
                        {badgeText}
                      </div>
                      <button
                        onClick={() => navigate('/share')}
                        className="text-slate-400 p-0.5 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">share</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <div className="absolute bottom-24 right-5 z-50 flex flex-col items-center">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className={`absolute transition-all duration-300 ${isFabOpen ? '-top-12 -left-4 opacity-100' : 'top-0 left-0 opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => navigate('/scanner')}
              className="h-10 w-10 bg-white text-orange-600 border border-slate-100 rounded-full shadow-lg flex items-center justify-center ring-2 ring-primary/10 hover:scale-110 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            </button>
            <span className="absolute -top-6 -left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-800 shadow-sm border border-slate-100 whitespace-nowrap">
              Scan
            </span>
          </div>
          <div className={`absolute transition-all duration-300 ${isFabOpen ? 'top-0 -left-14 opacity-100' : 'top-0 left-0 opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => navigate('/add-item')}
              className="h-10 w-10 bg-white text-orange-600 border border-slate-100 rounded-full shadow-lg flex items-center justify-center ring-2 ring-primary/10 hover:scale-110 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <span className="absolute -top-6 -left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-800 shadow-sm border border-slate-100 whitespace-nowrap">
              Manual
            </span>
          </div>
          <button
            onClick={() => setIsFabOpen(!isFabOpen)}
            className="relative z-10 h-14 w-14 bg-gradient-to-br from-primary to-orange-600 text-white rounded-full shadow-[0_8px_30px_rgba(255,112,67,0.4)] flex items-center justify-center transition-transform duration-300"
          >
            <span className={`material-symbols-outlined text-[32px] transition-transform duration-300 ${isFabOpen ? 'rotate-45' : ''}`}>
              add
            </span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
