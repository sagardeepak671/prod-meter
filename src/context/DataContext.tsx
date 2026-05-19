'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppData, DEFAULT_APP_DATA, WeekSchedule, DailyProgress, WeeklyTemplate, Reward, Task, DayOfWeek } from '@/lib/types';
import { loadData, saveData } from '@/lib/storage';
import { getCurrentWeekId, getToday, getTodayDayOfWeek, getWeekDates, generateWeekSummary, createEmptyWeekSchedule } from '@/lib/utils';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface DataContextType {
  data: AppData;
  currentWeekId: string;
  currentSchedule: WeekSchedule | undefined;
  todayProgress: DailyProgress | undefined;

  // Schedule actions
  setWeekSchedule: (schedule: WeekSchedule) => void;
  addTaskToDay: (weekId: string, day: DayOfWeek, task: Task) => void;
  removeTaskFromDay: (weekId: string, day: DayOfWeek, taskId: string) => void;
  copyDayTasks: (weekId: string, fromDay: DayOfWeek, toDays: DayOfWeek[], taskIds?: string[]) => void;
  loadTemplateToWeek: (templateId: string, weekId: string) => void;

  // Progress actions
  incrementTask: (date: string, taskId: string) => void;
  decrementTask: (date: string, taskId: string) => void;
  markDayActive: (date: string, weekId: string) => void;

  // Template actions
  saveAsTemplate: (name: string, schedule: WeekSchedule, isDefault?: boolean) => void;
  deleteTemplate: (templateId: string) => void;
  setDefaultTemplate: (templateId: string) => void;

  // Reward actions
  addReward: (reward: Omit<Reward, 'id' | 'claimed'>) => void;
  claimReward: (rewardId: string, weekId: string) => void;
  deleteReward: (rewardId: string) => void;

  // Data actions
  setAppData: (data: AppData) => void;
  finalizeWeek: (weekId: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(DEFAULT_APP_DATA);
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRemoteUpdate = useRef(false);
  const isInitialLoad = useRef(true);
  const hasPendingWrite = useRef(false);

  // Load data: first from localStorage (instant), then listen to Firestore (sync)
  useEffect(() => {
    const stored = loadData();
    setData(stored);
    setLoaded(true);

    if (!user || !db) return;

    const docRef = doc(db, 'users', user.uid);

    // Listen for real-time updates from Firestore (syncs across devices)
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        // If user has local changes that haven't been saved to Firestore yet, skip
        if (hasPendingWrite.current) {
          return;
        }
        const remoteData = snapshot.data() as AppData;
        isRemoteUpdate.current = true;
        setData({ ...DEFAULT_APP_DATA, ...remoteData });
        saveData({ ...DEFAULT_APP_DATA, ...remoteData });
      }
    }, (error) => {
      console.error('Firestore listener error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Save data: to localStorage immediately, debounce Firestore writes
  useEffect(() => {
    if (!loaded) return;
    saveData(data); // always save to localStorage instantly

    // Don't write back to Firestore if this came from Firestore
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    // Don't write the initial localStorage load back to Firestore
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (!user || !db) return;

    // User-initiated change — mark as pending and debounce Firestore write
    hasPendingWrite.current = true;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const docRef = doc(db, 'users', user.uid);
      setDoc(docRef, JSON.parse(JSON.stringify(data))).then(() => {
        hasPendingWrite.current = false;
      }).catch((err) => {
        console.error('Failed to save to Firestore:', err);
        hasPendingWrite.current = false;
      });
    }, 500);
  }, [data, loaded, user]);

  const currentWeekId = getCurrentWeekId();
  const currentSchedule = data.schedules[currentWeekId];
  const today = getToday();
  const todayProgress = data.dailyProgress[today];

  // Auto-load default template if no schedule exists for current week
  useEffect(() => {
    if (loaded && !data.schedules[currentWeekId]) {
      const defaultTemplate = data.templates.find((t) => t.isDefault);
      if (defaultTemplate) {
        const schedule: WeekSchedule = {
          weekId: currentWeekId,
          days: JSON.parse(JSON.stringify(defaultTemplate.days)),
          createdAt: new Date().toISOString(),
        };
        setData((prev) => ({
          ...prev,
          schedules: { ...prev.schedules, [currentWeekId]: schedule },
        }));
      }
    }
  }, [loaded, currentWeekId]);

  const setWeekSchedule = useCallback((schedule: WeekSchedule) => {
    setData((prev) => ({
      ...prev,
      schedules: { ...prev.schedules, [schedule.weekId]: schedule },
    }));
  }, []);

  const addTaskToDay = useCallback((weekId: string, day: DayOfWeek, task: Task) => {
    setData((prev) => {
      const schedule = prev.schedules[weekId] || createEmptyWeekSchedule(weekId);
      return {
        ...prev,
        schedules: {
          ...prev.schedules,
          [weekId]: {
            ...schedule,
            days: {
              ...schedule.days,
              [day]: [...(schedule.days[day] || []), task],
            },
          },
        },
      };
    });
  }, []);

  const removeTaskFromDay = useCallback((weekId: string, day: DayOfWeek, taskId: string) => {
    setData((prev) => {
      const schedule = prev.schedules[weekId];
      if (!schedule) return prev;
      return {
        ...prev,
        schedules: {
          ...prev.schedules,
          [weekId]: {
            ...schedule,
            days: {
              ...schedule.days,
              [day]: schedule.days[day].filter((t) => t.id !== taskId),
            },
          },
        },
      };
    });
  }, []);

  const copyDayTasks = useCallback((weekId: string, fromDay: DayOfWeek, toDays: DayOfWeek[], taskIds?: string[]) => {
    setData((prev) => {
      const schedule = prev.schedules[weekId] || createEmptyWeekSchedule(weekId);
      const allTasks = schedule.days[fromDay] || [];
      const sourceTasks = taskIds ? allTasks.filter((t) => taskIds.includes(t.id)) : allTasks;
      const newDays = { ...schedule.days };
      toDays.forEach((day) => {
        const copiedTasks = sourceTasks.map((t) => ({
          ...t,
          id: `${t.id}_${day}_${Date.now()}`,
        }));
        newDays[day] = [...(newDays[day] || []), ...copiedTasks];
      });
      return {
        ...prev,
        schedules: {
          ...prev.schedules,
          [weekId]: { ...schedule, days: newDays },
        },
      };
    });
  }, []);

  const loadTemplateToWeek = useCallback((templateId: string, weekId: string) => {
    setData((prev) => {
      const template = prev.templates.find((t) => t.id === templateId);
      if (!template) return prev;
      const schedule: WeekSchedule = {
        weekId,
        days: JSON.parse(JSON.stringify(template.days)),
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        schedules: { ...prev.schedules, [weekId]: schedule },
      };
    });
  }, []);

  const incrementTask = useCallback((date: string, taskId: string) => {
    setData((prev) => {
      const progress = prev.dailyProgress[date] || { date, weekId: getCurrentWeekId(), tasks: {}, isActive: true };
      return {
        ...prev,
        dailyProgress: {
          ...prev.dailyProgress,
          [date]: {
            ...progress,
            isActive: true,
            tasks: {
              ...progress.tasks,
              [taskId]: (progress.tasks[taskId] || 0) + 1,
            },
          },
        },
      };
    });
  }, []);

  const decrementTask = useCallback((date: string, taskId: string) => {
    setData((prev) => {
      const progress = prev.dailyProgress[date];
      if (!progress || !progress.tasks[taskId] || progress.tasks[taskId] <= 0) return prev;
      return {
        ...prev,
        dailyProgress: {
          ...prev.dailyProgress,
          [date]: {
            ...progress,
            tasks: {
              ...progress.tasks,
              [taskId]: progress.tasks[taskId] - 1,
            },
          },
        },
      };
    });
  }, []);

  const markDayActive = useCallback((date: string, weekId: string) => {
    setData((prev) => {
      const progress = prev.dailyProgress[date] || { date, weekId, tasks: {}, isActive: false };
      return {
        ...prev,
        dailyProgress: {
          ...prev.dailyProgress,
          [date]: { ...progress, isActive: true },
        },
      };
    });
  }, []);

  const saveAsTemplate = useCallback((name: string, schedule: WeekSchedule, isDefault?: boolean) => {
    setData((prev) => {
      const id = `template_${Date.now()}`;
      const newTemplates = isDefault
        ? prev.templates.map((t) => ({ ...t, isDefault: false }))
        : [...prev.templates];
      return {
        ...prev,
        templates: [
          ...newTemplates.filter((t) => !(isDefault && t.isDefault)),
          {
            id,
            name,
            days: JSON.parse(JSON.stringify(schedule.days)),
            isDefault: isDefault || false,
          },
        ],
      };
    });
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    setData((prev) => ({
      ...prev,
      templates: prev.templates.filter((t) => t.id !== templateId),
    }));
  }, []);

  const setDefaultTemplate = useCallback((templateId: string) => {
    setData((prev) => ({
      ...prev,
      templates: prev.templates.map((t) => ({ ...t, isDefault: t.id === templateId })),
    }));
  }, []);

  const addReward = useCallback((reward: Omit<Reward, 'id' | 'claimed'>) => {
    setData((prev) => ({
      ...prev,
      rewards: [...prev.rewards, { ...reward, id: `reward_${Date.now()}`, claimed: false }],
    }));
  }, []);

  const claimReward = useCallback((rewardId: string, weekId: string) => {
    setData((prev) => ({
      ...prev,
      rewards: prev.rewards.map((r) =>
        r.id === rewardId ? { ...r, claimed: true, claimedWeekId: weekId } : r
      ),
    }));
  }, []);

  const deleteReward = useCallback((rewardId: string) => {
    setData((prev) => ({
      ...prev,
      rewards: prev.rewards.filter((r) => r.id !== rewardId),
    }));
  }, []);

  const setAppData = useCallback((newData: AppData) => {
    setData(newData);
  }, []);

  const finalizeWeek = useCallback((weekId: string) => {
    setData((prev) => {
      const summary = generateWeekSummary(prev.schedules[weekId], prev.dailyProgress, weekId);
      const existingIdx = prev.weeklyHistory.findIndex((w) => w.weekId === weekId);
      const newHistory = [...prev.weeklyHistory];
      if (existingIdx >= 0) {
        newHistory[existingIdx] = summary;
      } else {
        newHistory.push(summary);
      }
      return { ...prev, weeklyHistory: newHistory };
    });
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading Productivito-Meter...</div>
      </div>
    );
  }

  return (
    <DataContext.Provider
      value={{
        data,
        currentWeekId,
        currentSchedule,
        todayProgress,
        setWeekSchedule,
        addTaskToDay,
        removeTaskFromDay,
        copyDayTasks,
        loadTemplateToWeek,
        incrementTask,
        decrementTask,
        markDayActive,
        saveAsTemplate,
        deleteTemplate,
        setDefaultTemplate,
        addReward,
        claimReward,
        deleteReward,
        setAppData,
        finalizeWeek,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useAppData must be used within DataProvider');
  return ctx;
}
