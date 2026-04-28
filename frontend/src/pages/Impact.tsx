import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { achievements, achievementPercent } from '../data/achievements';
import { clearCurrentUser, getCurrentUser } from '../lib/auth';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Impact() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const displayName = user?.userName || 'SmartFood User';
  const unlocked = achievements.filter((achievement) => achievement.status === 'unlocked');
  const inProgress = achievements.filter((achievement) => achievement.status === 'progress');
  const featured = unlocked[0] ?? achievements[0];
  const nextAchievement = inProgress[0] ?? achievements.find((achievement) => achievement.status === 'locked') ?? achievements[0];
  const totalPoints = unlocked.reduce((sum, achievement) => sum + achievement.points, 0);

  const handleLogout = () => {
    clearCurrentUser();
    navigate('/login', { replace: true });
  };

  return (
    <div className="bg-slate-50 text-slate-900 flex flex-col h-full relative">
      <header className="flex items-center justify-between px-5 pt-12 pb-3 bg-white sticky top-0 z-20 border-b border-slate-100">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">SmartFood</p>
          <h1 className="text-xl font-extrabold text-slate-900">Profile</h1>
        </div>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-28">
        <section className="px-5 pt-5 pb-4">
          <div className="rounded-2xl bg-white border border-orange-100 shadow-sm overflow-hidden">
            <div className="p-5 bg-gradient-to-br from-orange-50 via-white to-emerald-50">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 p-1 shadow-lg shadow-orange-200">
                    <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white text-2xl font-black text-primary">
                      {getInitials(displayName)}
                    </div>
                  </div>
                  <div className="absolute -right-2 -bottom-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-yellow-300 to-orange-500 text-white shadow-md">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {featured.icon}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-extrabold text-slate-900 truncate">{displayName}</h2>
                  <p className="text-sm font-semibold text-primary">{featured.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {user?.email || 'No email'} · Level 5
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-5">
          <h3 className="mb-3 text-base font-extrabold text-slate-900">Impact Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white shadow-lg shadow-orange-100">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                cloud_off
              </span>
              <p className="mt-5 text-2xl font-black">12.5</p>
              <p className="text-[11px] font-bold text-orange-100">kg CO2 Saved</p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
              <span className="material-symbols-outlined text-[24px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                soup_kitchen
              </span>
              <p className="mt-5 text-2xl font-black text-slate-900">15</p>
              <p className="text-[11px] font-bold text-slate-500">Meals Rescued</p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
              <span className="material-symbols-outlined text-[24px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                volunteer_activism
              </span>
              <p className="mt-5 text-2xl font-black text-slate-900">6</p>
              <p className="text-[11px] font-bold text-slate-500">Items Shared</p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
              <span className="material-symbols-outlined text-[24px] text-sky-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                stars
              </span>
              <p className="mt-5 text-2xl font-black text-slate-900">{totalPoints}</p>
              <p className="text-[11px] font-bold text-slate-500">Badge Points</p>
            </div>
          </div>
        </section>

        <section className="px-5 pb-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">Achievements</h3>
            <button
              onClick={() => navigate('/achievements')}
              className="flex items-center gap-0.5 text-xs font-black text-primary hover:text-orange-600"
            >
              View All
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/achievements')}
            className="w-full rounded-2xl bg-white border border-orange-100 p-4 text-left shadow-sm active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${nextAchievement.accent} text-white shadow-sm`}>
                  <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {nextAchievement.icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Next Badge</p>
                  <h4 className="truncate text-base font-black text-slate-900">{nextAchievement.name}</h4>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{nextAchievement.title}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>
                  {nextAchievement.progress}/{nextAchievement.target}
                </span>
                <span>{unlocked.length}/{achievements.length} unlocked</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${nextAchievement.accent}`}
                  style={{ width: `${achievementPercent(nextAchievement)}%` }}
                />
              </div>
            </div>
          </button>
        </section>

        <section className="px-5 pb-6">
          <h3 className="mb-3 text-base font-extrabold text-slate-900">Account</h3>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {[
              ['fact_check', 'Sharing status', '/sharing-status'],
              ['person', 'Edit profile', ''],
              ['notifications', 'Notification preferences', ''],
              ['location_on', 'Pickup location', ''],
            ].map(([icon, label, href]) => (
              <button
                key={label}
                onClick={() => href && navigate(href)}
                className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <span className="material-symbols-outlined text-[20px] text-slate-400">{icon}</span>
                  {label}
                </span>
                <span className="material-symbols-outlined text-[18px] text-slate-300">chevron_right</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-between px-4 py-3 hover:bg-red-50 transition-colors"
            >
              <span className="flex items-center gap-3 text-sm font-bold text-red-500">
                <span className="material-symbols-outlined text-[20px] text-red-400">logout</span>
                Log out
              </span>
              <span className="material-symbols-outlined text-[18px] text-red-200">chevron_right</span>
            </button>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
