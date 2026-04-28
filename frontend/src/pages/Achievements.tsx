import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { achievements, achievementPercent, statusLabel } from '../data/achievements';

const filters = ['All', 'Unlocked', 'In Progress', 'Locked'];

export default function Achievements() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  const visibleAchievements = useMemo(() => {
    if (activeFilter === 'Unlocked') {
      return achievements.filter((achievement) => achievement.status === 'unlocked');
    }
    if (activeFilter === 'In Progress') {
      return achievements.filter((achievement) => achievement.status === 'progress');
    }
    if (activeFilter === 'Locked') {
      return achievements.filter((achievement) => achievement.status === 'locked');
    }
    return achievements;
  }, [activeFilter]);

  const unlockedCount = achievements.filter((achievement) => achievement.status === 'unlocked').length;

  return (
    <div className="bg-slate-50 text-slate-900 flex flex-col h-full relative">
      <header className="flex items-center justify-between px-5 pt-12 pb-3 bg-white sticky top-0 z-20 border-b border-slate-100">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Collection</p>
          <h1 className="text-lg font-extrabold text-slate-900">Achievements</h1>
        </div>
        <div className="h-10 w-10" />
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">
        <section className="py-5">
          <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-emerald-600 p-5 text-white shadow-lg shadow-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/70">Badge Progress</p>
                <h2 className="mt-1 text-3xl font-black">
                  {unlockedCount}/{achievements.length}
                </h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[34px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
              </div>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${Math.round((unlockedCount / achievements.length) * 100)}%` }}
              />
            </div>
          </div>
        </section>

        <section className="pb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {filters.map((filter) => {
              const selected = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                    selected
                      ? 'bg-primary text-white shadow-md shadow-orange-200'
                      : 'bg-white text-slate-500 border border-slate-100 hover:text-primary'
                  }`}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </section>

        <section className="pb-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">Badge Collection</h3>
            <span className="text-xs font-bold text-slate-400">{visibleAchievements.length} shown</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {visibleAchievements.map((achievement) => {
              const locked = achievement.status === 'locked';

              return (
                <article
                  key={achievement.id}
                  className={`min-h-[210px] rounded-2xl border bg-white p-3 shadow-sm transition-all ${
                    locked ? 'border-slate-100 opacity-70' : 'border-orange-100 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${achievement.accent} text-white shadow-sm ${
                        locked ? 'grayscale' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {locked ? 'lock' : achievement.icon}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${
                        achievement.status === 'unlocked'
                          ? 'bg-emerald-50 text-emerald-600'
                          : achievement.status === 'progress'
                          ? 'bg-orange-50 text-primary'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {statusLabel(achievement.status)}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-sm font-extrabold leading-tight text-slate-900">{achievement.name}</h4>
                    <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-500">{achievement.title}</p>
                    <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-slate-500">
                      {achievement.description}
                    </p>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>
                        {achievement.progress}/{achievement.target}
                      </span>
                      <span>{achievement.points} pts</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${achievement.accent}`}
                        style={{ width: `${achievementPercent(achievement)}%` }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

