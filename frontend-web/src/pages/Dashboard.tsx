import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Footprints,
  Plus,
  TrendingUp,
  Target,
  ArrowUpRight,
  Sun,
  Moon,
  Coffee,
  Apple,
  Camera,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

interface MealItem {
  item_id: number;
  food_id: number;
  food_name: string;
  quantity_grams: number;
  estimated_calories: number;
}

interface MealSummary {
  meal_id: number;
  meal_type: string;
  total_calories: number;
  total_protein_g?: number;
  total_carbs_g?: number;
  total_fat_g?: number;
  logged_at?: string;
  items?: MealItem[];
}

interface DashboardData {
  date: string;
  target_calories: number;
  total_calories: number;
  calories_burned: number;
  remaining_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  steps: number;
  meals: MealSummary[];
}

interface WeeklyData {
  day: string;
  date: string;
  calories: number;
  target: number;
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const formattedDate = currentDate.toLocaleDateString('en-CA');
  const todayFormatted = new Date().toLocaleDateString('en-CA');
  const isToday = formattedDate === todayFormatted;

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const [res, weeklyRes] = await Promise.all([
          axios.get<DashboardData>(`${API_BASE_URL}/api/activity/dashboard?date=${formattedDate}`, { headers }),
          axios.get<WeeklyData[]>(`${API_BASE_URL}/api/activity/weekly?date=${formattedDate}`, { headers }).catch(() => ({ data: [] as WeeklyData[] })),
        ]);
        setData(res.data);
        setWeeklyData(weeklyRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
        setData({
          date: formattedDate,
          target_calories: 2000,
          total_calories: 0,
          calories_burned: 0,
          remaining_calories: 2000,
          total_protein_g: 0,
          total_carbs_g: 0,
          total_fat_g: 0,
          steps: 0,
          meals: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [formattedDate, token]);

  const targetCalories = Number(data?.target_calories ?? 2000);
  const totalCalories = Number(data?.total_calories ?? 0);
  const caloriesBurned = Number(data?.calories_burned ?? 0);
  const remainingCalories = Math.max(0, targetCalories - totalCalories + caloriesBurned);
  const totalProtein = Number(data?.total_protein_g ?? 0);
  const totalCarbs = Number(data?.total_carbs_g ?? 0);
  const totalFat = Number(data?.total_fat_g ?? 0);
  const steps = Number(data?.steps ?? 0);
  const mealsList = data?.meals ?? [];

  // Macro target estimates (roughly 30% protein, 45% carbs, 25% fat of target calories)
  const targetProtein = Math.round((targetCalories * 0.3) / 4);
  const targetCarbs = Math.round((targetCalories * 0.45) / 4);
  const targetFat = Math.round((targetCalories * 0.25) / 9);

  const caloriePct = targetCalories > 0 ? Math.min(Math.round((totalCalories / targetCalories) * 100), 100) : 0;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (caloriePct / 100) * circumference;

  const macroPieData = [
    { name: 'Protein', value: totalProtein * 4 || 1, color: '#10b981' },
    { name: 'Carbs', value: totalCarbs * 4 || 1, color: '#06b6d4' },
    { name: 'Fat', value: totalFat * 9 || 1, color: '#f59e0b' },
  ];

  if (loading && !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 size={36} className="animate-spin text-emerald-400" />
        <span className="text-sm font-semibold">Loading daily nutrition metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Top Hero & Date Navigator ───────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Hello, <span className="gradient-text">{user?.display_name || 'Health Explorer'}</span>
            </h1>
            <span className="text-xl">👋</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Here is your real-time computer vision nutrition summary for today.
          </p>
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={handleToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isToday
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar size={13} />
            <span>
              {isToday
                ? 'Today'
                : currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </button>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Hero Calorie & Macro Matrix ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Calorie Ring Card */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Flame size={18} />
              </div>
              <span className="text-sm font-bold text-slate-300">Daily Calorie Target</span>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {caloriePct}% Filled
            </span>
          </div>

          {/* SVG Calorie Gauge */}
          <div className="relative my-4 flex items-center justify-center">
            <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="12"
                fill="none"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="url(#calorieGradient)"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
              <defs>
                <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>

            {/* Centered Calories Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-4xl font-black text-white tracking-tight">{Math.round(totalCalories)}</span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">kcal logged</span>
            </div>
          </div>

          {/* Calorie Stats Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5 text-center">
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target</span>
              <span className="text-sm font-black text-slate-200 mt-0.5 block">{targetCalories}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Burned</span>
              <span className="text-sm font-black text-amber-400 mt-0.5 block">+{caloriesBurned}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Remaining</span>
              <span className="text-sm font-black text-emerald-400 mt-0.5 block">{remainingCalories}</span>
            </div>
          </div>
        </div>

        {/* Macro Nutrient Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Protein Card */}
          <div className="glass-panel glass-panel-hover rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Protein</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                  {Math.round((totalProtein / (targetProtein || 1)) * 100)}%
                </span>
              </div>
              <div className="text-3xl font-black text-white">{Math.round(totalProtein)}<span className="text-xs text-slate-400 font-bold ml-1">g</span></div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Target: {targetProtein}g</p>
            </div>
            <div className="mt-4">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((totalProtein / (targetProtein || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Carbs Card */}
          <div className="glass-panel glass-panel-hover rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Carbs</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">
                  {Math.round((totalCarbs / (targetCarbs || 1)) * 100)}%
                </span>
              </div>
              <div className="text-3xl font-black text-white">{Math.round(totalCarbs)}<span className="text-xs text-slate-400 font-bold ml-1">g</span></div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Target: {targetCarbs}g</p>
            </div>
            <div className="mt-4">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((totalCarbs / (targetCarbs || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fat Card */}
          <div className="glass-panel glass-panel-hover rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Fats</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                  {Math.round((totalFat / (targetFat || 1)) * 100)}%
                </span>
              </div>
              <div className="text-3xl font-black text-white">{Math.round(totalFat)}<span className="text-xs text-slate-400 font-bold ml-1">g</span></div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Target: {targetFat}g</p>
            </div>
            <div className="mt-4">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((totalFat / (targetFat || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Steps & Activity Combined Widget */}
          <div className="sm:col-span-3 glass-panel rounded-3xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Footprints size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white">{steps.toLocaleString()}</span>
                  <span className="text-xs text-slate-400 font-bold">Steps Today</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Synced with Google Fit & Wear OS</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/activity')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition"
            >
              <span>Activity Log</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Visual Analytics Section (Charts) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Calorie Trends Bar Chart */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">7-Day Calorie Intake</h3>
                <p className="text-[11px] text-slate-400">Daily intake against target threshold</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              <span>Calories (kcal)</span>
            </div>
          </div>

          <div className="h-64 w-full">
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-3 rounded-xl bg-slate-900 border border-white/10 shadow-2xl text-xs">
                            <p className="font-bold text-white">{payload[0].payload.day}</p>
                            <p className="text-cyan-400 font-extrabold mt-1">{payload[0].value} kcal</p>
                            <p className="text-slate-400 text-[10px]">Target: {payload[0].payload.target || 2000} kcal</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="calories"
                    fill="url(#barGradient)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={45}
                  />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-medium">
                Log meals throughout the week to see your historical trend.
              </div>
            )}
          </div>
        </div>

        {/* Macro Proportion Donut Chart */}
        <div className="lg:col-span-4 glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Target size={18} />
              </div>
              <h3 className="text-sm font-bold text-white">Macro Ratio</h3>
            </div>
            <p className="text-[11px] text-slate-400">Caloric distribution from macros</p>
          </div>

          <div className="h-44 my-2 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={macroPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xs font-bold text-slate-400">Split</span>
              <span className="text-base font-black text-white">Macros</span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Protein</span>
              </div>
              <span className="text-slate-300 font-black text-xs block mt-0.5">{Math.round(totalProtein)}g</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center justify-center gap-1.5 text-cyan-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Carbs</span>
              </div>
              <span className="text-slate-300 font-black text-xs block mt-0.5">{Math.round(totalCarbs)}g</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Fats</span>
              </div>
              <span className="text-slate-300 font-black text-xs block mt-0.5">{Math.round(totalFat)}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Meals Stream for Current Date ───────────────────── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Utensils size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Logged Meals for this Day</h3>
              <p className="text-xs text-slate-400">All foods and macro contributions recorded</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/log-meal')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 border border-white/10 transition"
          >
            <Plus size={14} />
            <span>Add Meal</span>
          </button>
        </div>

        {mealsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mealsList.map((meal) => {
              const mealType = meal.meal_type?.toLowerCase() || 'lunch';
              const iconMap: Record<string, React.ReactNode> = {
                breakfast: <Coffee size={16} className="text-amber-400" />,
                lunch: <Sun size={16} className="text-emerald-400" />,
                dinner: <Moon size={16} className="text-blue-400" />,
                snack: <Apple size={16} className="text-purple-400" />,
              };

              return (
                <div
                  key={meal.meal_id}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                        {iconMap[mealType] || <Utensils size={16} className="text-slate-400" />}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-white capitalize">{meal.meal_type}</span>
                        {meal.logged_at && (
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-white">{Math.round(meal.total_calories)}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1">kcal</span>
                    </div>
                  </div>

                  {meal.items && meal.items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {meal.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/5"
                        >
                          {item.food_name} ({item.quantity_grams}g)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Utensils size={24} />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">No meals logged for this date</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Take a snapshot of your food or search our comprehensive food database to track your macros.
            </p>
            <button
              onClick={() => navigate('/log-meal')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:opacity-90 transition"
            >
              <Camera size={14} />
              <span>Log Your First Meal</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
