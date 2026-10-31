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
  TrendingUp,
  Sparkles,
  Smartphone,
  Download,
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
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── 1. Hero Section & Oversized Heading ───────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#8ba0a6]">
          <span className="text-emerald-400">✳</span>
          <span>Kinetic Expenditure & TDEE Calibration</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-[1.15]">
          Sync physical activity{' '}
          <span className="text-[#8ba0a6] font-normal">
            to expand your daily calorie target
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-[#8ba0a6] max-w-2xl font-normal pt-1">
          Active energy expenditure offsets food consumption and dynamically adjusts your remaining daily budget in real time.
        </p>
      </div>

      {/* ── 2. Full-Width Horizontal Segmented Control Strip ──── */}
      <div className="w-full bg-[#0b171b] border border-[#18282c] rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#18282c] overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Active Log Date
          </span>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <Calendar size={13} className="text-emerald-400" />
            <span>{logDate}</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Steps Value
          </span>
          <div className="text-xl font-extrabold text-white tabular-num">
            {Number(steps || 0).toLocaleString()}{' '}
            <span className="text-xs font-normal text-[#8ba0a6]">steps</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Caloric Burn
          </span>
          <div className="text-xl font-extrabold text-[#f59e0b] tabular-num">
            +{caloriesBurned}{' '}
            <span className="text-xs font-normal text-[#8ba0a6]">kcal</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Dynamic Expansion
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white">TDEE Dynamic</span>
          </div>
          <span className="text-[11px] text-[#566c73]">Expenditure Engine</span>
        </div>

        <div className="p-3 sm:p-3 flex items-center justify-center bg-[#0e1d22] sm:bg-transparent">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-full min-h-[48px] py-3 px-5 rounded-xl bg-white text-black hover:bg-slate-200 transition-all font-extrabold text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>{loading ? 'Syncing...' : 'Sync Activity'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Card */}
      {successResult && (
        <div className="health-card p-6 bg-[#09221a] border-[#134937] space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-[#34d399] font-bold text-sm">
            <CheckCircle2 size={18} />
            <span>Activity telemetry synced successfully for {successResult.log_date}!</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#081215] border border-[#18282c]">
              <span className="text-[10px] font-bold text-[#8ba0a6] uppercase tracking-wider block">Remaining Daily Budget</span>
              <span className="text-2xl font-black text-[#34d399] tabular-num mt-1 block">
                {Math.round(successResult.remaining_calories)}{' '}
                <span className="text-xs text-[#8ba0a6] font-normal">kcal</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#081215] border border-[#18282c]">
              <span className="text-[10px] font-bold text-[#8ba0a6] uppercase tracking-wider block">Energy Burned</span>
              <span className="text-2xl font-black text-[#f59e0b] tabular-num mt-1 block">
                +{Math.round(successResult.calories_burned)}{' '}
                <span className="text-xs text-[#8ba0a6] font-normal">kcal</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#081215] border border-[#18282c]">
              <span className="text-[10px] font-bold text-[#8ba0a6] uppercase tracking-wider block">Total Steps</span>
              <span className="text-2xl font-black text-white tabular-num mt-1 block">
                {successResult.steps.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#34d399] hover:text-white transition"
            >
              <span>Return to Dashboard</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#281014] border border-[#521c25] text-[#fb7185] text-xs flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── 3. Sidebar-Plus-Main-Content Composition ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Sidebar: Quick Presets & Mechanics ────────── */}
        <aside className="lg:col-span-4 space-y-6">
          {/* ── Native Companion App Download ── */}
          <div className="health-card p-5 bg-gradient-to-b from-[#0e2124] to-[#0b171b] border-emerald-500/30 space-y-3.5 relative overflow-hidden shadow-lg">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Smartphone size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Samsung Health Sync App
                </h3>
                <span className="text-[10px] text-emerald-400 font-semibold">1-Tap Direct APK</span>
              </div>
            </div>

            <p className="text-xs text-[#8ba0a6] leading-relaxed">
              Sync your live steps and calories directly from Samsung Health to this dashboard on demand with 0 background battery drain.
            </p>

            <div className="space-y-2">
              <a
                href="https://github.com/doomsday-the/NutrivisionAI/releases/download/companion-latest/NutriVisionSync.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Download size={14} />
                <span>1. Download Android APK</span>
              </a>

              {token && (
                <a
                  href={`nutrivision://connect?token=${token}`}
                  className="w-full py-2 px-3 rounded-xl bg-[#122b22] hover:bg-[#183a2e] text-[#34d399] border border-[#1b5543] font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <Sparkles size={13} />
                  <span>2. Pair Account to App (1-Tap)</span>
                </a>
              )}
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-[#8ba0a6]">
              <span>Official Health Connect</span>
              <span className="text-emerald-400 font-medium">Android 10+</span>
            </div>
          </div>


          {/* Quick Increment Controls */}
          <div className="health-card p-5 bg-[#0b171b] border-[#18282c] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6]">
              Quick Step Increments
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[1000, 2500, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addSteps(amt)}
                  className="py-2.5 px-3 rounded-xl bg-[#081215] hover:bg-[#122227] text-white border border-[#18282c] text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={12} className="text-emerald-400" />
                  <span>{amt.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="health-card p-5 bg-[#0b171b] border-[#18282c] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6]">
              Quick Burn Increments
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[100, 250, 500].map((cals) => (
                <button
                  key={cals}
                  type="button"
                  onClick={() => addCalories(cals)}
                  className="py-2.5 px-2 rounded-xl bg-[#081215] hover:bg-[#122227] text-[#f59e0b] border border-[#18282c] text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>+{cals}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Educational Note */}
          <div className="health-card p-5 bg-[#0b171b] border-[#18282c] space-y-2 text-xs text-[#8ba0a6]">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
              Metabolic Formula
            </h4>
            <p>
              10,000 steps roughly corresponds to 400–500 active kilocalories burned depending on your basal metabolic rate and body mass.
            </p>
          </div>
        </aside>

        {/* ── Right Main Content Area: Input Form ─────────────── */}
        <section className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="health-card p-6 sm:p-8 bg-[#0b171b] border-[#18282c] space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-[#18282c]">
              Daily Physical Telemetry
            </h3>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8ba0a6] block">
                Date of Activity
              </label>
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#081215] border border-[#18282c] focus-within:border-white/30 text-xs">
                <Calendar size={15} className="text-emerald-400" />
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="bg-transparent text-white font-semibold outline-none cursor-pointer w-full text-xs"
                />
              </div>
            </div>

            {/* Step Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8ba0a6] block">
                Total Steps Taken
              </label>
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#081215] border border-[#18282c] focus-within:border-white/30 text-xs">
                <Footprints size={15} className="text-[#f59e0b]" />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="e.g. 8500"
                  className="bg-transparent text-white font-bold outline-none w-full tabular-num text-sm"
                />
                <span className="text-[#8ba0a6] text-xs">steps</span>
              </div>
            </div>

            {/* Calories Burned */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8ba0a6] block">
                Active Calories Burned
              </label>
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#081215] border border-[#18282c] focus-within:border-white/30 text-xs">
                <Flame size={15} className="text-[#f59e0b]" />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={caloriesBurned}
                  onChange={(e) => setCaloriesBurned(e.target.value)}
                  placeholder="e.g. 420"
                  className="bg-transparent text-white font-bold outline-none w-full tabular-num text-sm"
                />
                <span className="text-[#8ba0a6] text-xs">kcal</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-white text-black hover:bg-slate-200 transition font-black text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-xl disabled:opacity-50"
            >
              <TrendingUp size={16} />
              <span>{loading ? 'Transmitting Physical Telemetry...' : 'Synchronize Energy & Steps'}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
