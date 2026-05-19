'use client';

import { useAppData } from '@/context/DataContext';
import { getToday, getTodayDayOfWeek, getWeekDates, getCurrentWeekId } from '@/lib/utils';
import { CATEGORIES, DAY_LABELS, DAYS, DayOfWeek, Category } from '@/lib/types';
import { Plus, Minus, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { useState } from 'react';

export default function DailyTracker() {
  const { data, currentWeekId, currentSchedule, incrementTask, decrementTask, markDayActive } = useAppData();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek());

  const weekDates = getWeekDates(currentWeekId);
  const selectedDate = weekDates[selectedDay];
  const progress = data.dailyProgress[selectedDate];
  const dayTasks = currentSchedule?.days[selectedDay] || [];
  const isToday = selectedDay === getTodayDayOfWeek();

  const handleIncrement = (taskId: string) => {
    markDayActive(selectedDate, currentWeekId);
    incrementTask(selectedDate, taskId);
  };

  const handleDecrement = (taskId: string) => {
    decrementTask(selectedDate, taskId);
  };

  const totalEarned = dayTasks.reduce((sum, task) => {
    const done = progress?.tasks[task.id] || 0;
    return sum + done * task.pointsPerCount;
  }, 0);

  const totalPossible = dayTasks.reduce((sum, task) => {
    if (task.pointsPerCount > 0) {
      return sum + task.targetCount * task.pointsPerCount;
    }
    return sum;
  }, 0);

  const getCategoryInfo = (cat: Category) => CATEGORIES.find((c) => c.id === cat)!;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Daily Tracker</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            {isToday ? "Today's" : DAY_LABELS[selectedDay] + "'s"} tasks &middot; {selectedDate}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-card border border-border rounded-xl px-4 py-2">
            <span className="text-sm text-slate-400">Points: </span>
            <span className={`font-bold ${totalEarned >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalEarned}
            </span>
            <span className="text-slate-500"> / {totalPossible}</span>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-1.5 md:gap-2 overflow-x-auto">
        {DAYS.map((day) => {
          const isActive = day === selectedDay;
          const dayDate = weekDates[day];
          const dayProgress = data.dailyProgress[dayDate];
          const hasActivity = dayProgress?.isActive;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[44px] py-2.5 md:py-3 px-1.5 md:px-2 rounded-xl text-center transition-all ${
                isActive
                  ? 'bg-violet-600 text-white border border-violet-400'
                  : hasActivity
                  ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-950/50'
                  : 'bg-card text-slate-400 border border-border hover:bg-card-hover'
              }`}
            >
              <p className="text-xs font-medium uppercase">{day}</p>
            </button>
          );
        })}
      </div>

      {/* No Schedule Warning */}
      {!currentSchedule && (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-6 text-center">
          <Clock className="w-10 h-10 text-amber-400 mx-auto" />
          <p className="text-amber-300 font-semibold mt-3">No schedule set for this week</p>
          <p className="text-amber-400/70 text-sm mt-1">Go to Weekly Planner to set up your tasks</p>
        </div>
      )}

      {/* Tasks List */}
      {dayTasks.length === 0 && currentSchedule && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-slate-400">No tasks scheduled for {DAY_LABELS[selectedDay]}</p>
        </div>
      )}

      <div className="space-y-3">
        {dayTasks.map((task) => {
          const doneCount = progress?.tasks[task.id] || 0;
          const isPositive = task.pointsPerCount >= 0;
          const metTarget = isPositive
            ? doneCount >= task.targetCount
            : doneCount <= task.targetCount;
          const exceeded = isPositive
            ? doneCount > task.targetCount
            : doneCount > task.targetCount;
          const catInfo = getCategoryInfo(task.category);

          let statusColor = 'border-border';
          let bgColor = 'bg-card';
          if (doneCount > 0 && isPositive && metTarget) {
            statusColor = 'border-emerald-500/40';
            bgColor = 'bg-emerald-950/20';
          } else if (doneCount > 0 && isPositive && !metTarget) {
            statusColor = 'border-amber-500/30';
            bgColor = 'bg-amber-950/10';
          } else if (!isPositive && doneCount > 0) {
            statusColor = 'border-red-500/40';
            bgColor = 'bg-red-950/20';
          }

          return (
            <div
              key={task.id}
              className={`${bgColor} border ${statusColor} rounded-2xl p-5 transition-all hover:scale-[1.01]`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Status Icon */}
                  <div className="hidden sm:block">
                    {metTarget && doneCount > 0 ? (
                      <CheckCircle2 className={`w-7 h-7 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`} />
                    ) : doneCount > 0 ? (
                      <Clock className="w-7 h-7 text-amber-400" />
                    ) : (
                      <XCircle className="w-7 h-7 text-slate-600" />
                    )}
                  </div>

                  {/* Task Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{catInfo.emoji}</span>
                      <h3 className="text-white font-semibold text-sm md:text-base">{task.name}</h3>
                      {exceeded && isPositive && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                          BONUS!
                        </span>
                      )}
                      {!isPositive && doneCount > task.targetCount && (
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
                          OVER LIMIT
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">
                        Target: {task.targetCount} &middot; {task.pointsPerCount > 0 ? '+' : ''}{task.pointsPerCount} pts each
                      </span>
                      <span className="text-xs font-medium" style={{ color: catInfo.color }}>
                        {catInfo.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Counter */}
                <div className="flex items-center gap-2 md:gap-3 self-end sm:self-auto">
                  <button
                    onClick={() => handleDecrement(task.id)}
                    disabled={doneCount <= 0}
                    className="w-10 h-10 rounded-xl bg-slate-800 border border-border flex items-center justify-center hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4 text-white" />
                  </button>

                  <div className="w-16 text-center">
                    <p className={`text-2xl font-bold ${
                      metTarget && isPositive && doneCount > 0
                        ? 'text-emerald-400'
                        : !isPositive && doneCount > task.targetCount
                        ? 'text-red-400'
                        : 'text-white'
                    }`}>
                      {doneCount}
                    </p>
                    <p className="text-xs text-slate-500">/ {task.targetCount}</p>
                  </div>

                  <button
                    onClick={() => handleIncrement(task.id)}
                    className="w-10 h-10 rounded-xl bg-violet-600 border border-violet-400 flex items-center justify-center hover:bg-violet-500 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    !isPositive
                      ? doneCount > task.targetCount ? 'bg-red-500' : 'bg-amber-500'
                      : metTarget ? 'bg-emerald-500' : 'bg-violet-500'
                  }`}
                  style={{
                    width: `${Math.min((doneCount / Math.max(task.targetCount, 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Summary */}
      {dayTasks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-400" />
              <span className="text-white font-medium">Day Summary</span>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${totalEarned >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalEarned > 0 ? '+' : ''}{totalEarned} pts
              </p>
              <p className="text-xs text-slate-400">
                {dayTasks.filter((t) => {
                  const done = progress?.tasks[t.id] || 0;
                  return t.pointsPerCount >= 0 ? done >= t.targetCount : done <= t.targetCount;
                }).length} / {dayTasks.length} tasks completed
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
