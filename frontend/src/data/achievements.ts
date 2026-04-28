export type AchievementStatus = 'unlocked' | 'progress' | 'locked';

export interface Achievement {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  status: AchievementStatus;
  progress: number;
  target: number;
  points: number;
}

export const achievements: Achievement[] = [
  {
    id: 'egg-hunter',
    name: 'Egg Hunter',
    title: 'Chicken Egg Hunter',
    description: 'Save or use 12 egg-based items before they expire.',
    icon: 'egg_alt',
    accent: 'from-yellow-300 to-orange-500',
    status: 'unlocked',
    progress: 12,
    target: 12,
    points: 250,
  },
  {
    id: 'strawberry-master',
    name: 'Strawberry Master',
    title: 'Berry Rescue Specialist',
    description: 'Rescue 8 fruit items, including berries or fresh produce.',
    icon: 'nutrition',
    accent: 'from-rose-400 to-red-500',
    status: 'progress',
    progress: 5,
    target: 8,
    points: 300,
  },
  {
    id: 'eco-guardian',
    name: 'Eco Guardian',
    title: 'Environmental Protector',
    description: 'Prevent 10 kg of estimated CO2 waste through sharing and pickup.',
    icon: 'eco',
    accent: 'from-emerald-400 to-teal-600',
    status: 'unlocked',
    progress: 10,
    target: 10,
    points: 500,
  },
  {
    id: 'midnight-cook',
    name: 'Midnight Cook',
    title: 'Late Night Kitchen Hero',
    description: 'Generate 5 recipes using ingredients that expire within 24 hours.',
    icon: 'nightlight',
    accent: 'from-indigo-400 to-violet-600',
    status: 'progress',
    progress: 2,
    target: 5,
    points: 200,
  },
  {
    id: 'community-spark',
    name: 'Community Spark',
    title: 'Neighborhood Starter',
    description: 'Post your first 3 surplus food shares to the community map.',
    icon: 'diversity_3',
    accent: 'from-sky-400 to-blue-600',
    status: 'progress',
    progress: 1,
    target: 3,
    points: 180,
  },
  {
    id: 'zero-waste-week',
    name: 'Zero Waste Week',
    title: 'Seven Day Streak',
    description: 'Use, share, or rescue at least one item every day for 7 days.',
    icon: 'local_fire_department',
    accent: 'from-orange-400 to-amber-600',
    status: 'locked',
    progress: 0,
    target: 7,
    points: 700,
  },
];

export function statusLabel(status: AchievementStatus) {
  if (status === 'unlocked') return 'Unlocked';
  if (status === 'progress') return 'In Progress';
  return 'Locked';
}

export function achievementPercent(achievement: Achievement) {
  return Math.min(100, Math.round((achievement.progress / achievement.target) * 100));
}

