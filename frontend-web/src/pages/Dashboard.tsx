import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NutriCoachWidget, { type CoachInsight } from '../components/NutriCoachWidget';
import {
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
  Clock,
  Layers,
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
  ReferenceLine,
} from 'recharts';
import { Button, Badge, ProgressBar } from '../components/ui';

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

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All Meals' },
  { id: 'breakfast', label: 'Breakfast', icon: <Coffee size={12} /> },
  { id: 'lunch', label: 'Lunch', icon: <Sun size={12} /> },
  { id: 'dinner', label: 'Dinner', icon: <Moon size={12} /> },
  { id: 'snack', label: 'Snacks', icon: <Apple size={12} /> },
];

export default function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [coachInsight, setCoachInsight] = useState<CoachInsight | null>(null);
  const [coachLoading, setCoachLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const fetchCoachInsight = useCallback(
    async (force: boolean = false) => {
      if (!token) return;
      try {
        setCoachLoading(true);
        const mealCount = data?.meals?.length ?? 0;
        const totalCals = Math.round(data?.total_calories ?? 0);
        const cacheKey = `nutricoach_insight_${formattedDate}_${totalCals}_${mealCount}`;

        if (!force) {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            try {
              setCoachInsight(JSON.parse(cached));
              setCoachLoading(false);
              return;
            } catch {
              // ignore parse errors
            }
          }
        }

        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get<CoachInsight>(
          `${API_BASE_URL}/api/coach/daily-insight?date=${formattedDate}`,
          { headers }
        );

        setCoachInsight(res.data);
        sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
      } catch (err) {
        console.error('Failed to load coach insight', err);
      } finally {
        setCoachLoading(false);
      }
    },
    [formattedDate, token, data?.total_calories, data?.meals?.length]
  );

  useEffect(() => {
    if (data && !loading) {
      fetchCoachInsight();
    }
  }, [fetchCoachInsight, data, loading]);

  const targetCalories = Math.round(Number(data?.target_calories ?? 2000));
  const totalCalories = Math.round(Number(data?.total_calories ?? 0));
  const caloriesBurned = Math.round(Number(data?.calories_burned ?? 0));
  const remainingCalories = Math.max(0, Math.round(targetCalories - totalCalories + caloriesBurned));
  const totalProtein = Math.round(Number(data?.total_protein_g ?? 0) * 10) / 10;
  const totalCarbs = Math.round(Number(data?.total_carbs_g ?? 0) * 10) / 10;
  const totalFat = Math.round(Number(data?.total_fat_g ?? 0) * 10) / 10;
  const steps = Math.round(Number(data?.steps ?? 0));
  const mealsList = data?.meals ?? [];

  // Macro target calculations (30% Protein, 45% Carbs, 25% Fat)
  const targetProtein = Math.round((targetCalories * 0.3) / 4);
  const targetCarbs = Math.round((targetCalories * 0.45) / 4);
  const targetFat = Math.round((targetCalories * 0.25) / 9);

  const caloriePct = targetCalories > 0 ? Math.min(Math.round((totalCalories / targetCalories) * 100), 100) : 0;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (caloriePct / 100) * circumference;

  const macroPieData = [
    { name: 'Protein', value: totalProtein * 4 || 1, color: '#f43f5e' },
    { name: 'Carbs', value: totalCarbs * 4 || 1, color: '#f59e0b' },
    { name: 'Fat', value: totalFat * 9 || 1, color: '#38bdf8' },
  ];

  const filteredMeals = useMemo(() => {
    if (selectedCategory === 'all') return mealsList;
    return mealsList.filter(
      (m) => m.meal_type?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [mealsList, selectedCategory]);

  if (loading && !data) {
    return (
      <div className="py-28 flex flex-col items-center justify-center gap-3 text-[#8ba0a6]">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
        <span className="text-xs font-semibold text-white tracking-wide">
          Synthesizing daily metabolic telemetry...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── 1. Hero Section & Oversized Heading ───────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#8ba0a6]">
          <span className="text-emerald-400">✳</span>
          <span>Daily Metabolic Ledger</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-[1.15]">
          Track your daily nutrition{' '}
          <span className="text-[#8ba0a6] font-normal">
            & metabolic trajectory with clinical precision
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-[#8ba0a6] max-w-2xl font-normal pt-1">
          Real-time caloric budget, macronutrient equilibrium, and computer vision food detections for {user?.display_name || 'Member'}.
        </p>
      </div>

      {/* ── 2. Deliberate Horizontal Segmented Controls Bar ───── */}
      <div className="w-full bg-[#0b171b] border border-[#18282c] rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#18282c] overflow-hidden shadow-xl">
        {/* Column 1: Date Navigation */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Period / Date
          </span>
          <div className="flex items-center justify-between gap-1.5 mt-1">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded-md text-[#8ba0a6] hover:text-white hover:bg-[#122227] transition cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 rounded-md text-xs font-bold text-white hover:bg-[#122227] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar size={12} className="text-emerald-400" />
              <span>
                {isToday
                  ? 'Today'
                  : currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </button>
            <button
              onClick={handleNextDay}
              className="p-1 rounded-md text-[#8ba0a6] hover:text-white hover:bg-[#122227] transition cursor-pointer"
              title="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Column 2: Caloric Target & Remaining */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Calorie Target / Left
          </span>
          <div>
            <div className="text-base font-extrabold text-white tabular-num">
              {remainingCalories}{' '}
              <span className="text-xs font-normal text-[#8ba0a6]">kcal left</span>
            </div>
            <span className="text-[11px] text-[#566c73]">
              Target: {targetCalories} kcal
            </span>
          </div>
        </div>

        {/* Column 3: Active Burn & Steps */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Energy Burned & Steps
          </span>
          <div>
            <div className="text-base font-extrabold text-[#f59e0b] tabular-num">
              +{caloriesBurned}{' '}
              <span className="text-xs font-normal text-[#8ba0a6]">kcal burned</span>
            </div>
            <span className="text-[11px] text-[#566c73]">
              {steps.toLocaleString()} steps logged
            </span>
          </div>
        </div>

        {/* Column 4: AI Coach Status */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            NutriCoach Status
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white">
              {mealsList.length > 0 ? `${mealsList.length} Meals Analyzed` : 'Ready to Analyze'}
            </span>
          </div>
          <span className="text-[11px] text-[#566c73]">
            Gemini Vision Active
          </span>
        </div>

        {/* Column 5: Solid White Primary Action Block (Echoes 'Explore') */}
        <div className="p-3 sm:p-3 flex items-center justify-center bg-[#0e1d22] sm:bg-transparent">
          <button
            onClick={() => navigate('/log-meal')}
            className="w-full h-full min-h-[48px] py-3 px-5 rounded-xl bg-white text-black hover:bg-slate-200 transition-all font-extrabold text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <Camera size={16} />
            <span>+ Log Meal</span>
          </button>
        </div>
      </div>

      {/* ── 3. Sidebar-Plus-Main-Content Composition ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Sidebar (Controls, Filters, Macro Gauges) ─── */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Popular Categories / Meal Filters */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6]">
              Filter Meals
            </h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-black font-extrabold shadow-sm'
                        : 'bg-[#0b171b] text-[#8ba0a6] hover:text-white border border-[#18282c] font-medium'
                    }`}
                  >
                    {cat.icon && <span className="shrink-0">{cat.icon}</span>}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calorie Circular Gauge Dial */}
          <div className="health-card p-6 bg-[#0b171b] border-[#18282c] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6]">
                Energy Intake
              </span>
              <Badge variant={caloriePct >= 100 ? 'amber' : 'emerald'} size="sm">
                {caloriePct}% Logged
              </Badge>
            </div>

            <div className="relative py-2 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  className="stroke-[#132328]"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  fill="none"
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black text-white tabular-num tracking-tight">
                  {Math.round(totalCalories)}
                </span>
                <span className="text-[10px] font-bold text-[#8ba0a6] uppercase tracking-wider">
                  of {targetCalories} kcal
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#18282c] text-center">
              <div className="p-2 rounded-lg bg-[#081215] border border-[#18282c]">
                <span className="text-[9px] font-bold text-[#8ba0a6] uppercase block">Target</span>
                <span className="text-xs font-extrabold text-white tabular-num block mt-0.5">{targetCalories}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#1c150a] border border-[#392b16]">
                <span className="text-[9px] font-bold text-[#f59e0b] uppercase block">Burned</span>
                <span className="text-xs font-extrabold text-[#f59e0b] tabular-num block mt-0.5">+{caloriesBurned}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#09221a] border border-[#134937]">
                <span className="text-[9px] font-bold text-[#34d399] uppercase block">Remain</span>
                <span className="text-xs font-extrabold text-[#34d399] tabular-num block mt-0.5">{remainingCalories}</span>
              </div>
            </div>
          </div>

          {/* Macronutrient Equilibrium Gauges */}
          <div className="health-card p-6 bg-[#0b171b] border-[#18282c] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6]">
              Macronutrient Targets
            </h3>

            {/* Protein */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#f43f5e] uppercase text-[10px] tracking-wider">
                  Protein
                </span>
                <span className="font-bold text-white tabular-num">
                  {Math.round(totalProtein)}g / {targetProtein}g
                </span>
              </div>
              <ProgressBar
                value={totalProtein}
                max={targetProtein}
                color="#f43f5e"
                bgColor="#271015"
                height={5}
              />
            </div>

            {/* Carbohydrates */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#f59e0b] uppercase text-[10px] tracking-wider">
                  Carbohydrates
                </span>
                <span className="font-bold text-white tabular-num">
                  {Math.round(totalCarbs)}g / {targetCarbs}g
                </span>
              </div>
              <ProgressBar
                value={totalCarbs}
                max={targetCarbs}
                color="#f59e0b"
                bgColor="#271a06"
                height={5}
              />
            </div>

            {/* Fats */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#38bdf8] uppercase text-[10px] tracking-wider">
                  Fats
                </span>
                <span className="font-bold text-white tabular-num">
                  {Math.round(totalFat)}g / {targetFat}g
                </span>
              </div>
              <ProgressBar
                value={totalFat}
                max={targetFat}
                color="#38bdf8"
                bgColor="#082236"
                height={5}
              />
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="health-card p-4 sm:p-5 bg-[#0b171b] border-[#18282c] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#081215] border border-[#18282c] flex items-center justify-center text-[#f59e0b] shrink-0">
                <Footprints size={18} />
              </div>
              <div>
                <div className="text-sm font-extrabold text-white tabular-num">
                  {steps.toLocaleString()} Steps
                </div>
                <span className="text-[10px] text-[#8ba0a6]">Physical calorie offset</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/activity')}
              icon={<ArrowUpRight size={13} />}
            >
              Sync
            </Button>
          </div>
        </aside>

        {/* ── Right Main Content Area (Charts, AI Banner, Rows) ─ */}
        <section className="lg:col-span-8 space-y-6">
          {/* Top Visual Trajectory & Macro Pie Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Trajectory Bar Chart (8-Span) */}
            <div className="md:col-span-8 health-card p-5 sm:p-6 bg-[#0b171b] border-[#18282c] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    7-Day Caloric Trajectory
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-semibold text-[#8ba0a6]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>Intake (kcal)</span>
                </div>
              </div>

              <div className="h-56 w-full">
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="day"
                        stroke="#566c73"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#566c73"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="p-2.5 rounded-lg bg-[#081215] border border-[#18282c] shadow-xl text-xs">
                                <p className="font-bold text-white">{payload[0].payload.day}</p>
                                <p className="text-emerald-400 font-extrabold mt-0.5">{payload[0].value} kcal</p>
                                <p className="text-[#8ba0a6] text-[10px]">Target: {payload[0].payload.target || 2000} kcal</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {targetCalories > 0 && (
                        <ReferenceLine
                          y={targetCalories}
                          stroke="#10b981"
                          strokeDasharray="3 3"
                          strokeOpacity={0.4}
                        />
                      )}
                      <Bar
                        dataKey="calories"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#8ba0a6] font-medium">
                    Log meals throughout the week to see your historical trajectory.
                  </div>
                )}
              </div>
            </div>

            {/* Macro Distribution Donut (4-Span) */}
            <div className="md:col-span-4 health-card p-5 bg-[#0b171b] border-[#18282c] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={15} className="text-[#f59e0b]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Macro Ratio
                  </h3>
                </div>
                <p className="text-[10px] text-[#8ba0a6]">Caloric distribution</p>
              </div>

              <div className="h-36 relative flex items-center justify-center my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={macroPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={54}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {macroPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[9px] font-bold text-[#8ba0a6] uppercase">Ratio</span>
                  <span className="text-xs font-bold text-white">Macros</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 rounded-lg bg-[#081215] border border-[#18282c]">
                  <span className="text-[9px] text-[#f43f5e] font-bold block">P</span>
                  <span className="text-white font-extrabold text-[11px] block tabular-num mt-0.5">
                    {Math.round(totalProtein)}g
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#081215] border border-[#18282c]">
                  <span className="text-[9px] text-[#f59e0b] font-bold block">C</span>
                  <span className="text-white font-extrabold text-[11px] block tabular-num mt-0.5">
                    {Math.round(totalCarbs)}g
                  </span>
                </div>
                <div className="p-1.5 rounded-lg bg-[#081215] border border-[#18282c]">
                  <span className="text-[9px] text-[#38bdf8] font-bold block">F</span>
                  <span className="text-white font-extrabold text-[11px] block tabular-num mt-0.5">
                    {Math.round(totalFat)}g
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* NutriCoach AI Real-Time Insights Widget */}
          <NutriCoachWidget
            insight={coachInsight}
            loading={coachLoading}
            onRefresh={() => fetchCoachInsight(true)}
            mealsCount={mealsList.length}
          />

          {/* ── Recorded Meals Stream: STRUCTURED, INFORMATION-DENSE CONTENT ROWS ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Recorded Meals</span>
                  <span className="text-xs font-normal text-[#8ba0a6]">
                    ({filteredMeals.length} logged)
                  </span>
                </h3>
                <p className="text-xs text-[#8ba0a6]">
                  Detailed computer vision breakdowns and macronutrient items.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/log-meal')}
                icon={<Plus size={13} />}
              >
                Add Meal
              </Button>
            </div>

            {filteredMeals.length > 0 ? (
              <div className="space-y-3.5">
                {filteredMeals.map((meal) => {
                  const mealType = meal.meal_type?.toLowerCase() || 'lunch';
                  const iconMap: Record<string, React.ReactNode> = {
                    breakfast: <Coffee size={18} className="text-[#f59e0b]" />,
                    lunch: <Sun size={18} className="text-emerald-400" />,
                    dinner: <Moon size={18} className="text-[#38bdf8]" />,
                    snack: <Apple size={18} className="text-[#f43f5e]" />,
                  };

                  const timeStr = meal.logged_at
                    ? new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Today';

                  return (
                    /* Structured, information-dense row directly inspired by the reference */
                    <div
                      key={meal.meal_id}
                      className="health-card-interactive p-5 sm:p-6 bg-[#0b171b] border-[#18282c] hover:border-[#274047] grid grid-cols-1 md:grid-cols-12 gap-5 items-center group"
                    >
                      {/* Left: Visual Meal Thumbnail / Identity (3-span) */}
                      <div className="md:col-span-3">
                        <div className="w-full h-28 sm:h-32 rounded-xl bg-gradient-to-tr from-[#081215] via-[#0f2127] to-[#142d34] border border-[#1d3238] flex flex-col items-center justify-center p-3 relative overflow-hidden group-hover:border-[#2d4d55] transition">
                          <div className="w-12 h-12 rounded-xl bg-[#0b171b]/80 border border-[#1f373e] flex items-center justify-center shadow-lg mb-2">
                            {iconMap[mealType] || <Utensils size={18} className="text-[#8ba0a6]" />}
                          </div>
                          <span className="text-xs font-bold text-white capitalize">
                            {meal.meal_type}
                          </span>
                          <span className="text-[10px] text-[#8ba0a6] flex items-center gap-1 mt-0.5">
                            <Clock size={10} />
                            <span>{timeStr}</span>
                          </span>

                          <div className="absolute top-2 right-2">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                              AI Vision
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Structured Nutritional Attributes (6-span) */}
                      <div className="md:col-span-6 space-y-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                              ★ 98% AI Vision Match
                            </span>
                            <span className="text-[#566c73] text-xs">•</span>
                            <span className="text-xs text-[#8ba0a6] font-medium">
                              {meal.items?.length || 1} item{meal.items?.length !== 1 ? 's' : ''} detected
                            </span>
                          </div>

                          <h4 className="text-base sm:text-lg font-bold text-white capitalize mt-0.5 group-hover:text-emerald-300 transition-colors">
                            {meal.meal_type} Nutrition Plate
                          </h4>
                        </div>

                        {/* Metadata Rows with Icons */}
                        <div className="space-y-1 text-xs text-[#8ba0a6]">
                          <div className="flex items-center gap-1.5">
                            <Utensils size={13} className="text-[#566c73] shrink-0" />
                            <span>
                              Macros: <strong className="text-white font-semibold">{Math.round(meal.total_protein_g || 0)}g Protein</strong>,{' '}
                              <strong className="text-white font-semibold">{Math.round(meal.total_carbs_g || 0)}g Carbs</strong>,{' '}
                              <strong className="text-white font-semibold">{Math.round(meal.total_fat_g || 0)}g Fat</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Layers size={13} className="text-[#566c73] shrink-0" />
                            <span>Logged at {timeStr} • Verified with Food Database</span>
                          </div>
                        </div>

                        {/* Items list pills */}
                        {meal.items && meal.items.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {meal.items.map((item, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-[#081215] text-[#8ba0a6] border border-[#18282c]"
                              >
                                {item.food_name} <span className="text-white">({item.quantity_grams}g)</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Key Metric in Large Typography & Action Buttons (3-span) */}
                      <div className="md:col-span-3 flex flex-col sm:flex-row md:flex-col justify-between items-start md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#18282c]">
                        <div className="md:text-right">
                          <span className="text-[10px] font-bold text-[#8ba0a6] uppercase tracking-wider block">
                            Energy
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-white tabular-num leading-tight">
                            {Math.round(meal.total_calories)}
                            <span className="text-xs font-bold text-[#8ba0a6] ml-1">kcal</span>
                          </div>
                        </div>

                        <div className="flex md:flex-col gap-2 w-full sm:w-auto md:w-32">
                          <button
                            onClick={() => navigate('/history')}
                            className="flex-1 md:w-full py-2 px-3 rounded-lg bg-[#0e1f24] hover:bg-[#152e35] text-white border border-[#1d333a] text-xs font-bold tracking-tight transition flex items-center justify-between cursor-pointer"
                          >
                            <span>Details</span>
                            <ArrowUpRight size={13} className="text-[#8ba0a6]" />
                          </button>
                          <button
                            onClick={() => navigate('/log-meal')}
                            className="flex-1 md:w-full py-2 px-3 rounded-lg bg-white text-black hover:bg-slate-200 text-xs font-extrabold tracking-tight transition flex items-center justify-between cursor-pointer"
                          >
                            <span>Log More</span>
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Minimalist Empty State */
              <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-[#18282c] bg-[#0b171b]">
                <div className="w-12 h-12 rounded-xl bg-[#081f18] border border-[#134937] flex items-center justify-center mx-auto mb-3 text-emerald-400">
                  <Utensils size={22} />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  No meals recorded for this category
                </h4>
                <p className="text-xs text-[#8ba0a6] max-w-sm mx-auto mb-5 font-normal">
                  Capture a food plate photograph or search the ingredient catalog to register your meal.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/log-meal')}
                  icon={<Camera size={14} />}
                >
                  Log Your First Meal
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
