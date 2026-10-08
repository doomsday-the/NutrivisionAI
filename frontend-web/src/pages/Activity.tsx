import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Activity as ActivityIcon, Flame, Footprints, CheckCircle2, AlertCircle, ArrowRight, Plus, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const activityOptions = [
  { value: 'gym', label: 'Gym' },
  { value: 'running', label: 'Running' },
  { value: 'jogging', label: 'Jogging' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'football', label: 'Football' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'walking', label: 'Walking' },
  { value: 'other', label: 'Other' },
] as const;

type ActivityType = (typeof activityOptions)[number]['value'];

interface SyncResponse {
  log_date: string;
  activity_logged_at: string;
  steps: number;
  calories_burned: number;
  sleep_calories: number;
  total_calories: number;
  remaining_calories: number;
  target_calories: number;
}

interface ActivityDashboardResponse {
  date: string;
  steps: number;
  calories_burned: number;
  activity_types: ActivityType[];
  sleep_hours: number | null;
  sleep_calories: number;
  sleep_calories_confirmed: boolean;
  has_activity_log: boolean;
}

interface ProfileResponse {
  profile?: {
    age?: number | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    daily_steps_target?: number;
  } | null;
}

interface SleepEstimateResponse {
  estimated_calories: number;
}

interface SleepEstimateState {
  hours: number;
  calories: number | null;
  loading: boolean;
  error: string;
}

