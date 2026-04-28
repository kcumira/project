import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { getFoodCategoryMeta } from '../data/foodCategories';
import { getCurrentUser } from '../lib/auth';

type StatusTab = 'pickups' | 'requests' | 'shares' | 'completed';

interface ShareSummary {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  status: string;
  expiryTime: string | null;
  pickupInstructions?: string | null;
  expiresIn?: string | null;
  requestCount?: number;
  activeRequestCount?: number;
}

interface SharingRequest {
  requestId: number;
  requestStatus: string;
  requestedAt: string | null;
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

interface SharingStatusResponse {
  outgoingRequests: SharingRequest[];
  incomingRequests: SharingRequest[];
  myShares: ShareSummary[];
}

const statusMeta: Record<string, { label: string; icon: string; className: string }> = {
  available: { label: 'Available', icon: 'radio_button_checked', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  requested: { label: 'Requested', icon: 'hourglass_top', className: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  accepted: { label: 'Accepted', icon: 'check_circle', className: 'bg-sky-50 text-sky-700 border-sky-100' },
  rejected: { label: 'Rejected', icon: 'block', className: 'bg-red-50 text-red-600 border-red-100' },
  cancelled: { label: 'Cancelled', icon: 'cancel', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  completed: { label: 'Completed', icon: 'task_alt', className: 'bg-primary/10 text-primary border-orange-100' },
};

function getStatusMeta(status: string) {
  return statusMeta[status] ?? { label: status, icon: 'info', className: 'bg-slate-100 text-slate-600 border-slate-200' };
}

function isActiveStatus(status: string) {
  return ['requested', 'accepted'].includes(status);
}

function formatDate(value: string | null) {
  if (!value) return 'No deadline';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: value.includes('T') ? 'numeric' : undefined,
    minute: value.includes('T') ? '2-digit' : undefined,
  }).format(new Date(value));
}

function EmptyState({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-primary">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <p className="mt-3 text-sm font-bold text-slate-700">{title}</p>
    </div>
  );
}

function ShareThumb({ share }: { share: ShareSummary }) {
  const category = getFoodCategoryMeta(share.category);

  if (share.imageUrl) {
    return <img src={share.imageUrl} alt={share.title} className="h-full w-full object-cover" />;
  }

  return (
    <div className={`flex h-full w-full items-center justify-center ${category.tone}`}>
      <span className="material-symbols-outlined text-3xl">{category.icon}</span>
    </div>
  );
}

export default function SharingStatus() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<StatusTab>('pickups');
  const [data, setData] = useState<SharingStatusResponse>({
    outgoingRequests: [],
    incomingRequests: [],
    myShares: [],
  });
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sharing/status/${user.userId}`);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to fetch sharing status');
      }

      setData(await response.json());
    } catch (err) {
      console.error('Failed to fetch sharing status:', err);
      setError(err instanceof Error ? err.message : '無法載入分享狀態。');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    fetchStatus();
  }, [fetchStatus, navigate, user]);

  const stats = useMemo(
    () => {
      const completedRequestsForStats = [
        ...data.outgoingRequests,
        ...data.incomingRequests,
      ].filter((item) => item.requestStatus === 'completed');
      const completedShareIds = new Set(completedRequestsForStats.map((item) => item.share.id));

      return {
        pickups: data.outgoingRequests.filter((item) => isActiveStatus(item.requestStatus)).length,
        requests: data.incomingRequests.filter((item) => isActiveStatus(item.requestStatus)).length,
        shares: data.myShares.filter((item) => item.status === 'available').length,
        completed:
          completedRequestsForStats.length +
          data.myShares.filter(
            (item) => item.status === 'completed' && !completedShareIds.has(item.id),
          ).length,
      };
    },
    [data],
  );

  const activeOutgoingRequests = useMemo(
    () => data.outgoingRequests.filter((item) => isActiveStatus(item.requestStatus)),
    [data.outgoingRequests],
  );

  const activeIncomingRequests = useMemo(
    () => data.incomingRequests.filter((item) => isActiveStatus(item.requestStatus)),
    [data.incomingRequests],
  );

  const activeShares = useMemo(
    () => data.myShares.filter((item) => item.status !== 'completed'),
    [data.myShares],
  );

  const completedRequests = useMemo(() => {
    const seen = new Set<number>();
    return [...data.outgoingRequests, ...data.incomingRequests].filter((request) => {
      if (request.requestStatus !== 'completed' || seen.has(request.requestId)) return false;
      seen.add(request.requestId);
      return true;
    });
  }, [data.incomingRequests, data.outgoingRequests]);

  const completedSharesWithoutRequest = useMemo(() => {
    const completedShareIds = new Set(completedRequests.map((request) => request.share.id));
    return data.myShares.filter(
      (share) => share.status === 'completed' && !completedShareIds.has(share.id),
    );
  }, [completedRequests, data.myShares]);

  const updateRequest = async (requestId: number, status: string) => {
    if (!user) return;
    const key = `request-${requestId}-${status}`;
    setBusyKey(key);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/sharing/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId, status }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || 'Update failed');
      }

      setNotice('狀態已更新。');
      await fetchStatus();
    } catch (err) {
      console.error('Failed to update request:', err);
      setError(err instanceof Error ? err.message : '更新失敗，請稍後再試。');
    } finally {
      setBusyKey(null);
    }
  };

  const updateShare = async (shareId: number, status: string) => {
    if (!user) return;
    const key = `share-${shareId}-${status}`;
    setBusyKey(key);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/sharing/shares/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId, status }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || 'Update failed');
      }

      setNotice('分享狀態已更新。');
      await fetchStatus();
    } catch (err) {
      console.error('Failed to update share:', err);
      setError(err instanceof Error ? err.message : '更新失敗，請稍後再試。');
    } finally {
      setBusyKey(null);
    }
  };

  const renderRequest = (request: SharingRequest, mode: 'outgoing' | 'incoming') => {
    const meta = getStatusMeta(request.requestStatus);
    const share = request.share;

    return (
      <article key={request.requestId} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/pickup/${share.id}`)}
            className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100"
            aria-label={`Open ${share.title}`}
          >
            <ShareThumb share={share} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-slate-900">{share.title}</h3>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                  {mode === 'incoming'
                    ? `${request.requester.userName || 'Someone'} wants pickup`
                    : `From ${request.owner.userName || 'SmartFood user'}`}
                </p>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black ${meta.className}`}>
                <span className="material-symbols-outlined text-[13px]">{meta.icon}</span>
                {meta.label}
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Deadline: {formatDate(request.latestMustReceiveTime || share.expiryTime)}
            </p>
          </div>
        </div>

        {mode === 'incoming' && request.requestStatus === 'requested' && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => updateRequest(request.requestId, 'rejected')}
              disabled={busyKey !== null}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => updateRequest(request.requestId, 'accepted')}
              disabled={busyKey !== null}
              className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white disabled:bg-slate-300"
            >
              Accept
            </button>
          </div>
        )}

        {mode === 'incoming' && request.requestStatus === 'accepted' && (
          <button
            onClick={() => updateRequest(request.requestId, 'completed')}
            disabled={busyKey !== null}
            className="mt-4 w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:bg-slate-300"
          >
            Mark Completed
          </button>
        )}

        {mode === 'outgoing' && ['requested', 'accepted'].includes(request.requestStatus) && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => updateRequest(request.requestId, 'cancelled')}
              disabled={busyKey !== null}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-50"
            >
              Cancel
            </button>
            {request.requestStatus === 'accepted' && (
              <button
                onClick={() => updateRequest(request.requestId, 'completed')}
                disabled={busyKey !== null}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:bg-slate-300"
              >
                Picked Up
              </button>
            )}
          </div>
        )}
      </article>
    );
  };

  const renderShare = (share: ShareSummary) => {
    const meta = getStatusMeta(share.status);

    return (
      <article key={share.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/pickup/${share.id}`)}
            className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100"
            aria-label={`Open ${share.title}`}
          >
            <ShareThumb share={share} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-slate-900">{share.title}</h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                  {share.activeRequestCount || 0} active requests
                </p>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black ${meta.className}`}>
                <span className="material-symbols-outlined text-[13px]">{meta.icon}</span>
                {meta.label}
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Until: {share.expiresIn || formatDate(share.expiryTime)}
            </p>
          </div>
        </div>

        {share.status === 'available' && (
          <button
            onClick={() => updateShare(share.id, 'cancelled')}
            disabled={busyKey !== null}
            className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 disabled:opacity-50"
          >
            Cancel Share
          </button>
        )}
      </article>
    );
  };

  return (
    <div className="relative flex h-full flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white px-5 pb-4 pt-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Community</p>
            <h1 className="text-xl font-extrabold">Sharing Status</h1>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
            aria-label="Food map"
          >
            <span className="material-symbols-outlined">map</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            ['pickups', 'Pickups', stats.pickups],
            ['requests', 'Requests', stats.requests],
            ['shares', 'Shares', stats.shares],
            ['completed', 'Done', stats.completed],
          ].map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as StatusTab)}
              className={`rounded-xl px-2 py-2 text-xs font-black transition-colors ${
                activeTab === key ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {label}
              <span className="ml-1 rounded-full bg-white/20 px-1.5">{count}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 py-5 pb-28">
        {notice && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === 'pickups' &&
              (activeOutgoingRequests.length > 0 ? (
                activeOutgoingRequests.map((request) => renderRequest(request, 'outgoing'))
              ) : (
                <EmptyState icon="shopping_bag" title="你還沒有送出任何領取請求。" />
              ))}

            {activeTab === 'requests' &&
              (activeIncomingRequests.length > 0 ? (
                activeIncomingRequests.map((request) => renderRequest(request, 'incoming'))
              ) : (
                <EmptyState icon="inbox" title="目前還沒有人請求你的分享。" />
              ))}

            {activeTab === 'shares' &&
              (activeShares.length > 0 ? (
                activeShares.map(renderShare)
              ) : (
                <EmptyState icon="volunteer_activism" title="你還沒有發布任何分享。" />
              ))}

            {activeTab === 'completed' &&
              (completedRequests.length > 0 || completedSharesWithoutRequest.length > 0 ? (
                <>
                  {completedRequests.map((request) =>
                    renderRequest(
                      request,
                      request.requester.userId === user?.userId ? 'outgoing' : 'incoming',
                    ),
                  )}
                  {completedSharesWithoutRequest.map(renderShare)}
                </>
              ) : (
                <EmptyState icon="task_alt" title="完成的分享與領取會放在這裡。" />
              ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
