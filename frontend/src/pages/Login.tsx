import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCurrentUser } from '../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('toby@example.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || 'Login failed.');
      }

      setCurrentUser(data.user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-xl">
      <div className="flex flex-col flex-1 items-center justify-center p-6 w-full max-w-md mx-auto z-10">
        <div className="mb-12 flex flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 shadow-inner mb-4">
            <span className="material-symbols-outlined text-primary text-[48px]">volunteer_activism</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">FoodShare</h1>
          <p className="mt-2 text-slate-500 text-sm font-medium">Join the community to reduce waste</p>
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-5">
          <div className="group relative">
            <label htmlFor="email" className="sr-only">Email Address</label>
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
              <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors duration-300">mail</span>
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              autoComplete="email"
              className="block w-full rounded-full border border-gray-200 bg-gray-50 py-4 pl-12 pr-4 text-slate-900 shadow-sm ring-0 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary/20 focus:border-primary focus:bg-white transition-all duration-300 ease-in-out"
            />
          </div>

          <div className="group relative">
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
              <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors duration-300">lock</span>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="block w-full rounded-full border border-gray-200 bg-gray-50 py-4 pl-12 pr-12 text-slate-900 shadow-sm ring-0 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary/20 focus:border-primary focus:bg-white transition-all duration-300 ease-in-out"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 cursor-pointer hover:text-primary transition-colors text-gray-400"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm font-medium text-primary hover:text-orange-600 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-4 px-6 text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out mt-4 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Logging in...' : 'Log In'}</span>
            <span className={`material-symbols-outlined text-lg font-bold ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'progress_activity' : 'arrow_forward'}
            </span>
          </button>
        </form>

        <div className="relative w-full my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-xs text-slate-500 uppercase tracking-widest">Or continue with</span>
          </div>
        </div>

        <div className="flex justify-center gap-6 w-full mb-8">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 text-slate-500">
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
            </svg>
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 text-slate-500">
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.684.81-1.813 1.5-2.965 1.454-.241-1.125.446-2.22 1.175-3.045.729-.825 1.93-1.547 2.967-1.49zm-1.29 4.71c-1.666-.994-3.69-.955-4.78-.955h-.033c-1.259 0-2.61.48-3.415 1.298-.804.819-1.637 2.375-1.637 4.14 0 2.508 1.49 5.862 3.65 8.914.86 1.213 1.838 2.544 3.195 2.566 1.29.02 1.803-.82 3.37-.82 1.565 0 2.025.82 3.398.8s2.38-2.072 3.268-3.32c1.025-1.442 1.446-2.83 1.468-2.905-.034-.02-2.827-1.072-2.85-4.24-.024-2.65 2.182-3.923 2.28-3.985-.125-.302-.754-1.706-2.864-4.57z"></path>
            </svg>
          </button>
        </div>

        <div className="w-full mb-8">
          <div className="group relative">
            <label htmlFor="community-code" className="sr-only">Community Code</label>
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
              <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors duration-300">group</span>
            </div>
            <input
              type="text"
              id="community-code"
              name="community-code"
              placeholder="Community Code"
              className="block w-full rounded-full border border-gray-200 bg-gray-50 py-4 pl-12 pr-4 text-slate-900 shadow-sm ring-0 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary/20 focus:border-primary focus:bg-white transition-all duration-300 ease-in-out"
            />
          </div>
        </div>

        <div className="mt-auto pb-4 text-center">
          <p className="text-slate-500 text-sm">
            Don't have an account? 
            <button
              onClick={() => navigate('/register')}
              className="font-bold text-primary hover:underline decoration-2 underline-offset-4 ml-1"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
