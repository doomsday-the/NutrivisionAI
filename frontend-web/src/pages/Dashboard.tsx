import { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Flame, Utensils, Target, Footprints, Coffee, Sun, Moon, Apple } from 'lucide-react';

// ── TypeScript interfaces (unchanged) ────────────────────────
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
  meals: any[];
}

// ── Helpers ──────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

// ── Calorie Ring ─────────────────────────────────────────────
function CalorieRing({ eaten, target }: { eaten: number; target: number }) {
  const radius = 70;
  const stroke = 10;
  const norm = radius - stroke / 2;
  const circ = 2 * Math.PI * norm;
  const pct = target > 0 ? Math.min(eaten / target, 1) : 0;
  const offset = circ * (1 - pct);
  const remaining = Math.max(target - eaten, 0);

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2} className="rotate-[-90deg]">
          {/* Track */}
          <circle
            cx={radius} cy={radius} r={norm}
            fill="none" stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={radius} cy={radius} r={norm}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
          />
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#4ade80" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white leading-none">{eaten}</span>
          <span className="text-xs text-slate-400 font-medium mt-0.5">kcal eaten</span>
        </div>
      </div>
      <p className="text-slate-400 text-sm mt-3">
        <span className="text-emerald-400 font-bold">{remaining}</span> kcal remaining
      </p>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  unit?: string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
}

function StatCard({ label, value, unit = 'kcal', icon, gradient, glowColor }: StatCardProps) {
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden group transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: gradient,
        boxShadow: `0 4px 24px ${glowColor}`,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black text-white leading-none mb-1">{value}</div>
      <div className="text-xs font-medium text-white/60 uppercase tracking-widest">{unit}</div>
      <div className="text-sm font-semibold text-white/80 mt-1">{label}</div>
      {/* Subtle shine */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }} />
    </div>
  );
}

