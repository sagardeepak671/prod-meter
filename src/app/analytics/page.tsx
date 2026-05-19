'use client';

import { useAppData } from '@/context/DataContext';
import { calculateCategoryBreakdown, calculateStreak } from '@/lib/utils';
import { CATEGORIES, Category } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Flame, AlertTriangle } from 'lucide-react';

export default function Analytics() {
  const { data, currentWeekId } = useAppData();

  // Weekly history chart data
  const weeklyData = [...data.weeklyHistory]
    .sort((a, b) => a.weekId.localeCompare(b.weekId))
    .slice(-12)
    .map((w) => ({
      week: w.weekId.split('-W')[1],
      points: w.totalPoints,
      max: w.maxPossiblePoints,
      consistency: Math.round(w.consistencyScore * 100),
    }));

  // Category breakdown for current week
  const currentSchedule = data.schedules[currentWeekId];
  const catBreakdown = calculateCategoryBreakdown(currentSchedule, data.dailyProgress, currentWeekId);
  const pieData = CATEGORIES.map((cat) => ({
    name: cat.label,
    value: Math.abs(catBreakdown[cat.id].points) || 0,
    color: cat.color,
    emoji: cat.emoji,
    percentage: catBreakdown[cat.id].percentage,
  })).filter((d) => d.value > 0);

  // Streak
  const { current: currentStreak, longest: longestStreak } = calculateStreak(data.weeklyHistory);

  // Heatmap data (last 12 weeks, organized in columns by week, rows by day)
  const heatmapWeeks: { date: string; active: boolean; points: number; dayLabel: string }[][] = [];
  const today = new Date();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Find the Monday 11 weeks ago
  const todayDayIdx = (today.getDay() + 6) % 7; // Mon=0, Sun=6
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - todayDayIdx - 11 * 7);
  
  for (let w = 0; w < 12; w++) {
    const week: typeof heatmapWeeks[0] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(cellDate.getDate() + w * 7 + d);
      const dateStr = cellDate.toISOString().split('T')[0];
      const progress = data.dailyProgress[dateStr];
      const isFuture = cellDate > today;
      week.push({
        date: dateStr,
        active: isFuture ? false : (progress?.isActive || false),
        points: progress ? Object.values(progress.tasks).reduce((s, v) => s + v, 0) : 0,
        dayLabel: dayNames[d],
      });
    }
    heatmapWeeks.push(week);
  }

  // Weekly trend
  const lastTwo = data.weeklyHistory.slice(-2);
  const trend = lastTwo.length === 2
    ? lastTwo[1].totalPoints - lastTwo[0].totalPoints
    : 0;

  const wastePercent = catBreakdown.waste.percentage;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 mt-1">Your productivity journey visualized</p>
      </div>

      {/* Trend + Waste Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2">
            {trend >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <span className="text-sm text-slate-400">Week-over-week</span>
          </div>
          <p className={`text-2xl font-bold mt-2 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend} pts
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-slate-400">Active Streak</span>
          </div>
          <p className="text-2xl font-bold mt-2 text-orange-400">{currentStreak} weeks</p>
          <p className="text-xs text-slate-500">Best: {longestStreak} weeks</p>
        </div>
        <div className={`border rounded-2xl p-5 ${wastePercent > 20 ? 'bg-red-950/20 border-red-500/30' : 'bg-card border-border'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${wastePercent > 20 ? 'text-red-400' : 'text-slate-400'}`} />
            <span className="text-sm text-slate-400">Waste This Week</span>
          </div>
          <p className={`text-2xl font-bold mt-2 ${wastePercent > 20 ? 'text-red-400' : 'text-slate-300'}`}>
            {Math.round(wastePercent)}%
          </p>
          {wastePercent > 20 && (
            <p className="text-xs text-red-400/70 mt-1">You&apos;re wasting too much time!</p>
          )}
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Activity Heatmap (Last 12 Weeks)</h2>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1 justify-between">
            {dayNames.map((d, i) => (
              <div key={d} className="h-4 flex items-center">
                {i % 2 === 0 && <span className="text-[10px] text-slate-500 leading-none">{d}</span>}
              </div>
            ))}
          </div>
          {/* Weeks */}
          {heatmapWeeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell, di) => (
                <div
                  key={di}
                  title={`${cell.date}: ${cell.active ? 'Active' : 'Inactive'} (${cell.points} actions)`}
                  className={`w-4 h-4 rounded-sm transition-colors ${
                    !cell.active
                      ? 'bg-slate-800/60'
                      : cell.points > 10
                      ? 'bg-emerald-400'
                      : cell.points > 5
                      ? 'bg-emerald-500'
                      : cell.points > 2
                      ? 'bg-emerald-600'
                      : 'bg-emerald-700'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-xs text-slate-500">Less</span>
          <div className="w-3 h-3 rounded-sm bg-slate-800/60" />
          <div className="w-3 h-3 rounded-sm bg-emerald-700" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <span className="text-xs text-slate-500">More</span>
        </div>
      </div>

      {/* Weekly Points Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Weekly Points Over Time</h2>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `W${v}`} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Line type="monotone" dataKey="points" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
              <Line type="monotone" dataKey="max" stroke="#334155" strokeWidth={1} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            <p>Complete at least one week to see trends</p>
          </div>
        )}
      </div>

      {/* Category Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Effort Distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${Math.round((percent || 0) * 100)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500">
              <p>No data yet this week</p>
            </div>
          )}
        </div>

        {/* Consistency Chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Weekly Consistency</h2>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `W${v}`} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="consistency" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500">
              <p>Complete at least one week to see consistency</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Details */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Category Breakdown This Week</h2>
        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const catData = catBreakdown[cat.id];
            return (
              <div key={cat.id} className="flex items-center gap-4">
                <span className="text-2xl w-8">{cat.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{cat.label}</span>
                    <span className="text-sm text-slate-400">
                      {catData.points} pts ({Math.round(catData.percentage)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${catData.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
