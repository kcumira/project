import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCurrentUser } from '../lib/auth';

export default function Register() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userName.trim() || !email.trim() || !password) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName.trim(),
          email: email.trim(),
          password,
        }),
      });
      const registerData = await registerRes.json().catch(() => ({}));

      if (!registerRes.ok) {
        throw new Error(registerData.detail || 'Registration failed.');
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const loginData = await loginRes.json().catch(() => ({}));

      if (!loginRes.ok) {
        navigate('/login', { replace: true });
        return;
      }

      setCurrentUser(loginData.user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
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
        <h1 className="text-lg font-extrabold text-slate-900">Create Account</h1>
        <div className="h-10 w-10" />
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8">
        <section className="pt-4 pb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[36px]">person_add</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Join SmartFood</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
            Start tracking food, saving money, and sharing surplus with your community.
          </p>
        </section>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              type="text"
              placeholder="Full name"
              autoComplete="name"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
          </div>

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

          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="new-password"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[22px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">verified_user</span>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              autoComplete="new-password"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
            />
          </div>

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
            <span>{loading ? 'Creating...' : 'Create Account'}</span>
            <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'progress_activity' : 'arrow_forward'}
            </span>
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-medium text-slate-500">
          Already have an account?
          <button onClick={() => navigate('/login')} className="ml-1 font-black text-primary">
            Log in
          </button>
        </p>
      </main>
    </div>
  );
}

