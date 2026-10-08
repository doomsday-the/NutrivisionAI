import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { History, Trash2, Calendar, Utensils, AlertCircle, Plus, ChevronRight } from 'lucide-react';
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
      if (append) setLoadingMore(true); else setLoading(true);
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

  useEffect(() => { fetchMeals(1, false); }, [token]);

  const handleDelete = async (mealId: number) => {
    if (!window.confirm('Are you sure you want to delete this meal?')) return;
    try {
      setDeletingId(mealId);
      await axios.delete(`${API_BASE_URL}/api/meals/${mealId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setMeals((prev) => prev.filter((m) => m.meal_id !== mealId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete meal');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) fetchMeals(page + 1, true);
  };

  const groupedMeals: Record<string, Meal[]> = {};
  for (const meal of meals) {
    const dateObj = new Date(meal.logged_at);
    const dateKey = isNaN(dateObj.getTime())
      ? 'Unknown Date'
      : dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    if (!groupedMeals[dateKey]) groupedMeals[dateKey] = [];
    groupedMeals[dateKey].push(meal);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 text-primary-50 opacity-50 pointer-events-none">
          <History size={200} />
        </div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <History size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Meal History</h1>
            <p className="text-gray-500 font-medium">Review your nutritional journey and past meals.</p>
          </div>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 md:flex-initial focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition">
            <Calendar size={18} className="text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); fetchMeals(1, false, e.target.value); }}
              className="bg-transparent text-sm text-gray-700 outline-none w-full font-medium"
            />
            {selectedDate && (
              <button onClick={() => { setSelectedDate(''); fetchMeals(1, false, ''); }} className="text-gray-400 hover:text-gray-700 ml-1">✕</button>
            )}
          </div>
          <Link
            to="/log-meal"
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold transition shadow-md hover:shadow-lg"
          >
            <Plus size={18} /> Log Meal
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl flex items-center gap-3 shadow-sm">
          <AlertCircle size={20} className="shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {!loading && meals.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Utensils size={40} className="text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Meals Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium">You haven't logged any meals for this period. Start tracking to build your nutritional history.</p>
          <Link to="/log-meal" className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-500/30">
            <Plus size={20} /> Log Your First Meal
          </Link>
        </div>
      )}

      {!loading && meals.length > 0 && (
        <div className="space-y-10">
          {Object.entries(groupedMeals).map(([dateLabel, dateMeals]) => (
            <div key={dateLabel} className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="h-px bg-gray-200 flex-1"></div>
                <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-1.5 rounded-full shadow-sm text-sm font-bold text-gray-700">
                  <Calendar size={16} className="text-primary-500" />
                  {dateLabel}
                  <span className="text-gray-400 font-medium ml-1">({dateMeals.length})</span>
                </div>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div className="grid gap-5">
                {dateMeals.map((meal) => {
                  const timeStr = new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={meal.meal_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition group overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary-400 to-indigo-500"></div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-50 mb-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center font-bold text-xl uppercase">
                            {meal.meal_type.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="capitalize font-extrabold text-gray-900 text-xl">{meal.meal_type}</span>
                              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{timeStr}</span>
                            </div>
                            <div className="flex gap-4 text-sm font-medium text-gray-500">
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>{Math.round(meal.total_protein_g || 0)}g P</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>{Math.round(meal.total_carbs_g || 0)}g C</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>{Math.round(meal.total_fat_g || 0)}g F</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-16 sm:pl-0">
                          <div className="text-right">
                            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{Math.round(meal.total_calories || 0)}</span>
                            <span className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">kcal</span>
                          </div>
                          <button
                            onClick={() => handleDelete(meal.meal_id)}
                            disabled={deletingId === meal.meal_id}
                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
                            title="Delete meal"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="pl-16 pr-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contents</h4>
                        {meal.items && meal.items.length > 0 ? (
                          <div className="grid gap-2">
                            {meal.items.map((item) => (
                              <div key={item.item_id} className="flex items-center justify-between group/item">
                                <div className="flex items-center gap-2">
                                  <ChevronRight size={14} className="text-gray-300 group-hover/item:text-primary-500 transition" />
                                  <span className="font-semibold text-gray-700">{item.food_name}</span>
                                  <span className="text-xs text-gray-400 font-medium bg-gray-50 px-1.5 rounded">{item.quantity_grams}g</span>
                                </div>
                                <span className="font-bold text-gray-900 text-sm">{Math.round(item.estimated_calories)} kcal</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic font-medium">No items logged.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {page < totalPages && (
            <div className="text-center pt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-bold px-8 py-3 rounded-xl shadow-sm transition disabled:opacity-50 hover:border-gray-300"
              >
                {loadingMore ? 'Loading more...' : 'Load Older Meals'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
