import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Flame,
  Footprints,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface SyncResponse {
  log_date: string;
  steps: number;
  calories_burned: number;
  total_calories: number;
  remaining_calories: number;
  target_calories: number;
}

export default function Activity() {
  const { token } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [logDate, setLogDate] = useState<string>(todayStr);
  const [steps, setSteps] = useState<string>('6000');
  const [caloriesBurned, setCaloriesBurned] = useState<string>('350');

  const [loading, setLoading] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<SyncResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessResult(null);

    const stepsNum = Number(steps);
    const caloriesNum = Number(caloriesBurned);

    if (isNaN(stepsNum) || stepsNum < 0) {
      setErrorMessage('Please enter a valid non-negative number for steps.');
      return;
    }

    if (isNaN(caloriesNum) || caloriesNum < 0) {
      setErrorMessage('Please enter a valid non-negative number for active calories burned.');
      return;
    }

    if (!logDate) {
      setErrorMessage('Please select a valid date.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post<SyncResponse>(
        `${API_BASE_URL}/api/activity/sync`,
        {
          log_date: logDate,
          steps: Math.floor(stepsNum),
          calories_burned: caloriesNum,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      setSuccessResult(res.data);
    } catch (err: any) {
      console.error('[Activity Sync Error]', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to sync activity data. Please try again.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const addSteps = (amount: number) => {
    const current = Number(steps) || 0;
    setSteps(String(Math.max(0, current + amount)));
  };

  const addCalories = (amount: number) => {
    const current = Number(caloriesBurned) || 0;
    setCaloriesBurned(String(Math.max(0, current + amount)));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame size={20} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Daily Energy & Steps</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
          Sync physical activity metrics to automatically offset and expand your daily caloric target.
        </p>
      </div>

      {/* Success Notification Card */}
      {successResult && (
        <div className="glass-panel rounded-3xl p-6 border-emerald-500/30 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-sm">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span>Activity synced successfully for {successResult.log_date}!</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Remaining Budget</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                {Math.round(successResult.remaining_calories)} <span className="text-xs text-slate-500 font-bold">kcal</span>
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Energy Burned</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                +{Math.round(successResult.calories_burned)} <span className="text-xs text-slate-500 font-bold">kcal</span>
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Steps Logged</span>
              <span className="text-2xl font-black text-cyan-400 mt-1 block">
                {successResult.steps.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              <span>Return to Dashboard</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Date Selector */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
            <Calendar size={14} className="text-emerald-400" />
            <span>Target Date</span>
          </label>
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            required
            className="w-full sm:w-64 px-4 py-2.5 rounded-xl glass-input text-sm font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Steps Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Footprints size={15} className="text-cyan-400" />
              <span>Steps Walked</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 8000"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl glass-input text-lg font-black text-white"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-500 uppercase">steps</span>
            </div>

            {/* Step Presets */}
            <div className="flex gap-2">
              {[1000, 2500, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addSteps(amt)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 border border-white/5 transition flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>{amt.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Calories Burned Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Flame size={15} className="text-amber-400" />
              <span>Active Calories Burned</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 350"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl glass-input text-lg font-black text-white"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-500 uppercase">kcal</span>
            </div>

            {/* Calorie Presets */}
            <div className="flex gap-2">
              {[100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addCalories(amt)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 border border-white/5 transition flex items-center gap-1"
                >
                  <Plus size={12} />
                  <span>{amt} kcal</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap size={14} className="text-emerald-400" />
            <span>Automatically updates remaining calorie budget in real-time</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 transition"
          >
            {loading ? 'Syncing...' : 'Sync Activity Log'}
          </button>
        </div>
      </form>
    </div>
  );
}