export default function Activity() {
  const { token } = useAuth();

  const [steps, setSteps] = useState<string>('5000');
  const [caloriesBurned, setCaloriesBurned] = useState<string>('300');
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [sleepHours, setSleepHours] = useState<string>('');
  const [includeSleepCalories, setIncludeSleepCalories] = useState<boolean>(false);
  const [age, setAge] = useState<number | null>(null);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [stepsTarget, setStepsTarget] = useState<number | null>(null);
  const [sleepEstimate, setSleepEstimate] = useState<SleepEstimateState>({
    hours: -1,
    calories: null,
    loading: false,
    error: '',
  });
  const [loadingDay, setLoadingDay] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [savingSleep, setSavingSleep] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<SyncResponse | null>(null);
  const [successKind, setSuccessKind] = useState<'activity' | 'sleep'>('activity');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isCurrentRequest = true;
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    const loadDay = async () => {
      setLoadingDay(true);
      try {
        const [activityResponse, profileResponse] = await Promise.all([
          axios.get<ActivityDashboardResponse>(
            `${API_BASE_URL}/api/activity/dashboard`,
            { headers },
          ),
          axios.get<ProfileResponse>(`${API_BASE_URL}/api/profile`, { headers }),
        ]);

        if (!isCurrentRequest) return;

        const day = activityResponse.data;
        setSteps(String(day.has_activity_log ? day.steps : 5000));
        setCaloriesBurned(String(day.has_activity_log
          ? Math.max(0, day.calories_burned - day.sleep_calories)
          : 300));
        setActivityTypes(day.activity_types ?? []);
        setSleepHours(day.sleep_hours == null ? '' : String(day.sleep_hours));
        setIncludeSleepCalories(day.sleep_calories_confirmed ?? false);
        setAge(profileResponse.data.profile?.age ?? null);
        setHeightCm(profileResponse.data.profile?.height_cm ?? null);
        setWeightKg(profileResponse.data.profile?.weight_kg ?? null);
        setStepsTarget(profileResponse.data.profile?.daily_steps_target ?? null);
      } catch (err: any) {
        if (!isCurrentRequest) return;
        console.error('[Activity Load Error]', err);
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to load today’s activity data.';
        setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } finally {
        if (isCurrentRequest) setLoadingDay(false);
      }
    };

    loadDay();
    return () => {
      isCurrentRequest = false;
    };
  }, [token]);

  const sleepHoursNumber = sleepHours.trim() === '' ? null : Number(sleepHours);
  const hasRequiredProfile = age !== null && heightCm !== null && weightKg !== null;
  const canEstimateSleep = hasRequiredProfile
    && sleepHoursNumber !== null
    && Number.isFinite(sleepHoursNumber)
    && sleepHoursNumber >= 0.25
    && sleepHoursNumber <= 24;
  const currentSleepEstimate = sleepEstimate.hours === sleepHoursNumber && canEstimateSleep
    ? sleepEstimate
    : null;
  const estimatedSleepCalories = currentSleepEstimate?.calories ?? null;
  const loadingSleepEstimate = currentSleepEstimate?.loading ?? false;
  const sleepEstimateError = currentSleepEstimate?.error ?? '';

  useEffect(() => {
    let isCurrentRequest = true;
    if (!hasRequiredProfile
      || sleepHoursNumber === null
      || !Number.isFinite(sleepHoursNumber)
      || sleepHoursNumber < 0.25
      || sleepHoursNumber > 24
      || !token) return;

    const hours = sleepHoursNumber;
    const timer = window.setTimeout(() => {
      setSleepEstimate({ hours, calories: null, loading: true, error: '' });
      void axios.post<SleepEstimateResponse>(
        `${API_BASE_URL}/api/activity/sleep/estimate`,
        { sleep_hours: hours },
        { headers: { Authorization: `Bearer ${token}` } },
      ).then((response) => {
        if (isCurrentRequest) {
          setSleepEstimate({
            hours,
            calories: response.data.estimated_calories,
            loading: false,
            error: '',
          });
        }
      }).catch((err: any) => {
        if (!isCurrentRequest) return;
        console.error('[Sleep Activity Estimate Error]', err);
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to estimate sleep calories. Please try again.';
        setSleepEstimate({
          hours,
          calories: null,
          loading: false,
          error: typeof msg === 'string' ? msg : JSON.stringify(msg),
        });
      });
    }, 250);

    return () => {
      isCurrentRequest = false;
      window.clearTimeout(timer);
    };
  }, [hasRequiredProfile, sleepHoursNumber, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessResult(null);
    setSuccessKind('activity');

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

    try {
      setLoading(true);
      const res = await axios.post<SyncResponse>(
        `${API_BASE_URL}/api/activity/sync`,
        {
          steps: Math.floor(stepsNum),
          calories_burned: caloriesNum,
          activity_types: activityTypes,
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

  const handleSleepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessResult(null);
    setSuccessKind('sleep');

    const enteredSleepHours = sleepHours.trim() === '' ? null : Number(sleepHours);
    if (enteredSleepHours === null
      || !Number.isFinite(enteredSleepHours)
      || enteredSleepHours < 0.25
      || enteredSleepHours > 24) {
      setErrorMessage('Enter sleep hours between 0.25 and 24.');
      return;
    }

    if (!hasRequiredProfile) {
      setErrorMessage('Add your age, height, and weight to your profile before estimating sleep calories.');
      return;
    }

    if (!includeSleepCalories) {
      setErrorMessage('Please confirm before adding the sleep-calorie estimate to today’s total.');
      return;
    }

    if (estimatedSleepCalories === null || loadingSleepEstimate) {
      setErrorMessage('Wait for the sleep-calorie estimate before saving.');
      return;
    }

    try {
      setSavingSleep(true);
      const res = await axios.post<SyncResponse>(
        `${API_BASE_URL}/api/activity/sleep`,
        {
          sleep_hours: enteredSleepHours,
          include_sleep_calories: true,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      setSuccessResult(res.data);
      setSleepEstimate({
        hours: enteredSleepHours,
        calories: res.data.sleep_calories,
        loading: false,
        error: '',
      });
      setIncludeSleepCalories(true);
    } catch (err: any) {
      console.error('[Sleep Activity Save Error]', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to save sleep activity. Please try again.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSavingSleep(false);
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

  const toggleActivityType = (activityType: ActivityType) => {
    setActivityTypes((current) => current.includes(activityType)
      ? current.filter((type) => type !== activityType)
      : [...current, activityType]);
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
            Log today’s steps and activity. The date and save time are recorded automatically.
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {successResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="text-emerald-600" size={20} />
            <span>
              {successKind === 'sleep' ? 'Sleep activity saved' : 'Activity logged'} at {new Date(successResult.activity_logged_at).toLocaleString()}.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
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
              <span className="text-xs text-gray-500 uppercase font-bold">Sleep Estimate</span>
              <div className="text-2xl font-extrabold text-indigo-600">
                +{Math.round(successResult.sleep_calories)} <span className="text-sm font-normal text-gray-500">kcal</span>
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
        <p className="text-sm font-medium text-gray-600">
          Logging for today, {new Date().toLocaleDateString()}.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Steps Input */}
          <div className="space-y-2">
            <div>
              <label htmlFor="activity-steps" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Footprints size={16} className="text-blue-500" />
                Steps Walked
              </label>
              {stepsTarget !== null && (
                <p className="mt-1 text-xs text-gray-500">Daily target: {stepsTarget.toLocaleString()} steps</p>
              )}
            </div>
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

        <div className="space-y-2">
          <div>
            <span className="block text-sm font-semibold text-gray-700">Activity type <span className="font-normal text-gray-500">(optional)</span></span>
            <p className="text-xs text-gray-500 mt-1">Choose any activities you did; calories below remain your daily total.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activityOptions.map(({ value, label }) => {
              const selected = activityTypes.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleActivityType(value)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${
                    selected
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {loadingDay
              ? 'Loading today’s activity…'
              : 'Activity calories increase your daily remaining calorie allowance.'}
          </p>
          <button
            type="submit"
            disabled={loading || loadingDay}
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

      <form onSubmit={handleSleepSubmit} className="rounded-xl border border-indigo-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
            <Moon size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Sleep activity</h2>
            <p className="text-sm text-gray-600">
              Enter last night’s sleep and review the estimate before saving.
            </p>
          </div>
        </div>

        <div className="relative max-w-xs">
          <label htmlFor="sleep-hours" className="mb-1.5 block text-sm font-semibold text-gray-700">
            Hours slept
          </label>
          <input
            id="sleep-hours"
            type="number"
            min="0.25"
            max="24"
            step="0.25"
            placeholder="e.g. 8"
            value={sleepHours}
            onChange={(event) => {
              setSleepHours(event.target.value);
              setIncludeSleepCalories(false);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-16 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="absolute right-3.5 top-[2.65rem] text-sm font-medium text-gray-400">hours</span>
        </div>

        {!hasRequiredProfile && (
          <p className="text-sm text-amber-700">
            Complete your age, height, and weight in <Link to="/profile" className="font-semibold underline">Profile</Link> to see the estimate.
          </p>
        )}
        {loadingSleepEstimate && <p className="text-sm text-gray-500">Calculating estimate…</p>}
        {sleepEstimateError && <p className="text-sm text-rose-700">{sleepEstimateError}</p>}
        {estimatedSleepCalories !== null && (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm text-indigo-800">Estimated calories this sleep entry will add:</p>
            <p className="mt-1 text-2xl font-extrabold text-indigo-900">
              +{estimatedSleepCalories.toLocaleString(undefined, { maximumFractionDigits: 2 })} kcal
            </p>
          </div>
        )}

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeSleepCalories}
            onChange={(event) => setIncludeSleepCalories(event.target.checked)}
            disabled={!hasRequiredProfile || estimatedSleepCalories === null}
            className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span>I agree to add this estimated amount to calories burned and my remaining calorie budget for today.</span>
        </label>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500">Sleep calories are saved only after you confirm.</p>
          <button
            type="submit"
            disabled={loadingDay || savingSleep || loadingSleepEstimate || !hasRequiredProfile || estimatedSleepCalories === null || !includeSleepCalories}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {savingSleep ? 'Saving sleep…' : 'Save Sleep Activity'}
          </button>
        </div>
      </form>
    </div>
  );
}
