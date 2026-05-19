'use client';

import { useAppData } from '@/context/DataContext';
import { exportData, importData } from '@/lib/storage';
import { Download, Upload, Trash2, Star, Shield, CheckCircle, AlertTriangle, BookOpen, ChevronDown } from 'lucide-react';
import { useState, useRef } from 'react';

export default function Settings() {
  const { data, setAppData, deleteTemplate, setDefaultTemplate, finalizeWeek, currentWeekId } = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleExport = () => {
    exportData(data);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importData(file);
      setAppData(imported);
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (err) {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFinalize = () => {
    finalizeWeek(currentWeekId);
    setShowFinalizeConfirm(false);
  };

  return (
    <div className="animate-fade-in space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your data, templates, and preferences</p>
      </div>

      {/* How to Use */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-card-hover transition-colors"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">How to Use Productivito-Meter</h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
        </button>
        {showGuide && (
          <div className="px-6 pb-6 space-y-5 text-sm">
            <div className="flex gap-3">
              <span className="text-2xl shrink-0">📋</span>
              <div>
                <p className="text-white font-medium">Step 1: Plan Your Week</p>
                <p className="text-slate-400 mt-1">Go to <strong className="text-violet-300">Weekly Planner</strong>. Add tasks to each day — study sessions, exercise, reading, etc. Assign points based on importance. Waste activities like social media scrolling get <strong className="text-red-300">negative points</strong>.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl shrink-0">✅</span>
              <div>
                <p className="text-white font-medium">Step 2: Track Daily</p>
                <p className="text-slate-400 mt-1">Open <strong className="text-violet-300">Daily Tracker</strong> every day. Tap the <strong className="text-slate-200">+</strong> button each time you complete a task. Your points update in real-time. Try to hit your targets!</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl shrink-0">📊</span>
              <div>
                <p className="text-white font-medium">Step 3: Review Analytics</p>
                <p className="text-slate-400 mt-1">Check <strong className="text-violet-300">Analytics</strong> to see your week-over-week trends, activity heatmap, and category breakdown. See exactly how much time you&apos;re wasting vs. being productive.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl shrink-0">🏆</span>
              <div>
                <p className="text-white font-medium">Step 4: Set Rewards</p>
                <p className="text-slate-400 mt-1">Go to <strong className="text-violet-300">Rewards</strong> and set milestones like &quot;50 pts = Ice cream&quot; or &quot;200 pts = Movie night&quot;. When you earn enough points, claim your reward!</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl shrink-0">💡</span>
              <div>
                <p className="text-white font-medium">Pro Tips</p>
                <ul className="text-slate-400 mt-1 space-y-1">
                  <li>- <strong className="text-slate-300">Save templates</strong> in Weekly Planner to reuse your best weekly schedule</li>
                  <li>- <strong className="text-slate-300">Copy tasks</strong> to multiple days to save time</li>
                  <li>- <strong className="text-slate-300">Finalize your week</strong> every Saturday to track long-term progress</li>
                  <li>- <strong className="text-slate-300">On Saturday</strong>, you can plan next week in advance</li>
                  <li>- Your data <strong className="text-slate-300">syncs across all devices</strong> automatically</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Data Management</h2>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Your data syncs across devices via Firebase and is cached locally for offline access. Export regularly as an extra backup.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Export Data (JSON)
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-3 bg-card border border-border text-slate-300 hover:bg-card-hover rounded-xl font-medium transition-colors"
          >
            <Upload className="w-4 h-4" /> Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
        {importStatus === 'success' && (
          <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" /> Data imported successfully!
          </div>
        )}
        {importStatus === 'error' && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" /> Failed to import. Check file format.
          </div>
        )}
      </div>

      {/* Finalize Week */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Finalize Current Week</h2>
        <p className="text-slate-400 text-sm mb-4">
          Save this week&apos;s summary to your history. Do this at the end of each week to track progress over time.
        </p>
        <button
          onClick={() => setShowFinalizeConfirm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors"
        >
          <CheckCircle className="w-4 h-4" /> Finalize Week {currentWeekId}
        </button>
      </div>

      {/* Templates */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Weekly Templates</h2>
        {data.templates.length === 0 ? (
          <p className="text-slate-500 text-sm">No templates saved yet. Go to Weekly Planner to create one.</p>
        ) : (
          <div className="space-y-3">
            {data.templates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  {template.isDefault && <Star className="w-4 h-4 text-amber-400" />}
                  <div>
                    <p className="text-white font-medium">{template.name}</p>
                    <p className="text-xs text-slate-400">
                      {Object.values(template.days).reduce((sum, tasks) => sum + tasks.length, 0)} total tasks
                      {template.isDefault && <span className="text-amber-400 ml-2">(default)</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!template.isDefault && (
                    <button
                      onClick={() => setDefaultTemplate(template.id)}
                      className="p-2 text-amber-400 hover:bg-amber-950/30 rounded-lg transition-colors text-xs"
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="p-2 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">About</h2>
        <div className="space-y-2 text-sm text-slate-400">
          <p><strong className="text-slate-300">Productivito-Meter</strong> — Your personal productivity tracker</p>
          <p>Weeks tracked: {data.weeklyHistory.length}</p>
          <p>Days logged: {Object.keys(data.dailyProgress).length}</p>
          <p>Templates saved: {data.templates.length}</p>
          <p>Rewards set: {data.rewards.length}</p>
        </div>
      </div>

      {/* Finalize Confirmation Modal */}
      {showFinalizeConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setShowFinalizeConfirm(false)}>
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Finalize Week?</h2>
            <p className="text-slate-400 text-sm mb-4">
              This will save a summary of {currentWeekId} to your history. You can still update tasks after finalizing.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleFinalize}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
              >
                Finalize
              </button>
              <button
                onClick={() => setShowFinalizeConfirm(false)}
                className="px-6 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
