import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFoodCategoryMeta } from '../data/foodCategories';
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
  pickupInstructions: string | null;
  distance: number | null;
  expiresIn: string | null;
}

interface SharingRequest {
  requestId: number;
  requestStatus: string;
  share: {
    id: number;
  };
}

const requestStatusMeta: Record<string, { label: string; icon: string; className: string }> = {
  requested: { label: 'You requested this pickup', icon: 'hourglass_top', className: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  accepted: { label: 'Accepted, ready to pick up', icon: 'check_circle', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  completed: { label: 'Pickup completed', icon: 'task_alt', className: 'bg-primary/10 text-primary border-orange-100' },
  cancelled: { label: 'Request cancelled', icon: 'cancel', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  rejected: { label: 'Request rejected', icon: 'block', className: 'bg-red-50 text-red-600 border-red-100' },
};

function formatDistance(distance: number | null) {
  if (distance == null) return 'Distance unavailable';
  return `${distance.toFixed(distance < 10 ? 1 : 0)} mi away`;
}

function formatDate(value: string | null) {
  if (!value) return 'No expiry date';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: value.includes('T') ? 'numeric' : undefined,
    minute: value.includes('T') ? '2-digit' : undefined,
  }).format(new Date(value));
}

function getInitials(name: string | null) {
  if (!name) return 'SF';
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function RequestPickup() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user] = useState(() => getCurrentUser());
  const [share, setShare] = useState<ShareItem | null>(null);
  const [coords, setCoords] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [myRequest, setMyRequest] = useState<SharingRequest | null>(null);

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

  const fetchShare = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: String(coords.lat),
        lng: String(coords.lng),
      });
      const response = await fetch(`/api/shares/${id}?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Share not found');
      }

      setShare(await response.json());
    } catch (err) {
      console.error('Failed to fetch share:', err);
      setError(err instanceof Error ? err.message : '無法載入分享資料。');
    } finally {
      setLoading(false);
    }
  }, [coords.lat, coords.lng, id]);

  const fetchMyRequest = useCallback(async () => {
    if (!user || !id) return;

    try {
      const response = await fetch(`/api/sharing/status/${user.userId}`);

      if (!response.ok) return;

      const data = await response.json();
      const requests: SharingRequest[] = data.outgoingRequests ?? [];
      setMyRequest(requests.find((request) => request.share.id === Number(id)) ?? null);
    } catch (err) {
      console.error('Failed to fetch request status:', err);
    }
  }, [id, user]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    fetchShare();
    fetchMyRequest();
  }, [fetchMyRequest, fetchShare, navigate, user]);

  const handleRequest = async () => {
    if (!user || !share || submitting) return;

    setSubmitting(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/request-pickup/${share.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Request failed');
      }

      setNotice('領取請求已送出，這筆分享會從可領取列表暫時移除。');
      navigate('/sharing-status');
    } catch (err) {
      console.error('Failed to request pickup:', err);
      setError(err instanceof Error ? err.message : '領取請求失敗，請稍後再試。');
    } finally {
      setSubmitting(false);
    }
  };

  const meta = getFoodCategoryMeta(share?.category);
  const isOwnShare = share?.userId === user?.userId;
  const hasExistingRequest = Boolean(myRequest && ['requested', 'accepted', 'completed'].includes(myRequest.requestStatus));
  const canRequest = Boolean(share && share.status === 'available' && !isOwnShare && !hasExistingRequest && !submitting);
  const myRequestMeta = myRequest ? requestStatusMeta[myRequest.requestStatus] : null;

  return (
    <div className="relative flex h-full flex-col bg-[#fffaf5] text-slate-900">
      <div className="sticky top-0 z-20 flex items-center justify-between bg-white/90 px-4 py-4 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          aria-label="Back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold tracking-tight">Request Pickup</h2>
        <button
          onClick={() => navigate('/map')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          aria-label="Food map"
        >
          <span className="material-symbols-outlined">map</span>
        </button>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto pb-32">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}

        {!loading && error && !share && (
          <div className="mx-5 mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {!loading && share && (
          <>
            <div className="relative h-72 w-full overflow-hidden">
              {share.imageUrl ? (
                <img src={share.imageUrl} alt={share.title} className="h-full w-full object-cover" />
              ) : (
                <div className={`flex h-full w-full items-center justify-center ${meta.tone}`}>
                  <span className="material-symbols-outlined text-7xl">{meta.icon}</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  {share.status === 'available' ? 'Available Now' : share.status}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold shadow-lg ${meta.tone}`}>
                  {meta.label}
                </span>
              </div>
            </div>

            <div className="px-5 pt-6">
              {notice && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                  {notice}
                </div>
              )}
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              {myRequestMeta && (
                <button
                  onClick={() => navigate('/sharing-status')}
                  className={`mb-4 flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-bold ${myRequestMeta.className}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">{myRequestMeta.icon}</span>
                    {myRequestMeta.label}
                  </span>
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">{share.title}</h1>
                  <div className="mt-1 flex items-center gap-2 text-sm font-medium text-primary">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span>{formatDistance(share.distance)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/10 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-primary">
                    <span className="material-symbols-outlined text-lg">timer</span>
                    Available Until
                  </div>
                  <span className="text-xs font-bold text-primary">{share.expiresIn || formatDate(share.expiryTime)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
                  <div className="h-full w-2/3 rounded-full bg-primary" />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/20 bg-orange-100 text-sm font-bold text-primary">
                    {getInitials(share.userName)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{share.userName || 'SmartFood user'}</p>
                    <div className="flex items-center text-sm text-slate-500">
                      <span className="material-symbols-outlined text-sm text-yellow-500">verified</span>
                      <span className="ml-1 font-semibold text-slate-700">Community sharer</span>
                    </div>
                  </div>
                </div>
                {isOwnShare && (
                  <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                    Your share
                  </span>
                )}
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Description</h3>
                <p className="mt-2 leading-relaxed text-slate-600">
                  {share.description || 'This item was shared from a SmartFood inventory.'}
                </p>
              </div>

              {share.pickupInstructions && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span className="material-symbols-outlined text-primary">info</span>
                    Pickup Instructions
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">{share.pickupInstructions}</p>
                </div>
              )}

              <div className="mt-8">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
                  Pickup Location
                </h3>
                <div className="relative h-36 w-full overflow-hidden rounded-xl border border-slate-200 bg-[linear-gradient(135deg,#e2f3ef_25%,#f8efe2_25%,#f8efe2_50%,#e2f3ef_50%,#e2f3ef_75%,#f8efe2_75%)] bg-[length:32px_32px]">
                  <div className="absolute inset-0 bg-white/35" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-xl ring-4 ring-primary/30">
                      <span className="material-symbols-outlined">location_on</span>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                    {share.lat.toFixed(4)}, {share.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/95 p-4 backdrop-blur-md">
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/map')}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
            aria-label="Back to map"
          >
            <span className="material-symbols-outlined">map</span>
          </button>
          <button
            onClick={() => (hasExistingRequest || isOwnShare ? navigate('/sharing-status') : handleRequest())}
            disabled={!share || submitting || (!canRequest && !hasExistingRequest && !isOwnShare)}
            className="flex h-14 flex-1 items-center justify-center rounded-xl bg-primary px-6 text-base font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95 disabled:bg-slate-300 disabled:text-slate-500"
          >
            {submitting
              ? 'Sending...'
              : isOwnShare
                ? 'Manage Share'
                : hasExistingRequest
                  ? 'View Status'
                  : share?.status === 'available'
                    ? 'Confirm Request'
                    : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
}
