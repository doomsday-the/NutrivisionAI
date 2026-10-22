import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  Target,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface ProfileData {
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  activity_level?: string;
  goal?: string;
  daily_calorie_target?: number;
}

interface UserProfileResponse {
  user_id: number;
  email: string;
  display_name: string;
  avatar_url?: string;
  role?: string;
  profile?: ProfileData | null;
}

export default function Profile() {
  const { token } = useAuth();
  const [userData, setUserData] = useState<UserProfileResponse | null>(null);
  const [age, setAge] = useState<number | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  const [goal, setGoal] = useState<string>('maintain');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get<UserProfileResponse>(`${API_BASE_URL}/api/profile`, {
          headers: authHeaders,
        });
        setUserData(res.data);
        if (res.data.profile) {
          setAge(res.data.profile.age ?? '');
          setHeightCm(res.data.profile.height_cm ?? '');
          setWeightKg(res.data.profile.weight_kg ?? '');
          if (res.data.profile.activity_level) setActivityLevel(res.data.profile.activity_level);
          if (res.data.profile.goal) setGoal(res.data.profile.goal);
        }
      } catch (err: any) {
        setErrorMessage(err.response?.data?.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  // Mifflin-St Jeor TDEE formula
  const computeEstimatedTarget = (): number | null => {
    const a = typeof age === 'number' ? age : Number(age);
    const h = typeof heightCm === 'number' ? heightCm : Number(heightCm);
    const w = typeof weightKg === 'number' ? weightKg : Number(weightKg);

    if (!a || !h || !w || a <= 0 || h <= 0 || w <= 0) return null;

    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = bmr * (multipliers[activityLevel] || 1.2);
    if (goal === 'lose') return Math.round(tdee - 400);
    if (goal === 'gain') return Math.round(tdee + 350);
    return Math.round(tdee);
  };

  const estimatedTarget = computeEstimatedTarget();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = {
        age: age === '' ? undefined : Number(age),
        height_cm: heightCm === '' ? undefined : Number(heightCm),
        weight_kg: weightKg === '' ? undefined : Number(weightKg),
        activity_level: activityLevel,
        goal: goal,
      };

      const res = await axios.put(`${API_BASE_URL}/api/profile`, payload, {
        headers: authHeaders,
      });

      setUserData(res.data);
      setSuccessMessage('Profile and daily nutrition targets saved successfully!');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !userData) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3 text-[#8ba0a6]">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
        <span className="text-xs font-semibold text-white">Loading physiological profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── 1. Hero Section & Oversized Heading ───────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#8ba0a6]">
          <span className="text-emerald-400">✳</span>
          <span>Biometric Profile & Targets</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-[1.15]">
          Configure your physiological metrics{' '}
          <span className="text-[#8ba0a6] font-normal">
            and daily caloric goals
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-[#8ba0a6] max-w-2xl font-normal pt-1">
          Clinical Mifflin-St Jeor metabolic calibration personalized to your age, body composition, and exercise habits.
        </p>
      </div>

      {/* ── 2. Full-Width Horizontal Segmented Control Strip ──── */}
      <div className="w-full bg-[#0b171b] border border-[#18282c] rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#18282c] overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Computed Caloric Target
          </span>
          <div className="text-2xl font-black text-white tabular-num">
            {estimatedTarget || userData?.profile?.daily_calorie_target || 2000}{' '}
            <span className="text-xs font-normal text-[#8ba0a6]">kcal</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Target Trajectory
          </span>
          <div className="text-base font-extrabold text-[#f59e0b] capitalize">
            {goal === 'lose' ? 'Fat Loss (-400)' : goal === 'gain' ? 'Muscle Gain (+350)' : 'Maintenance (0)'}
          </div>
          <span className="text-[11px] text-[#566c73]">Selected Goal</span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Activity Tier
          </span>
          <div className="text-base font-bold text-white capitalize">
            {activityLevel.replace('_', ' ')}
          </div>
          <span className="text-[11px] text-[#566c73]">Multiplier</span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Biometrics
          </span>
          <div className="text-xs font-bold text-white">
            {heightCm ? `${heightCm} cm` : '—'} • {weightKg ? `${weightKg} kg` : '—'}
          </div>
          <span className="text-[11px] text-[#566c73]">Age: {age || '—'} yrs</span>
        </div>

        <div className="p-3 sm:p-3 flex items-center justify-center bg-[#0e1d22] sm:bg-transparent">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-full min-h-[48px] py-3 px-5 rounded-xl bg-white text-black hover:bg-slate-200 transition-all font-extrabold text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>{saving ? 'Saving...' : 'Save Biometrics'}</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#09221a] border border-[#134937] text-[#34d399] text-xs flex items-center gap-2.5">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMessage}</span>
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
        {/* ── Left Sidebar: Goal & Activity Quick Selectors ──── */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Goal Selector */}
          <div className="health-card p-5 bg-[#0b171b] border-[#18282c] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6]">
              Select Metabolic Goal
            </h3>
            <div className="space-y-2">
              {[
                { id: 'lose', label: 'Fat Loss', sub: '-400 kcal deficit' },
                { id: 'maintain', label: 'Maintenance', sub: 'Equilibrium TDEE' },
                { id: 'gain', label: 'Muscle Gain', sub: '+350 kcal surplus' },
              ].map((g) => {
                const isSelected = goal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={`w-full p-3 rounded-xl border transition text-left flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black font-extrabold border-white shadow-xs'
                        : 'bg-[#081215] text-[#8ba0a6] hover:text-white border-[#18282c]'
                    }`}
                  >
                    <div>
                      <span className="text-xs block font-bold">{g.label}</span>
                      <span className="text-[10px] opacity-75">{g.sub}</span>
                    </div>
                    {isSelected && <CheckCircle2 size={14} className="text-black" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Multiplier */}
          <div className="health-card p-5 bg-[#0b171b] border-[#18282c] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6]">
              Lifestyle Physicality
            </h3>
            <div className="space-y-1.5">
              {[
                { id: 'sedentary', label: 'Sedentary', sub: 'Little or no exercise' },
                { id: 'light', label: 'Lightly Active', sub: 'Exercise 1-3 days/week' },
                { id: 'moderate', label: 'Moderately Active', sub: 'Exercise 3-5 days/week' },
                { id: 'active', label: 'Very Active', sub: 'Hard exercise 6-7 days/week' },
                { id: 'very_active', label: 'Extremely Active', sub: 'Athlete or physical job' },
              ].map((lvl) => {
                const isSelected = activityLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setActivityLevel(lvl.id)}
                    className={`w-full p-2.5 rounded-xl border transition text-left flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-400 text-black font-extrabold border-emerald-400'
                        : 'bg-[#081215] text-[#8ba0a6] hover:text-white border-[#18282c]'
                    }`}
                  >
                    <div>
                      <span className="text-xs block font-bold">{lvl.label}</span>
                      <span className="text-[10px] opacity-75">{lvl.sub}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Right Main Content Area: Biometric Inputs ───────── */}
        <section className="lg:col-span-8">
          <form onSubmit={handleSave} className="health-card p-6 sm:p-8 bg-[#0b171b] border-[#18282c] space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-[#18282c]">
              Physiological Metrics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Age */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8ba0a6] block">Age (Years)</label>
                <div className="p-3 rounded-xl bg-[#081215] border border-[#18282c] focus-within:border-white/30 text-xs">
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 28"
                    className="w-full bg-transparent text-white font-bold text-sm outline-none tabular-num"
                  />
                </div>
              </div>

              {/* Height */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8ba0a6] block">Height (cm)</label>
                <div className="p-3 rounded-xl bg-[#081215] border border-[#18282c] focus-within:border-white/30 text-xs flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    max="250"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 175"
                    className="w-full bg-transparent text-white font-bold text-sm outline-none tabular-num"
                  />
                  <span className="text-[#8ba0a6] text-xs">cm</span>
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8ba0a6] block">Weight (kg)</label>
                <div className="p-3 rounded-xl bg-[#081215] border border-[#18282c] focus-within:border-white/30 text-xs flex items-center gap-2">
                  <input
                    type="number"
                    min="20"
                    max="300"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 70"
                    className="w-full bg-transparent text-white font-bold text-sm outline-none tabular-num"
                  />
                  <span className="text-[#8ba0a6] text-xs">kg</span>
                </div>
              </div>
            </div>

            {/* Live TDEE Projection Box */}
            <div className="p-5 rounded-xl bg-[#081215] border border-[#18282c] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                  Calculated Target Output
                </span>
                <h4 className="text-base font-bold text-white">
                  Mifflin-St Jeor Daily TDEE
                </h4>
                <p className="text-xs text-[#8ba0a6] mt-0.5">
                  Updates your daily calorie gauge on the dashboard automatically.
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black text-white tabular-num">
                  {estimatedTarget || '—'}
                </span>
                <span className="text-xs font-bold text-[#8ba0a6] ml-1">kcal/day</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 px-6 rounded-xl bg-white text-black hover:bg-slate-200 transition font-black text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-xl disabled:opacity-50"
            >
              <Target size={16} />
              <span>{saving ? 'Updating Biometric Calibration...' : 'Save Biometrics & Update Targets'}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
