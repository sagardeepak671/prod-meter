import { format, startOfWeek, addDays, getISOWeek, getYear } from 'date-fns';
import { DayOfWeek, DAYS, WeekSchedule, DailyProgress, WeekSummary, Category } from './types';

export function getCurrentWeekId(date: Date = new Date()): string {
  const week = getISOWeek(date);
  const year = getYear(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

export function getWeekDates(weekId: string): Record<DayOfWeek, string> {
  const [yearStr, weekStr] = weekId.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(year, 0, 4);
  const startOfFirstWeek = startOfWeek(jan4, { weekStartsOn: 1 });
  const weekStart = addDays(startOfFirstWeek, (week - 1) * 7);
  
  const dates: Record<string, string> = {};
  DAYS.forEach((day, i) => {
    dates[day] = format(addDays(weekStart, i), 'yyyy-MM-dd');
  });
  return dates as Record<DayOfWeek, string>;
}

export function getTodayDayOfWeek(): DayOfWeek {
  const dayIndex = (new Date().getDay() + 6) % 7; // Mon=0, Sun=6
  return DAYS[dayIndex];
}

export function getToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isSaturday(): boolean {
  return new Date().getDay() === 6;
}

export function calculateWeeklyPoints(
  schedule: WeekSchedule | undefined,
  dailyProgress: Record<string, DailyProgress>,
  weekId: string
): { earned: number; max: number } {
  if (!schedule) return { earned: 0, max: 0 };
  
  let earned = 0;
  let max = 0;
  
  const weekDates = getWeekDates(weekId);
  
  DAYS.forEach((day) => {
    const tasks = schedule.days[day] || [];
    const dateKey = weekDates[day];
    const progress = dailyProgress[dateKey];
    
    tasks.forEach((task) => {
      if (task.pointsPerCount >= 0) {
        max += task.targetCount * task.pointsPerCount;
      }
      if (progress && progress.tasks[task.id] !== undefined) {
        earned += (progress.tasks[task.id] || 0) * task.pointsPerCount;
      }
    });
  });
  
  return { earned, max };
}

export function calculateConsistencyScore(
  dailyProgress: Record<string, DailyProgress>,
  weekId: string
): number {
  const weekDates = getWeekDates(weekId);
  let activeDays = 0;
  
  DAYS.forEach((day) => {
    const dateKey = weekDates[day];
    const progress = dailyProgress[dateKey];
    if (progress && progress.isActive) {
      activeDays++;
    }
  });
  
  return activeDays / 7;
}

export function calculateStreak(weeklyHistory: WeekSummary[]): { current: number; longest: number } {
  if (weeklyHistory.length === 0) return { current: 0, longest: 0 };
  
  const sorted = [...weeklyHistory].sort((a, b) => b.weekId.localeCompare(a.weekId));
  
  let current = 0;
  for (const week of sorted) {
    if (week.activeDays >= 5) {
      current++;
    } else {
      break;
    }
  }
  
  let longest = 0;
  let streak = 0;
  for (const week of sorted) {
    if (week.activeDays >= 5) {
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 0;
    }
  }
  
  return { current, longest };
}

export function calculateCategoryBreakdown(
  schedule: WeekSchedule | undefined,
  dailyProgress: Record<string, DailyProgress>,
  weekId: string
): Record<Category, { points: number; percentage: number }> {
  const breakdown: Record<Category, number> = { study: 0, health: 0, skill: 0, waste: 0 };
  
  if (!schedule) {
    return {
      study: { points: 0, percentage: 0 },
      health: { points: 0, percentage: 0 },
      skill: { points: 0, percentage: 0 },
      waste: { points: 0, percentage: 0 },
    };
  }
  
  const weekDates = getWeekDates(weekId);
  let totalAbsPoints = 0;
  
  DAYS.forEach((day) => {
    const tasks = schedule.days[day] || [];
    const dateKey = weekDates[day];
    const progress = dailyProgress[dateKey];
    
    tasks.forEach((task) => {
      if (progress && progress.tasks[task.id] !== undefined) {
        const pts = (progress.tasks[task.id] || 0) * task.pointsPerCount;
        breakdown[task.category] += pts;
        totalAbsPoints += Math.abs(pts);
      }
    });
  });
  
  const result: Record<Category, { points: number; percentage: number }> = {
    study: { points: 0, percentage: 0 },
    health: { points: 0, percentage: 0 },
    skill: { points: 0, percentage: 0 },
    waste: { points: 0, percentage: 0 },
  };
  
  (Object.keys(breakdown) as Category[]).forEach((cat) => {
    result[cat] = {
      points: breakdown[cat],
      percentage: totalAbsPoints > 0 ? (Math.abs(breakdown[cat]) / totalAbsPoints) * 100 : 0,
    };
  });
  
  return result;
}

export function generateWeekSummary(
  schedule: WeekSchedule | undefined,
  dailyProgress: Record<string, DailyProgress>,
  weekId: string
): WeekSummary {
  const { earned, max } = calculateWeeklyPoints(schedule, dailyProgress, weekId);
  const consistency = calculateConsistencyScore(dailyProgress, weekId);
  const weekDates = getWeekDates(weekId);
  
  let activeDays = 0;
  DAYS.forEach((day) => {
    const dateKey = weekDates[day];
    if (dailyProgress[dateKey]?.isActive) activeDays++;
  });
  
  const catBreakdown = calculateCategoryBreakdown(schedule, dailyProgress, weekId);
  const categoryPoints: Record<Category, number> = {
    study: catBreakdown.study.points,
    health: catBreakdown.health.points,
    skill: catBreakdown.skill.points,
    waste: catBreakdown.waste.points,
  };
  
  return {
    weekId,
    totalPoints: earned,
    maxPossiblePoints: max,
    activeDays,
    categoryBreakdown: categoryPoints,
    consistencyScore: consistency,
  };
}

export function createEmptyWeekSchedule(weekId: string): WeekSchedule {
  return {
    weekId,
    days: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
    createdAt: new Date().toISOString(),
  };
}
