import { useEffect, useState } from 'react';
import axios from 'axios';
import { Flame, Utensils, ChevronLeft, ChevronRight, Calendar, TrendingUp, Activity, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface MealSummary {
  meal_id: number;
  meal_type: string;
  total_calories: number;
  logged_at?: string;
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
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const formattedDate = currentDate.toLocaleDateString('en-CA');
  const todayFormatted = new Date().toLocaleDateString('en-CA');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-CA');

  const isToday = formattedDate === todayFormatted;
  const isYesterday = formattedDate === yesterdayFormatted;

  let headingText = "Today's Overview";
  if (isToday) headingText = "Today's Overview";
  else if (isYesterday) headingText = "Yesterday's Overview";
  else {
    headingText = currentDate.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const [res, weeklyRes] = await Promise.all([
          axios.get<DashboardData>(
            `${API_BASE_URL}/api/activity/dashboard?date=${formattedDate}`,
            { headers }
          ),
          axios.get<WeeklyData[]>(
            `${API_BASE_URL}/api/activity/weekly?date=${formattedDate}`,
            { headers }
          )
        ]);
        setData(res.data);
        setWeeklyData(weeklyRes.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
        setData({
          date: formattedDate, target_calories: 2000, total_calories: 0,
          calories_burned: 0, remaining_calories: 2000, total_protein_g: 0,
          total_carbs_g: 0, total_fat_g: 0, steps: 0, meals: []
        });
        setWeeklyData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [currentDate, formattedDate, token]);

  const targetCalories = Number(data?.target_calories ?? 2000);
  const totalCalories = Number(data?.total_calories ?? 0);
  const caloriesBurned = Number(data?.calories_burned ?? 0);
  const remainingCalories = Math.max(0, targetCalories - totalCalories + caloriesBurned);
  const totalProtein = Number(data?.total_protein_g ?? 0);
  const totalCarbs = Number(data?.total_carbs_g ?? 0);
  const totalFat = Number(data?.total_fat_g ?? 0);
  const mealsList = data?.meals ?? [];

  const macroData = [
    { name: 'Protein', value: totalProtein, color: '#3b82f6' },
    { name: 'Carbs', value: totalCarbs, color: '#f59e0b' },
    { name: 'Fat', value: totalFat, color: '#ef4444' },
  ];
  const totalMacros = totalProtein + totalCarbs + totalFat;

  // Mock weekly data for the beautiful bar chart - removed, using dynamic data
  // The weeklyData state is mapped directly to the Recharts BarChart

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{headingText}</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2 font-medium">
            <Calendar size={16} /> {formattedDate}
          </p>
        </div>

        <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 p-1">
          <button
            onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
          >
            <ChevronLeft size={20} />
          </button>
          {!isToday && (
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-1.5 text-sm font-bold text-primary-600 hover:bg-primary-50 rounded-lg transition"
            >
              Today
            </button>
          )}
          <button
            onClick={() => { if(!isToday) { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d); } }}
            disabled={isToday}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Main Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <Activity size={64} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Target</div>
              <div className="text-4xl font-extrabold text-gray-900">{Math.round(targetCalories)}</div>
              <div className="text-sm font-medium text-gray-400 mt-2">kcal / day</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl shadow-[0_2px_20px_-5px_rgba(16,185,129,0.15)] border border-green-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-green-600">
                <Utensils size={64} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2">Eaten</div>
              <div className="text-4xl font-extrabold text-green-900">{Math.round(totalCalories)}</div>
              <div className="text-sm font-medium text-green-600 mt-2">logged today</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-6 rounded-2xl shadow-[0_2px_20px_-5px_rgba(245,158,11,0.15)] border border-orange-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-orange-600">
                <Flame size={64} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-orange-700 mb-2">Burned</div>
              <div className="text-4xl font-extrabold text-orange-900">{Math.round(caloriesBurned)}</div>
              <div className="text-sm font-medium text-orange-600 mt-2">active calories</div>
            </div>

            <div className="bg-gradient-to-br from-primary-500 to-indigo-600 p-6 rounded-2xl shadow-[0_4px_25px_-5px_rgba(99,102,241,0.4)] border border-primary-600 relative overflow-hidden group text-white">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                <TrendingUp size={64} />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary-100 mb-2">Remaining</div>
              <div className="text-4xl font-extrabold">{Math.round(remainingCalories)}</div>
              <div className="text-sm font-medium text-primary-200 mt-2">left for today</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Macros Donut Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="text-primary-500" size={24} />
                <h2 className="text-xl font-bold text-gray-900">Macros</h2>
              </div>
              {totalMacros > 0 ? (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={macroData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {macroData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`${Math.round(value)}g`, undefined]}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                      <span className="text-2xl font-bold text-gray-900">{Math.round(totalMacros)}g</span>
                      <span className="text-xs text-gray-500">Total</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    {macroData.map(m => (
                      <div key={m.name} className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }}></div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">{m.name}</span>
                        </div>
                        <div className="font-bold text-gray-900">{Math.round(m.value)}g</div>
                        <div className="text-[10px] text-gray-400">
                          {Math.round((m.value / totalMacros) * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center flex-col text-gray-400">
                  <PieChart size={48} className="mb-3 opacity-20" />
                  <p className="text-sm font-medium">No macros logged today</p>
                </div>
              )}
            </div>

            {/* Weekly Trend Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-primary-500" size={24} />
                  <h2 className="text-xl font-bold text-gray-900">Weekly Trend</h2>
                </div>
              </div>
              <div className="flex-1 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="calories" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Meals List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Meals Today</h2>
              <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full">
                {mealsList.length} logged
              </span>
            </div>
            
            {mealsList.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Utensils className="text-gray-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No meals logged yet</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm">You haven't logged any food for this day. Track your meals to see insights here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {mealsList.map((meal, idx) => (
                  <div key={meal.meal_id || idx} className="p-5 flex items-center justify-between hover:bg-gray-50 transition group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                        <Utensils size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 capitalize text-lg group-hover:text-primary-600 transition">{meal.meal_type}</h4>
                        <p className="text-xs text-gray-500 font-medium">Logged today</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-gray-900">{Math.round(meal.total_calories)}</div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Kcal</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
