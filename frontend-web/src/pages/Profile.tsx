import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Target, Save, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
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

  // Fetch current user and profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get<UserProfileResponse>(`${API_BASE_URL}/api/profile`);
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
  }, []);

  // Compute live estimate based on Mifflin-St Jeor formula
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
    if (goal === 'lose') return Math.round(tdee - 300);
    if (goal === 'gain') return Math.round(tdee + 300);
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

      const res = await axios.put<UserProfileResponse>(`${API_BASE_URL}/api/profile`, payload);
      setUserData(res.data);
      setSuccessMessage('Health profile & calorie target updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500 font-medium">Loading profile settings...</div>;
  }

  const currentTarget = userData?.profile?.daily_calorie_target || 2000;

  return (
    <div className="profile-page max-w-4xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-6">
        <img
          src={userData?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'}
          alt="Avatar"
          className="w-20 h-20 rounded-full border-2 border-primary-500 p-1 shadow"
        />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{userData?.display_name || 'User Profile'}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 uppercase tracking-wide">
              {userData?.role || 'user'}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">{userData?.email}</p>
        </div>

        {/* Current Target Card */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-center min-w-[160px]">
          <div className="text-xs font-bold uppercase text-primary-600 tracking-wider flex items-center justify-center gap-1">
            <Target size={14} /> Active Target
          </div>
          <div className="text-3xl font-extrabold text-primary-700 mt-1">
            {currentTarget}
            <span className="text-sm font-normal text-primary-600 ml-1">kcal</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-500" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} className="text-red-500" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-6">
          <Activity className="text-primary-600" size={22} />
          <h2 className="text-xl font-bold text-gray-800">Health & Target Configuration</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 25"
                className="profile-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input
                type="number"
                min="50"
                max="300"
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 175"
                className="profile-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                min="20"
                max="500"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 70"
                className="profile-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Activity Level & Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="profile-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="sedentary">Sedentary (little to no exercise)</option>
                <option value="light">Lightly Active (1–3 days/week)</option>
                <option value="moderate">Moderately Active (3–5 days/week)</option>
                <option value="active">Active (6–7 days/week)</option>
                <option value="very_active">Very Active (intense training)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="lose">Weight Loss (-300 kcal/day)</option>
                <option value="maintain">Maintenance (balanced TDEE)</option>
                <option value="gain">Weight Gain (+300 kcal/day)</option>
              </select>
            </div>
          </div>

          {/* Live Dynamic Calculator Preview */}
          {estimatedTarget !== null && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="text-amber-500" size={24} />
                <div>
                  <div className="text-sm font-semibold text-gray-800">Mifflin-St Jeor TDEE Preview</div>
                  <div className="text-xs text-gray-500">Calculated based on your current inputs above</div>
                </div>
              </div>
              <div className="text-xl font-bold text-primary-700">
                ~{estimatedTarget} kcal <span className="text-xs font-normal text-gray-500">/ day</span>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              <Save size={18} />
              {saving ? 'Calculating & Saving...' : 'Save Health Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
