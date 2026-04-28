import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { foodCategories, getFoodCategoryMeta } from '../data/foodCategories';
import { getCurrentUser } from '../lib/auth';

const DEFAULT_LAT = 24.98;
const DEFAULT_LNG = 121.57;

interface ShareItem {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  lat: number;
  lng: number;
  status: string;
  expiryTime: string | null;
  userId: number;
  userName: string | null;
  createdAt: string | null;
  pickupInstructions?: string | null;
  distance: number | null;
  expiresIn: string | null;
}

interface ShareSummary {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  status: string;
  expiryTime: string | null;
  expiresIn?: string | null;
}

interface SharingRequest {
  requestId: number;
  requestStatus: string;
  latestMustReceiveTime: string | null;
  requester: {
    userId: number;
    userName: string | null;
  };
  owner: {
    userId: number;
    userName: string | null;
  };
  share: ShareSummary;
}

const categories = [
  { label: 'All Items', value: 'All Items', icon: 'travel_explore' },
  ...foodCategories.map((category) => ({
    label: category.label,
    value: category.value,
    icon: category.icon,
  })),
];

function getInitials(name: string | null): string {
  if (!name) return 'SF';
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDistance(distance: number | null) {
  if (distance == null) return 'nearby';
  return `${distance.toFixed(distance < 10 ? 1 : 0)} mi`;
}

function ShareImage({ item, compact = false }: { item: ShareItem; compact?: boolean }) {
  const meta = getFoodCategoryMeta(item.category);

  if (item.imageUrl) {
    return <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />;
  }

  return (
    <div className={`flex h-full w-full items-center justify-center border ${meta.tone}`}>
      <span className={`material-symbols-outlined ${compact ? 'text-2xl' : 'text-5xl'}`}>
        {meta.icon}
      </span>
    </div>
  );
}

function ShareSummaryImage({ share }: { share: ShareSummary }) {
  const meta = getFoodCategoryMeta(share.category);

  if (share.imageUrl) {
    return <img src={share.imageUrl} alt={share.title} className="h-full w-full object-cover" />;
  }

  return (
    <div className={`flex h-full w-full items-center justify-center ${meta.tone}`}>
      <span className="material-symbols-outlined text-2xl">{meta.icon}</span>
    </div>
  );
}

export default function FoodMap() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [topPicks, setTopPicks] = useState<ShareItem[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<ShareItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activePickups, setActivePickups] = useState<SharingRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<SharingRequest[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 },
    );
  }, []);

  const fetchShares = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: String(coords.lat),
        lng: String(coords.lng),
      });

      if (activeCategory !== 'All Items') {
        params.append('category', activeCategory);
      }

      const response = await fetch(`/api/shares?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Share API failed: ${response.status}`);
      }

      const data = await response.json();
      setTopPicks(data.topPicks ?? []);
      setExpiringSoon(data.expiringSoon ?? []);
    } catch (err) {
      console.error('Failed to fetch shares:', err);
      setError('無法載入附近分享，請確認後端服務已啟動。');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, coords.lat, coords.lng]);

  const fetchSharingActivity = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/sharing/status/${user.userId}`);

      if (!response.ok) return;

      const data = await response.json();
      const isActive = (request: SharingRequest) =>
        ['requested', 'accepted'].includes(request.requestStatus);

      setActivePickups((data.outgoingRequests ?? []).filter(isActive));
      setIncomingRequests((data.incomingRequests ?? []).filter(isActive));
    } catch (err) {
      console.error('Failed to fetch sharing activity:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    fetchShares();
    fetchSharingActivity();
  }, [fetchShares, fetchSharingActivity, navigate, user]);

  const matchesSearch = useCallback(
    (item: ShareItem) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.trim().toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    },
    [searchQuery],
  );

  const filteredTopPicks = useMemo(() => topPicks.filter(matchesSearch), [matchesSearch, topPicks]);
  const filteredExpiringSoon = useMemo(
    () => expiringSoon.filter(matchesSearch),
    [expiringSoon, matchesSearch],
  );

  const handleRequestPickup = async (event: MouseEvent, shareId: number) => {
    event.stopPropagation();

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    setNotice(null);

    try {
      const response = await fetch(`/api/request-pickup/${shareId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setNotice(data.detail || '目前無法送出領取請求。');
        return;
      }

      await Promise.all([fetchShares(), fetchSharingActivity()]);
      navigate('/sharing-status');
    } catch (err) {
      console.error('Pickup request failed:', err);
      setNotice('送出失敗，請稍後再試。');
    }
  };

  return (
    <div className="relative flex h-full flex-col bg-[#fff8f0] text-[#2e1a0f]">
      <div className="z-20 shrink-0 bg-white px-4 pb-4 pt-12 shadow-sm">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2e1a0f]">Food Map</h1>
              <p className="text-xs font-medium text-[#8c6b5d]">附近可領取的剩食分享</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/sharing-status')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-primary shadow-sm transition-transform active:scale-95"
                aria-label="Sharing status"
              >
                <span className="material-symbols-outlined">fact_check</span>
              </button>
              <button
                onClick={() => navigate('/share')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-transform active:scale-95"
                aria-label="Share surplus"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>

          <div className="flex h-12 w-full items-center rounded-full border border-orange-100 bg-[#fff8f0] px-4">
            <span className="material-symbols-outlined mr-3 text-xl text-[#8c6b5d]">search</span>
            <input
              type="text"
              placeholder="Search apples, bread, dairy..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-full flex-1 border-none bg-transparent p-0 text-base text-[#2e1a0f] placeholder-[#8c6b5d]/70 focus:ring-0"
            />
            <button
              onClick={fetchShares}
              className="material-symbols-outlined rounded-full p-1 text-[#2e1a0f] hover:bg-orange-100"
              aria-label="Refresh shares"
            >
              refresh
            </button>
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setActiveCategory(category.value)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${
                  activeCategory === category.value
                    ? 'bg-primary text-white shadow-md'
                    : 'border border-orange-100 bg-white text-[#2e1a0f] hover:bg-orange-50'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto pb-28">
        {notice && (
          <div className="mx-4 mt-4 rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-[#8c6b5d] shadow-sm">
            {notice}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}

        {error && (
          <div className="mx-4 mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchShares}
              className="mt-2 text-sm font-semibold text-primary hover:text-orange-600"
            >
              重新載入
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {(activePickups.length > 0 || incomingRequests.length > 0) && (
              <section className="pb-2 pt-5">
                <div className="mb-3 flex items-center justify-between px-4">
                  <h2 className="text-lg font-bold text-[#2e1a0f]">Your Activity</h2>
                  <button
                    onClick={() => navigate('/sharing-status')}
                    className="text-sm font-semibold text-primary"
                  >
                    Manage
                  </button>
                </div>

                <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
                  {incomingRequests.slice(0, 3).map((request) => (
                    <button
                      key={`incoming-${request.requestId}`}
                      onClick={() => navigate('/sharing-status')}
                      className="flex w-[260px] shrink-0 items-center gap-3 rounded-2xl border border-yellow-100 bg-white p-3 text-left shadow-sm"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                        <span className="material-symbols-outlined">mark_email_unread</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#2e1a0f]">
                          {request.requester.userName || 'Someone'} wants {request.share.title}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-yellow-700">
                          Waiting for your response
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </button>
                  ))}

                  {activePickups.slice(0, 3).map((request) => (
                    <button
                      key={`outgoing-${request.requestId}`}
                      onClick={() => navigate(`/pickup/${request.share.id}`)}
                      className="flex w-[260px] shrink-0 items-center gap-3 rounded-2xl border border-orange-100 bg-white p-3 text-left shadow-sm"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        <ShareSummaryImage share={request.share} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#2e1a0f]">{request.share.title}</p>
                        <p className="mt-0.5 text-xs font-semibold text-primary">
                          {request.requestStatus === 'accepted' ? 'Accepted, ready to pick up' : 'Requested, waiting'}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="pb-4 pt-6">
            <div className="mb-4 flex items-end justify-between px-4">
              <h2 className="text-lg font-bold text-[#2e1a0f]">Top Picks Today</h2>
              <button onClick={fetchShares} className="text-sm font-semibold text-primary">
                Refresh
              </button>
            </div>

            {filteredTopPicks.length === 0 ? (
              <div className="mx-4 rounded-xl border border-orange-100 bg-white p-5 text-sm text-[#8c6b5d]">
                目前沒有符合條件的分享。你可以先分享庫存裡用不到的食材。
              </div>
            ) : (
              <div className="no-scrollbar flex w-full snap-x gap-4 overflow-x-auto px-4 pb-2">
                {filteredTopPicks.map((item) => {
                  const meta = getFoodCategoryMeta(item.category);
                  const isOwnShare = user?.userId === item.userId;

                  return (
                    <article
                      key={item.id}
                      onClick={() => navigate(`/pickup/${item.id}`)}
                      className="flex w-[280px] shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-2xl border border-orange-50 bg-white shadow-sm"
                    >
                      <div className="relative h-40 w-full overflow-hidden">
                        <ShareImage item={item} />
                        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-[#2e1a0f] backdrop-blur-sm">
                          <span className="material-symbols-outlined text-[14px] text-primary">
                            near_me
                          </span>
                          {formatDistance(item.distance)}
                        </div>
                        <div className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-bold ${meta.tone}`}>
                          {meta.label}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <div className="mb-3">
                          <h3 className="text-lg font-bold leading-tight text-[#2e1a0f]">{item.title}</h3>
                          <p className="mt-1 line-clamp-2 text-xs text-[#8c6b5d]">
                            {item.description || item.pickupInstructions || 'Community surplus share'}
                          </p>
                        </div>

                        <div className="mt-auto flex items-center gap-2 pt-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-primary">
                            {getInitials(item.userName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-[#2e1a0f]">
                              {item.userName || 'SmartFood user'}
                            </p>
                            <p className="text-[10px] text-[#8c6b5d]">{item.expiresIn || 'Available'}</p>
                          </div>
                          <button
                            onClick={(event) => handleRequestPickup(event, item.id)}
                            disabled={isOwnShare}
                            className="rounded-full bg-primary px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-500"
                          >
                            {isOwnShare ? 'Yours' : 'Request'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            </section>
          </>
        )}

        {!loading && !error && filteredExpiringSoon.length > 0 && (
          <section className="bg-orange-50/60 py-4">
            <div className="mb-3 flex items-center gap-2 px-4">
              <span className="material-symbols-outlined text-red-500">timer</span>
              <h2 className="text-lg font-bold text-[#2e1a0f]">Expiring Soon</h2>
            </div>
            <div className="flex flex-col gap-3 px-4">
              {filteredExpiringSoon.map((item) => {
                const isOwnShare = user?.userId === item.userId;

                return (
                  <article
                    key={item.id}
                    onClick={() => navigate(`/pickup/${item.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-red-100 bg-white p-3 shadow-sm"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <ShareImage item={item} compact />
                      <div className="absolute inset-x-0 bottom-0 bg-red-500 py-0.5 text-center text-[9px] font-bold text-white">
                        {item.expiresIn || 'Soon'}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-[#2e1a0f]">{item.title}</h4>
                      <div className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        Needs pickup soon
                      </div>
                      <p className="mt-1 text-xs text-[#8c6b5d]">{formatDistance(item.distance)}</p>
                    </div>

                    <button
                      onClick={(event) => handleRequestPickup(event, item.id)}
                      disabled={isOwnShare}
                      className="rounded-lg px-2 py-1 text-sm font-bold text-primary hover:bg-orange-50 disabled:text-slate-400"
                    >
                      {isOwnShare ? 'Yours' : 'Claim'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="absolute bottom-24 right-4 z-40">
        <button
          onClick={() => navigate('/share')}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-orange-500/30 transition-transform hover:bg-orange-600 active:scale-95"
          aria-label="Share surplus"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
