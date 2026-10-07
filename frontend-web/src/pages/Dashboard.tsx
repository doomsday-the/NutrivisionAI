import { useEffect, useState } from 'react';
import axios from 'axios';
import { Flame, Utensils, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

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

export default function Dashboard() {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Format date in YYYY-MM-DD using local timezone
  const formattedDate = currentDate.toLocaleDateString('en-CA');
  const todayFormatted = new Date().toLocaleDateString('en-CA');

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayFormatted = yesterday.toLocaleDateString('en-CA');

  const isToday = formattedDate === todayFormatted;
  const isYesterday = formattedDate === yesterdayFormatted;

  let headingText = "Today's Overview";
  if (isToday) {
    headingText = "Today's Overview";
  } else if (isYesterday) {
    headingText = "Yesterday's Overview";
  } else {
    headingText = currentDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);

        const res = await axios.get<DashboardData>(
          `${API_BASE_URL}/api/activity/dashboard?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`,
          { headers }
        );
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
        // Default to zeroed metrics rather than crashing
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
          meals: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [currentDate, formattedDate, token]);

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    if (isToday) return;
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleTodayClick = () => {
    setCurrentDate(new Date());
  };

  // Safe numerical fallbacks preventing NaN/null crashes
  const targetCalories = Number(data?.target_calories ?? 0);
  const totalCalories = Number(data?.total_calories ?? 0);
  const caloriesBurned = Number(data?.calories_burned ?? 0);
  const remainingCalories = Number(data?.remaining_calories ?? 0);
  const totalProtein = Number(data?.total_protein_g ?? 0);
  const totalCarbs = Number(data?.total_carbs_g ?? 0);
  const totalFat = Number(data?.total_fat_g ?? 0);
  const mealsList = data?.meals ?? [];

  return (
    <div className="space-y-6">
      {/* Header and Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{headingText}</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
            <Calendar size={14} /> {formattedDate}
          </p>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-lg border border-gray-200 shadow-sm self-start sm:self-auto">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 transition"
            title="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          {!isToday && (
            <button
              onClick={handleTodayClick}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-primary-50 text-primary-700 hover:bg-primary-100 transition"
            >
              Jump to Today
            </button>
          )}

          <span className="text-sm font-medium text-gray-700 px-1">
            {formattedDate}
          </span>

          <button
            onClick={handleNextDay}
            disabled={isToday}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Next Day"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="text-center py-12 text-gray-500">Loading daily metrics...</div>
      ) : (
        <>
          {/* Calories Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">TARGET</div>
              <div className="text-3xl font-extrabold text-gray-900">{Math.round(targetCalories)}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Utensils size={14} /> EATEN
              </div>
              <div className="text-3xl font-extrabold text-gray-900">{Math.round(totalCalories)}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-orange-500">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <Flame size={14} /> BURNED
              </div>
              <div className="text-3xl font-extrabold text-gray-900">{Math.round(caloriesBurned)}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-primary-500">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">REMAINING</div>
              <div className="text-3xl font-extrabold text-primary-600">{Math.round(remainingCalories)}</div>
            </div>
          </div>

          {/* Macros Overview */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Macronutrients</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-gray-500 text-sm">Protein</div>
                <div className="text-2xl font-bold text-blue-600">{Math.round(totalProtein)}g</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Carbs</div>
                <div className="text-2xl font-bold text-yellow-500">{Math.round(totalCarbs)}g</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">Fat</div>
                <div className="text-2xl font-bold text-red-500">{Math.round(totalFat)}g</div>
              </div>
            </div>
          </div>

          {/* Meals List */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Logged Meals</h2>
            {mealsList.length === 0 ? (
              <p className="text-gray-500 italic text-sm">No meals logged for this date.</p>
            ) : (
              <div className="space-y-3">
                {mealsList.map((meal, idx) => (
                  <div key={meal.meal_id || idx} className="flex justify-between items-center p-3.5 border border-gray-200 rounded-lg">
                    <span className="capitalize font-semibold text-gray-800">{meal.meal_type}</span>
                    <span className="text-primary-600 font-bold">{Math.round(meal.total_calories)} kcal</span>
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
