export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export type Category = 'study' | 'health' | 'skill' | 'waste';

export const CATEGORIES: { id: Category; label: string; emoji: string; color: string }[] = [
  { id: 'study', label: 'Study', emoji: '📚', color: '#3b82f6' },
  { id: 'health', label: 'Health', emoji: '🏃', color: '#10b981' },
  { id: 'skill', label: 'Skill', emoji: '💻', color: '#8b5cf6' },
  { id: 'waste', label: 'Waste', emoji: '❌', color: '#ef4444' },
];

export interface Task {
  id: string;
  name: string;
  category: Category;
  pointsPerCount: number;
  targetCount: number;
}

export interface WeekSchedule {
  weekId: string;
  days: Record<DayOfWeek, Task[]>;
  createdAt: string;
}

export interface DailyProgress {
  date: string;
  weekId: string;
  tasks: Record<string, number>; // taskId -> doneCount
  isActive: boolean;
}

export interface WeeklyTemplate {
  id: string;
  name: string;
  days: Record<DayOfWeek, Task[]>;
  isDefault: boolean;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsThreshold: number;
  claimed: boolean;
  claimedWeekId?: string;
}

export interface WeekSummary {
  weekId: string;
  totalPoints: number;
  maxPossiblePoints: number;
  activeDays: number;
  categoryBreakdown: Record<Category, number>;
  consistencyScore: number;
}

export interface AppData {
  schedules: Record<string, WeekSchedule>;
  dailyProgress: Record<string, DailyProgress>;
  templates: WeeklyTemplate[];
  rewards: Reward[];
  weeklyHistory: WeekSummary[];
}

export const DEFAULT_APP_DATA: AppData = {
  schedules: {},
  dailyProgress: {},
  templates: [],
  rewards: [],
  weeklyHistory: [],
};
