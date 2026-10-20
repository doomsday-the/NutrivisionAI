import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Trash2,
  Calendar,
  Utensils,
  AlertCircle,
  Plus,
  Sun,
  Moon,
  Coffee,
  Apple,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface MealItem {
  item_id: number;
  food_id: number;
  food_name: string;
  quantity_grams: number;
  estimated_calories: number;
}

interface Meal {
  meal_id: number;
  meal_type: string;
  logged_at: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  items: MealItem[];
}

interface HistoryResponse {
  meals: Meal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function MealHistory() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const fetchMeals = async (targetPage: number, append: boolean = false, dateFilter: string = selectedDate) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError('');

      let url = `${API_BASE_URL}/api/meals/history?page=${targetPage}&limit=10`;
      if (dateFilter) {
        const [year, month, day] = dateFilter.split('-').map(Number);
        const currentDate = new Date(year, month - 1, day);
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);
        url += `&start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`;
      }

      const res = await axios.get<HistoryResponse>(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const fetchedMeals = res.data.meals || [];
      if (append) setMeals((prev) => [...prev, ...fetchedMeals]);
      else setMeals(fetchedMeals);

      setPage(res.data.pagination.page);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load meal history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMeals(1, false);
  }, [token]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchMeals(1, false, newDate);
  };

  const clearFilter = () => {
    setSelectedDate('');
    fetchMeals(1, false, '');
  };

  const handleDelete = async (mealId: number) => {
    if (!window.confirm('Delete this meal and reverse logged macros?')) return;
    try {
      setDeletingId(mealId);
      await axios.delete(`${API_BASE_URL}/api/meals/${mealId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setMeals((prev) => prev.filter((m) => m.meal_id !== mealId));
      try {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith('nutricoach_insight_')) sessionStorage.removeItem(key);
        });
      } catch {}
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete meal');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchMeals(page + 1, true);
    }
  };

  const getMealIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return <Coffee size={16} className="text-amber-700" />;
      case 'lunch':
        return <Sun size={16} className="text-emerald-700" />;
      case 'dinner':
        return <Moon size={16} className="text-sky-700" />;
      default:
        return <Apple size={16} className="text-rose-700" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <History size={20} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">Meal History</h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-medium">
            Timeline of all meals analyzed via computer vision and manually logged.
          </p>
        </div>

        {/* Date Filter & Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-stone-200 shadow-sm text-xs">
            <Calendar size={14} className="text-stone-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="bg-transparent text-stone-800 outline-none cursor-pointer"
            />
            {selectedDate && (
              <button onClick={clearFilter} className="text-stone-400 hover:text-stone-700 p-0.5">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Meals Stream */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-stone-500">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Retrieving meal trajectory...</span>
        </div>
      ) : meals.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto bg-white border border-stone-200 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-700">
            <Utensils size={28} />
          </div>
          <h3 className="text-base font-bold text-stone-900">No historical meals recorded</h3>
          <p className="text-xs text-stone-500 mt-1 mb-6">
            {selectedDate
              ? `No meals were logged on ${selectedDate}. Try selecting another date.`
              : 'You have not logged any meals yet. Scan your first dish to start tracking.'}
          </p>
          <button
            onClick={() => navigate('/log-meal')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition shadow-xs"
          >
            <Plus size={14} />
            <span>Log a Meal Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => {
            const dateObj = new Date(meal.logged_at);
            const dateFormatted = dateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={meal.meal_id}
                className="glass-panel glass-panel-hover rounded-3xl p-5 sm:p-6 transition-all duration-200 bg-white border border-stone-200 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center shadow-2xs">
                      {getMealIcon(meal.meal_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-stone-900 capitalize">
                          {meal.meal_type}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                          {timeFormatted}
                        </span>
                      </div>
                      <span className="text-xs text-stone-500 mt-0.5 block">{dateFormatted}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <span className="text-xl font-black text-stone-900">{Math.round(meal.total_calories)}</span>
                      <span className="text-[11px] font-bold text-stone-500 ml-1">kcal</span>
                    </div>

                    <button
                      disabled={deletingId === meal.meal_id}
                      onClick={() => handleDelete(meal.meal_id)}
                      className="p-2 rounded-xl bg-stone-50 hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-stone-200/80 hover:border-rose-200 transition"
                      title="Delete Meal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Macro Strip */}
                <div className="grid grid-cols-3 gap-2 py-3 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
                    <span className="text-[10px] text-stone-500 font-bold block">Protein</span>
                    <span className="font-black text-rose-700 mt-0.5 block">{Math.round(meal.total_protein_g || 0)}g</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
                    <span className="text-[10px] text-stone-500 font-bold block">Carbs</span>
                    <span className="font-black text-amber-800 mt-0.5 block">{Math.round(meal.total_carbs_g || 0)}g</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
                    <span className="text-[10px] text-stone-500 font-bold block">Fats</span>
                    <span className="font-black text-emerald-800 mt-0.5 block">{Math.round(meal.total_fat_g || 0)}g</span>
                  </div>
                </div>

                {/* Items Pill List */}
                {meal.items && meal.items.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {meal.items.map((item) => (
                      <span
                        key={item.item_id}
                        className="text-xs font-medium px-2.5 py-1 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 flex items-center gap-1.5 shadow-2xs"
                      >
                        <span className="font-semibold">{item.food_name}</span>
                        <span className="text-stone-400 text-[10px]">({item.quantity_grams}g)</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {page < totalPages && (
            <div className="text-center pt-4">
              <button
                disabled={loadingMore}
                onClick={handleLoadMore}
                className="px-6 py-2.5 rounded-2xl bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 border border-stone-200 transition shadow-2xs"
              >
                {loadingMore ? 'Loading Older Meals...' : 'Load Older Meals'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
