import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Scale,
  Ruler,
  Compass,
  Loader2,
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
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-stone-500">
        <Loader2 size={36} className="animate-spin text-emerald-600" />
        <span className="text-sm font-semibold">Loading physiological profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
            <User size={20} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">Biometrics & Caloric Goals</h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
          Personalize your basal metabolic rate and daily calorie targets based on your physiological profile.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-7 space-y-5 bg-white border border-stone-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">Physical Parameters</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-600 block mb-1.5 flex items-center gap-1.5">
                <Compass size={13} className="text-stone-400" />
                <span>Age (Years)</span>
              </label>
              <input
                type="number"
                min="10"
                max="120"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-600 block mb-1.5 flex items-center gap-1.5">
                <Ruler size={13} className="text-stone-400" />
                <span>Height (cm)</span>
              </label>
              <input
                type="number"
                min="50"
                max="260"
                placeholder="175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-600 block mb-1.5 flex items-center gap-1.5">
                <Scale size={13} className="text-stone-400" />
                <span>Weight (kg)</span>
              </label>
              <input
                type="number"
                min="20"
                max="350"
                placeholder="70"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-bold"
              />
            </div>
          </div>

          {/* Activity Level Selector */}
          <div>
            <label className="text-xs font-bold text-stone-600 block mb-1.5">Lifestyle Activity Level</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-medium cursor-pointer"
            >
              <option value="sedentary">Sedentary (desk job, minimal exercise)</option>
              <option value="light">Lightly Active (1-3 workouts / week)</option>
              <option value="moderate">Moderately Active (3-5 workouts / week)</option>
              <option value="active">Very Active (6-7 intense workouts / week)</option>
              <option value="very_active">Extremely Active (Athletic training)</option>
            </select>
          </div>

          {/* Primary Fitness Goal */}
          <div>
            <label className="text-xs font-bold text-stone-600 block mb-1.5">Primary Nutrition Goal</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'lose', label: 'Weight Loss', desc: '-400 kcal deficit' },
                { val: 'maintain', label: 'Maintain', desc: 'Equilibrium' },
                { val: 'gain', label: 'Muscle Gain', desc: '+350 kcal surplus' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setGoal(item.val)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    goal === item.val
                      ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-md shadow-emerald-700/15 hover:from-emerald-500 hover:to-teal-500 transition flex items-center gap-2"
            >
              <Save size={14} />
              <span>{saving ? 'Updating...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>

        {/* Calculated TDEE & Target Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between bg-white border border-stone-200 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Target Estimate</span>
                <Sparkles size={16} className="text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Daily Recommended Budget</h3>
              <p className="text-xs text-stone-500 mt-1">
                Calculated via scientific Mifflin-St Jeor TDEE equation.
              </p>
            </div>

            <div className="my-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
              <span className="text-4xl font-black text-emerald-700">
                {estimatedTarget ?? userData?.profile?.daily_calorie_target ?? 2000}
              </span>
              <span className="text-xs text-stone-500 font-bold ml-1 uppercase">kcal / day</span>
              <span className="text-[11px] text-stone-400 block mt-1 font-medium">
                {goal === 'lose' ? 'Calorie Deficit Active' : goal === 'gain' ? 'Hypertrophy Surplus' : 'Maintenance'}
              </span>
            </div>

            {/* Estimated Macro Targets */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Recommended Macro Split</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-rose-700 font-bold block">Protein</span>
                  <span className="font-black text-stone-800 mt-0.5 block">
                    {Math.round(((estimatedTarget ?? 2000) * 0.3) / 4)}g
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-amber-800 font-bold block">Carbs</span>
                  <span className="font-black text-stone-800 mt-0.5 block">
                    {Math.round(((estimatedTarget ?? 2000) * 0.45) / 4)}g
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] text-emerald-800 font-bold block">Fats</span>
                  <span className="font-black text-stone-800 mt-0.5 block">
                    {Math.round(((estimatedTarget ?? 2000) * 0.25) / 9)}g
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
