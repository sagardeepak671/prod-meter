'use client';

import { useAppData } from '@/context/DataContext';
import { getCurrentWeekId, createEmptyWeekSchedule, isSaturday } from '@/lib/utils';
import { CATEGORIES, DAYS, DAY_LABELS, DayOfWeek, Category, Task } from '@/lib/types';
import { Plus, Copy, Save, Trash2, FileDown, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function WeeklyPlanner() {
  const {
    data,
    currentWeekId,
    currentSchedule,
    addTaskToDay,
    removeTaskFromDay,
    copyDayTasks,
    setWeekSchedule,
    saveAsTemplate,
    loadTemplateToWeek,
  } = useAppData();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('mon');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [taskName, setTaskName] = useState('');
  const [taskCategory, setTaskCategory] = useState<Category>('study');
  const [taskPoints, setTaskPoints] = useState('5');
  const [taskTarget, setTaskTarget] = useState('1');

  // Planning mode: current week or next week (only on Saturday)
  const saturday = isSaturday();
  const [planningWeek, setPlanningWeek] = useState<'current' | 'next'>('current');

  const getTargetWeekId = () => {
    if (planningWeek === 'next') {
      const [yearStr, weekStr] = currentWeekId.split('-W');
      const nextWeek = parseInt(weekStr) + 1;
      return `${yearStr}-W${nextWeek.toString().padStart(2, '0')}`;
    }
    return currentWeekId;
  };

  const targetWeekId = getTargetWeekId();
  const targetSchedule = data.schedules[targetWeekId];
  const dayTasks = targetSchedule?.days[selectedDay] || [];


  const handleAddTask = () => {
    if (!taskName.trim()) return;
    const task: Task = {
      id: uuidv4(),
      name: taskName.trim(),
      category: taskCategory,
      pointsPerCount: parseInt(taskPoints) || 0,
      targetCount: parseInt(taskTarget) || 1,
    };
    addTaskToDay(targetWeekId, selectedDay, task);
    setTaskName('');
    setTaskPoints('5');
    setTaskTarget('1');
    setShowAddForm(false);
  };

  const handleDelete = (taskId: string) => {
    removeTaskFromDay(targetWeekId, selectedDay, taskId);
  };

  const handleClearDay = () => {
    if (!targetSchedule) return;
    const tasks = targetSchedule.days[selectedDay] || [];
    tasks.forEach((t) => removeTaskFromDay(targetWeekId, selectedDay, t.id));
  };

  const [copyToDays, setCopyToDays] = useState<DayOfWeek[]>([]);
  const [copyTaskIds, setCopyTaskIds] = useState<string[]>([]);

  const openCopyModal = () => {
    setCopyTaskIds(dayTasks.map((t) => t.id));
    setCopyToDays([]);
    setShowCopyModal(true);
  };

  const handleCopy = () => {
    if (copyToDays.length === 0 || copyTaskIds.length === 0) return;
    copyDayTasks(targetWeekId, selectedDay, copyToDays, copyTaskIds);
    setShowCopyModal(false);
    setCopyToDays([]);
    setCopyTaskIds([]);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const schedule = targetSchedule || createEmptyWeekSchedule(targetWeekId);
    saveAsTemplate(templateName.trim(), schedule, isDefault);
    setShowTemplateModal(false);
    setTemplateName('');
    setIsDefault(false);
  };

  const handleLoadTemplate = (templateId: string) => {
    loadTemplateToWeek(templateId, targetWeekId);
  };

  const getCatInfo = (cat: Category) => CATEGORIES.find((c) => c.id === cat)!;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTemplateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Weekly Planner</h1>
          <p className="text-slate-400 mt-1">Plan your tasks for {targetWeekId}</p>
        </div>
        <div className="flex gap-2">
          {saturday && (
            <div className="flex bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setPlanningWeek('current')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  planningWeek === 'current' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setPlanningWeek('next')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  planningWeek === 'next' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Next Week
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Template Actions */}
      <div className="flex gap-2 flex-wrap text-xs md:text-sm">
        <button
          onClick={() => setShowTemplateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm text-slate-300 hover:bg-card-hover transition-colors"
        >
          <Save className="w-4 h-4" /> Save as Template
        </button>
        {data.templates.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm text-slate-300 hover:bg-card-hover transition-colors"
            >
              <FileDown className="w-4 h-4" /> Load Template <ChevronDown className={`w-3 h-3 transition-transform ${showTemplateDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showTemplateDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl py-1 min-w-[200px] z-10 shadow-xl">
                {data.templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { handleLoadTemplate(t.id); setShowTemplateDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-card-hover transition-colors"
                  >
                    {t.name} {t.isDefault && <span className="text-xs text-violet-400">(default)</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Day Tabs */}
      <div className="flex gap-1.5 md:gap-2 overflow-x-auto">
        {DAYS.map((day) => {
          const tasks = targetSchedule?.days[day] || [];
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[44px] py-2.5 md:py-3 rounded-xl text-center transition-all ${
                day === selectedDay
                  ? 'bg-violet-600 text-white border border-violet-400'
                  : 'bg-card text-slate-400 border border-border hover:bg-card-hover'
              }`}
            >
              <p className="text-xs font-medium uppercase">{day}</p>
              <p className="text-xs text-slate-500 mt-0.5">{tasks.length} tasks</p>
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {dayTasks.map((task) => {
          const catInfo = getCatInfo(task.category);
          return (
            <div key={task.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <span className="text-xl">{catInfo.emoji}</span>
                <div>
                  <p className="text-white font-medium">{task.name}</p>
                  <p className="text-xs text-slate-400">
                    {task.pointsPerCount > 0 ? '+' : ''}{task.pointsPerCount} pts × {task.targetCount} target
                    <span className="ml-2" style={{ color: catInfo.color }}>{catInfo.label}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-300">
                  {task.targetCount * task.pointsPerCount} pts max
                </span>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-2 text-red-400 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-950/30 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions Bar */}
      <div className="flex gap-2 pb-4 flex-wrap">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
        {dayTasks.length > 0 && (
          <>
            <button
              onClick={openCopyModal}
              className="flex items-center gap-2 px-5 py-3 bg-card border border-border text-slate-300 hover:bg-card-hover rounded-xl font-medium transition-colors"
            >
              <Copy className="w-4 h-4" /> Copy to Other Days
            </button>
            <button
              onClick={handleClearDay}
              className="flex items-center gap-2 px-5 py-3 bg-card border border-red-500/30 text-red-400 hover:bg-red-950/20 rounded-xl font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear Day
            </button>
          </>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Add Task to {DAY_LABELS[selectedDay]}</h2>
            <div className="space-y-3 sm:space-y-4" onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); }}>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Task Name</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g., Study Mathematics"
                  autoFocus
                  className="w-full bg-slate-800 border border-border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Category</label>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setTaskCategory(cat.id);
                        if (cat.id === 'waste' && parseInt(taskPoints) > 0) setTaskPoints('-5');
                        else if (cat.id !== 'waste' && parseInt(taskPoints) < 0) setTaskPoints('5');
                      }}
                      className={`p-2 sm:p-3 rounded-xl text-center border transition-colors ${
                        taskCategory === cat.id
                          ? 'border-violet-500 bg-violet-950/30'
                          : 'border-border bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-base sm:text-lg">{cat.emoji}</span>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{cat.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Points per Count</label>
                  <input
                    type="number"
                    value={taskPoints}
                    onChange={(e) => setTaskPoints(e.target.value)}
                    className="w-full bg-slate-800 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Negative for waste tasks</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Target Count</label>
                  <input
                    type="number"
                    value={taskTarget}
                    onChange={(e) => setTaskTarget(e.target.value)}
                    min="1"
                    className="w-full bg-slate-800 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddTask}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
                >
                  Add Task
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setShowCopyModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">
              Copy from {DAY_LABELS[selectedDay]}
            </h2>

            {/* Task Selection */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400 font-medium">Select tasks to copy</p>
                <button
                  onClick={() => setCopyTaskIds(copyTaskIds.length === dayTasks.length ? [] : dayTasks.map((t) => t.id))}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  {copyTaskIds.length === dayTasks.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="space-y-1.5">
                {dayTasks.map((task) => {
                  const catInfo = getCatInfo(task.category);
                  return (
                    <label key={task.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                      copyTaskIds.includes(task.id) ? 'bg-violet-950/30 border border-violet-500/30' : 'bg-slate-800 border border-transparent hover:bg-slate-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={copyTaskIds.includes(task.id)}
                        onChange={(e) => {
                          if (e.target.checked) setCopyTaskIds([...copyTaskIds, task.id]);
                          else setCopyTaskIds(copyTaskIds.filter((id) => id !== task.id));
                        }}
                        className="w-4 h-4 rounded shrink-0"
                      />
                      <span className="text-sm shrink-0">{catInfo.emoji}</span>
                      <span className="text-sm text-white truncate">{task.name}</span>
                      <span className="text-xs text-slate-500 ml-auto shrink-0">{task.pointsPerCount}pts</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Day Selection */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400 font-medium">Copy to days</p>
                <button
                  onClick={() => {
                    const otherDays = DAYS.filter((d) => d !== selectedDay);
                    setCopyToDays(copyToDays.length === otherDays.length ? [] : otherDays);
                  }}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  {copyToDays.length === DAYS.filter((d) => d !== selectedDay).length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAYS.filter((d) => d !== selectedDay).map((day) => (
                  <button
                    key={day}
                    onClick={() => {
                      if (copyToDays.includes(day)) setCopyToDays(copyToDays.filter((d) => d !== day));
                      else setCopyToDays([...copyToDays, day]);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      copyToDays.includes(day)
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={copyToDays.length === 0 || copyTaskIds.length === 0}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
              >
                Copy {copyTaskIds.length} task{copyTaskIds.length !== 1 ? 's' : ''} to {copyToDays.length} day{copyToDays.length !== 1 ? 's' : ''}
              </button>
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-6 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Save as Template</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name"
                className="w-full bg-slate-800 border border-border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-white text-sm">Set as default template (auto-loads for new weeks)</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-6 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
