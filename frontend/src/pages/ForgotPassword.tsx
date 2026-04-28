import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSent(false);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || 'Unable to send reset email.');
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white">
      <header className="flex items-center justify-between px-5 pt-12 pb-3">
        <button
          onClick={() => navigate('/login')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <h1 className="text-lg font-extrabold text-slate-900">Reset Password</h1>
        <div className="h-10 w-10" />
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8">
        <section className="pt-12 pb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[36px]">mark_email_unread</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Forgot your password?</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            Enter your email and SmartFood will send a secure reset link to your inbox.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email address"
              autoComplete="email"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
          </div>

          {sent && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Reset email sent. Check your inbox for the link.
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-black text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
            <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'progress_activity' : 'send'}
            </span>
          </button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="mt-6 w-full text-center text-sm font-black text-primary"
        >
          Back to login
        </button>
      </main>
    </div>
  );
}

