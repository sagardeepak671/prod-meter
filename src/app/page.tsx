'use client';

import { useAppData } from '@/context/DataContext';
import { calculateWeeklyPoints, calculateConsistencyScore, calculateStreak, calculateCategoryBreakdown, getWeekDates, getTodayDayOfWeek } from '@/lib/utils';
import { CATEGORIES, DAYS, DAY_LABELS } from '@/lib/types';
import { Flame, Target, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { data, currentWeekId, currentSchedule } = useAppData();

  const { earned, max } = calculateWeeklyPoints(currentSchedule, data.dailyProgress, currentWeekId);
  const consistency = calculateConsistencyScore(data.dailyProgress, currentWeekId);
  const { current: currentStreak, longest: longestStreak } = calculateStreak(data.weeklyHistory);
  const categoryBreakdown = calculateCategoryBreakdown(currentSchedule, data.dailyProgress, currentWeekId);
  const completionPct = max > 0 ? Math.round((earned / max) * 100) : 0;
  const wastePercentage = categoryBreakdown.waste.percentage;

  const weekDates = getWeekDates(currentWeekId);
  const todayDay = getTodayDayOfWeek();

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Week {currentWeekId} &middot; {DAY_LABELS[todayDay]}</p>
      </div>

      {/* Waste Warning */}
      {wastePercentage > 15 && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-5 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
          <div>
            <p className="text-red-300 font-semibold text-lg">
              You wasted {Math.round(wastePercentage)}% of your week
            </p>
            <p className="text-red-400/70 text-sm mt-0.5">Time to cut back on distractions and refocus.</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Weekly Points */}
        <div className="bg-card rounded-2xl p-6 border border-border hover:border-violet-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <Target className="w-5 h-5 text-violet-400" />
            <span className="text-xs text-slate-500 font-medium">THIS WEEK</span>
          </div>
          <p className="text-3xl font-bold text-white mt-3">{earned}</p>
          <p className="text-sm text-slate-400 mt-1">/ {max} points possible</p>
          <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-violet-500 to-purple-500"
              style={{ width: `${Math.min(completionPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="bg-card rounded-2xl p-6 border border-border hover:border-orange-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-xs text-slate-500 font-medium">STREAK</span>
          </div>
          <p className="text-3xl font-bold text-white mt-3">{currentStreak}</p>
          <p className="text-sm text-slate-400 mt-1">weeks active (best: {longestStreak})</p>
        </div>

        {/* Consistency */}
        <div className="bg-card rounded-2xl p-6 border border-border hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-slate-500 font-medium">CONSISTENCY</span>
          </div>
          <p className="text-3xl font-bold text-white mt-3">{Math.round(consistency * 100)}%</p>
          <p className="text-sm text-slate-400 mt-1">{Math.round(consistency * 7)} / 7 days active</p>
        </div>

        {/* Completion */}
        <div className="bg-card rounded-2xl p-6 border border-border hover:border-sky-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-5 h-5 text-sky-400" />
            <span className="text-xs text-slate-500 font-medium">COMPLETION</span>
          </div>
          <p className="text-3xl font-bold text-white mt-3">{completionPct}%</p>
          <p className="text-sm text-slate-400 mt-1">of weekly targets hit</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-white mb-4">Category Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const catData = categoryBreakdown[cat.id];
            return (
              <div key={cat.id} className="text-center p-4 rounded-xl bg-slate-800/50">
                <span className="text-2xl">{cat.emoji}</span>
                <p className="text-white font-semibold mt-2">{catData.points} pts</p>
                <p className="text-slate-400 text-xs mt-1">{Math.round(catData.percentage)}% of effort</p>
                <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${catData.percentage}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Week Overview */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-white mb-4">This Week at a Glance</h2>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {DAYS.map((day) => {
            const dateKey = weekDates[day];
            const progress = data.dailyProgress[dateKey];
            const isToday = day === todayDay;
            const isActive = progress?.isActive;
            const tasks = currentSchedule?.days[day] || [];
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(
              (t) => (progress?.tasks[t.id] || 0) >= t.targetCount
            ).length;

            return (
              <div
                key={day}
                className={`rounded-xl p-3 text-center border transition-colors ${
                  isToday
                    ? 'border-violet-500/50 bg-violet-950/30'
                    : isActive
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : 'border-border bg-slate-800/30'
                }`}
              >
                <p className="text-xs font-medium text-slate-400 uppercase">{day}</p>
                <p className={`text-lg font-bold mt-1 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {totalTasks > 0 ? `${completedTasks}/${totalTasks}` : '-'}
                </p>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mx-auto mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <Link
          href="/daily"
          className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 hover:from-violet-500 hover:to-purple-500 transition-all group"
        >
          <h3 className="text-white font-semibold text-lg">Track Today&apos;s Tasks</h3>
          <p className="text-violet-200 text-sm mt-1">Update your progress for today</p>
        </Link>
        <Link
          href="/planner"
          className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-2xl p-6 hover:from-slate-600 hover:to-slate-500 transition-all border border-border"
        >
          <h3 className="text-white font-semibold text-lg">Plan Your Week</h3>
          <p className="text-slate-300 text-sm mt-1">Set up tasks and targets</p>
        </Link>
      </div>
    </div>
  );
}