// ── Macro Bar ────────────────────────────────────────────────
function MacroBar({ label, value, max, color, bg }: {
  label: string; value: number; max: number; color: string; bg: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-300">{label}</span>
        <span className="font-bold" style={{ color }}>{value}g</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: bg }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Meal Type Config ─────────────────────────────────────────
const mealTypeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  breakfast: { icon: <Coffee size={16} />,  color: '#eab308', bg: 'rgba(234,179,8,0.12)'   },
  lunch:     { icon: <Sun size={16} />,     color: '#22c55e', bg: 'rgba(34,197,94,0.12)'    },
  dinner:    { icon: <Moon size={16} />,    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'   },
  snack:     { icon: <Apple size={16} />,   color: '#a855f7', bg: 'rgba(168,85,247,0.12)'   },
};

// ── Skeleton ──────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 rounded-xl bg-white/8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-white/8" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-white/8" />
      <div className="h-40 rounded-2xl bg-white/8" />
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/activity/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <Skeleton />;

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="text-6xl mb-4">😕</div>
      <h2 className="text-xl font-bold text-white mb-2">Couldn't load dashboard</h2>
      <p className="text-slate-400 text-sm">Make sure the backend is running on port 3000.</p>
    </div>
  );

  return (
    <div className="dashboard-page space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="dashboard-title text-2xl font-black text-white">
            {getGreeting()} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{todayLabel()}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #22c55e, #14b8a6)' }}>
          <Activity size={20} className="text-white" />
        </div>
      </div>

      {/* ── Hero: Ring + Stats ───────────────────────── */}
      <div
        className="dashboard-panel rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Calorie ring */}
          <div className="flex items-center justify-center border-b md:border-b-0 md:border-r border-white/8 py-2">
            <CalorieRing eaten={data.total_calories} target={data.target_calories} />
          </div>
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-0">
            {[
              { label: 'Target',    value: data.target_calories,  color: '#3b82f6', icon: <Target size={16} className="text-blue-400" /> },
              { label: 'Eaten',     value: data.total_calories,   color: '#22c55e', icon: <Utensils size={16} className="text-emerald-400" /> },
              { label: 'Burned',    value: data.calories_burned,  color: '#f97316', icon: <Flame size={16} className="text-orange-400" /> },
              { label: 'Remaining', value: data.remaining_calories, color: '#a855f7', icon: <Activity size={16} className="text-purple-400" /> },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`p-5 flex flex-col gap-1 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''} border-white/8`}
              >
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  {item.icon} {item.label}
                </div>
                <div className="text-2xl font-black" style={{ color: item.color }}>
                  {item.value}
                </div>
                <div className="text-xs text-slate-500">kcal</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Target"
          value={data.target_calories}
          icon={<Target size={20} className="text-white" />}
          gradient="linear-gradient(135deg, #1d4ed8, #2563eb)"
          glowColor="rgba(59,130,246,0.25)"
        />
        <StatCard
          label="Eaten"
          value={data.total_calories}
          icon={<Utensils size={20} className="text-white" />}
          gradient="linear-gradient(135deg, #15803d, #22c55e)"
          glowColor="rgba(34,197,94,0.25)"
        />
        <StatCard
          label="Burned"
          value={data.calories_burned}
          icon={<Flame size={20} className="text-white" />}
          gradient="linear-gradient(135deg, #c2410c, #f97316)"
          glowColor="rgba(249,115,22,0.25)"
        />
        <StatCard
          label="Remaining"
          value={data.remaining_calories}
          icon={<Activity size={20} className="text-white" />}
          gradient="linear-gradient(135deg, #7e22ce, #a855f7)"
          glowColor="rgba(168,85,247,0.25)"
        />
      </div>

      {/* ── Macros ──────────────────────────────────── */}
      <div
        className="dashboard-panel rounded-2xl p-6"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full inline-block"
            style={{ background: 'linear-gradient(180deg, #22c55e, #14b8a6)' }} />
          Macronutrients
        </h2>
        <div className="space-y-4">
          <MacroBar label="Protein" value={data.total_protein_g} max={150} color="#a855f7" bg="rgba(168,85,247,0.12)" />
          <MacroBar label="Carbs"   value={data.total_carbs_g}   max={300} color="#eab308" bg="rgba(234,179,8,0.12)"   />
          <MacroBar label="Fat"     value={data.total_fat_g}     max={80}  color="#f97316" bg="rgba(249,115,22,0.12)"  />
        </div>
      </div>

      {/* ── Steps ───────────────────────────────────── */}
      <div
        className="dashboard-panel rounded-2xl p-6 flex items-center gap-5"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
          <Footprints size={28} className="text-white" />
        </div>
        <div>
          <div className="text-3xl font-black text-white">
            {data.steps.toLocaleString()}
          </div>
          <div className="text-sm text-slate-400 font-medium">steps today</div>
        </div>
        <div className="ml-auto text-xs text-slate-500 font-medium text-right hidden sm:block">
          Goal<br />
          <span className="text-slate-300 font-bold text-base">10,000</span>
        </div>
      </div>

      {/* ── Meals List ──────────────────────────────── */}
      <div
        className="dashboard-panel rounded-2xl p-6"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
          <span className="w-1.5 h-5 rounded-full inline-block"
            style={{ background: 'linear-gradient(180deg, #f97316, #eab308)' }} />
          Logged Meals
        </h2>

        {data.meals.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center animate-fade-in">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="text-slate-300 font-semibold">No meals logged yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Head over to <span className="text-emerald-400 font-medium">Log Meal</span> to add your first meal!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.meals.map((meal, idx) => {
              const cfg = mealTypeConfig[meal.meal_type] ?? {
                icon: <Utensils size={16} />,
                color: '#94a3b8',
                bg: 'rgba(148,163,184,0.1)',
              };
              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-xl transition-transform duration-150 hover:-translate-y-0.5"
                  style={{
                    background: cfg.bg,
                    borderLeft: `3px solid ${cfg.color}`,
                    border: `1px solid rgba(255,255,255,0.06)`,
                    borderLeftWidth: '3px',
                    borderLeftColor: cfg.color,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon}
                  </div>
                  <span
                    className="flex-1 font-semibold capitalize text-sm"
                    style={{ color: cfg.color }}
                  >
                    {meal.meal_type}
                  </span>
                  <span className="text-white font-black text-base">
                    {meal.total_calories}
                    <span className="text-slate-500 text-xs font-medium ml-1">kcal</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
