import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Activity as ActivityIcon, Flame, Footprints, Calendar, CheckCircle2, AlertCircle, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const [steps, setSteps] = useState<string>('5000');
  const [caloriesBurned, setCaloriesBurned] = useState<string>('300');

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
        'http://localhost:3000/api/activity/sync',
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
          <ActivityIcon size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity & Energy Expenditure</h1>
          <p className="text-gray-500 text-sm">
            Log your steps and active energy burned to keep your daily calorie budget accurate.
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {successResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="text-emerald-600" size={20} />
            <span>Activity logged successfully for {successResult.log_date}!</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-white p-3 rounded-lg border border-emerald-100">
              <span className="text-xs text-gray-500 uppercase font-bold">Remaining Budget</span>
              <div className="text-2xl font-extrabold text-emerald-600">
                {Math.round(successResult.remaining_calories)} <span className="text-sm font-normal text-gray-500">kcal</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-emerald-100">
              <span className="text-xs text-gray-500 uppercase font-bold">Calories Burned</span>
              <div className="text-2xl font-extrabold text-orange-600">
                +{Math.round(successResult.calories_burned)} <span className="text-sm font-normal text-gray-500">kcal</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-emerald-100">
              <span className="text-xs text-gray-500 uppercase font-bold">Daily Steps</span>
              <div className="text-2xl font-extrabold text-blue-600">
                {successResult.steps.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 underline"
            >
              Go to Dashboard <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="text-rose-500 mt-0.5 shrink-0" size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Activity Input Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Date Selector */}
        <div>
          <label htmlFor="activity-date" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            Log Date
          </label>
          <input
            id="activity-date"
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            required
            className="w-full sm:w-64 px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Steps Input */}
          <div className="space-y-2">
            <label htmlFor="activity-steps" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Footprints size={16} className="text-blue-500" />
              Steps Walked
            </label>
            <div className="relative">
              <input
                id="activity-steps"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 8000"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 text-lg font-semibold"
              />
              <span className="absolute right-3.5 top-3 text-sm text-gray-400 font-medium">steps</span>
            </div>

            {/* Quick step presets */}
            <div className="flex gap-2 pt-1">
              {[1000, 2500, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addSteps(amt)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1 transition"
                >
                  <Plus size={12} /> {amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Calories Burned Input */}
          <div className="space-y-2">
            <label htmlFor="activity-calories" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Flame size={16} className="text-orange-500" />
              Active Calories Burned
            </label>
            <div className="relative">
              <input
                id="activity-calories"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 450"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 text-lg font-semibold"
              />
              <span className="absolute right-3.5 top-3 text-sm text-gray-400 font-medium">kcal</span>
            </div>

            {/* Quick calorie presets */}
            <div className="flex gap-2 pt-1">
              {[100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addCalories(amt)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1 transition"
                >
                  <Plus size={12} /> {amt} kcal
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Active calories increase your daily remaining calorie allowance.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 transition shadow-sm flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <span>Save & Sync Activity</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
