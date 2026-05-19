'use client';

import { useAppData } from '@/context/DataContext';
import { calculateWeeklyPoints } from '@/lib/utils';
import { Trophy, Gift, Plus, Trash2, Check, Star } from 'lucide-react';
import { useState } from 'react';

export default function Rewards() {
  const { data, currentWeekId, currentSchedule, addReward, claimReward, deleteReward } = useAppData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pointsThreshold, setPointsThreshold] = useState('100');

  const { earned } = calculateWeeklyPoints(currentSchedule, data.dailyProgress, currentWeekId);

  const handleAdd = () => {
    if (!name.trim()) return;
    addReward({
      name: name.trim(),
      description: description.trim(),
      pointsThreshold: parseInt(pointsThreshold) || 100,
    });
    setName('');
    setDescription('');
    setPointsThreshold('100');
    setShowAddForm(false);
  };

  const unclaimedRewards = data.rewards.filter((r) => !r.claimed);
  const claimedRewards = data.rewards.filter((r) => r.claimed);
  const eligibleRewards = unclaimedRewards.filter((r) => earned >= r.pointsThreshold);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Rewards</h1>
          <p className="text-slate-400 mt-1">Motivate yourself with rewards for hitting milestones</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Reward
        </button>
      </div>

      {/* Current Points */}
      <div className="bg-gradient-to-r from-violet-900/40 to-purple-900/30 border border-violet-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-violet-400" />
            <div>
              <p className="text-sm text-violet-300">Your Weekly Points</p>
              <p className="text-3xl font-bold text-white">{earned} pts</p>
            </div>
          </div>
          {eligibleRewards.length > 0 && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-2">
              <p className="text-emerald-300 font-medium text-sm">
                {eligibleRewards.length} reward{eligibleRewards.length > 1 ? 's' : ''} available!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Available Rewards */}
      {unclaimedRewards.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" /> Available Rewards
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {unclaimedRewards.map((reward) => {
              const eligible = earned >= reward.pointsThreshold;
              const progress = Math.min((earned / reward.pointsThreshold) * 100, 100);
              return (
                <div
                  key={reward.id}
                  className={`bg-card border rounded-2xl p-5 transition-all ${
                    eligible
                      ? 'border-emerald-500/40 pulse-glow'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{reward.name}</h3>
                      {reward.description && (
                        <p className="text-slate-400 text-sm mt-1">{reward.description}</p>
                      )}
                      <p className="text-sm mt-2">
                        <span className="text-slate-500">Requires: </span>
                        <span className={eligible ? 'text-emerald-400 font-medium' : 'text-slate-300'}>
                          {reward.pointsThreshold} pts
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {eligible && (
                        <button
                          onClick={() => claimReward(reward.id, currentWeekId)}
                          className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                          title="Claim reward"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteReward(reward.id)}
                        className="p-2 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        eligible ? 'bg-emerald-500' : 'bg-violet-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {earned} / {reward.pointsThreshold} pts ({Math.round(progress)}%)
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {unclaimedRewards.length === 0 && claimedRewards.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 mt-4 text-lg">No rewards set yet</p>
          <p className="text-slate-500 text-sm mt-1">Add a reward to motivate yourself — a dish, gadget, outing, anything!</p>
        </div>
      )}

      {/* Claimed Rewards */}
      {claimedRewards.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" /> Claimed Rewards
          </h2>
          <div className="space-y-2">
            {claimedRewards.map((reward) => (
              <div key={reward.id} className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-white font-medium">{reward.name}</p>
                    <p className="text-xs text-slate-400">Claimed in {reward.claimedWeekId}</p>
                  </div>
                </div>
                <span className="text-sm text-emerald-400">{reward.pointsThreshold} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Reward Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Add Reward</h2>
            <div className="space-y-4" onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Reward Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Ice cream sundae, New headphones"
                  className="w-full bg-slate-800 border border-border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why this reward matters to you"
                  className="w-full bg-slate-800 border border-border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Points Threshold</label>
                <input
                  type="number"
                  value={pointsThreshold}
                  onChange={(e) => setPointsThreshold(e.target.value)}
                  min="1"
                  className="w-full bg-slate-800 border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                />
                <p className="text-xs text-slate-500 mt-1">Earn this many weekly points to unlock</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
                >
                  Add Reward
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
    </div>
  );
}
