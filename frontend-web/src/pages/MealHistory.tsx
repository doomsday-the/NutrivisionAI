import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { History, Trash2, Calendar, Utensils, AlertCircle, Plus } from 'lucide-react';
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
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
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

      const res = await axios.get<HistoryResponse>(
        url,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      const fetchedMeals = res.data.meals || [];
      if (append) {
        setMeals((prev) => [...prev, ...fetchedMeals]);
      } else {
        setMeals(fetchedMeals);
      }

      setPage(res.data.pagination.page);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err: any) {
      console.error('[Meal History Error]', err);
      setError(err.response?.data?.message || 'Failed to load meal history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMeals(1, false);
  }, [token]);

  const handleDelete = async (mealId: number) => {
    if (!window.confirm('Are you sure you want to delete this meal?')) {
      return;
    }

    try {
      setDeletingId(mealId);
      await axios.delete(`${API_BASE_URL}/api/meals/${mealId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      // Remove meal card from list
      setMeals((prev) => prev.filter((m) => m.meal_id !== mealId));
    } catch (err: any) {
      console.error('[Delete Meal Error]', err);
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

  // Group meals by formatted date string (e.g. "Monday, Oct 7, 2026")
  const groupedMeals: Record<string, Meal[]> = {};
  for (const meal of meals) {
    const dateObj = new Date(meal.logged_at);
    const dateKey = isNaN(dateObj.getTime())
      ? 'Unknown Date'
      : dateObj.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

    if (!groupedMeals[dateKey]) {
      groupedMeals[dateKey] = [];
    }
    groupedMeals[dateKey].push(meal);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-100 text-primary-600 rounded-xl">
            <History size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meal History</h1>
            <p className="text-gray-500 text-sm">
              Review your past meals, portion breakdown, and nutritional history.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-gray-500 font-medium">Filter date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                fetchMeals(1, false, e.target.value);
              }}
              className="text-xs text-gray-700 outline-none"
            />
            {selectedDate && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('');
                  fetchMeals(1, false, '');
                }}
                className="text-gray-400 hover:text-gray-600 font-bold ml-1"
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>
          <Link
            to="/log-meal"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition text-sm"
          >
            <Plus size={16} /> Log Meal
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-gray-500 font-medium">Loading your meals...</p>
        </div>
      )}

      {!loading && meals.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <Utensils size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">No Meals Logged Yet</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
              You haven't logged any meals yet. Take a photo or search manually to start tracking.
            </p>
          </div>
          <Link
            to="/log-meal"
            className="inline-block bg-primary-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Log Your First Meal
          </Link>
        </div>
      )}

      {!loading && meals.length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedMeals).map(([dateLabel, dateMeals]) => (
            <div key={dateLabel} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 border-b pb-2">
                <Calendar size={16} className="text-primary-600" />
                <span>{dateLabel}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-normal">
                  {dateMeals.length} {dateMeals.length === 1 ? 'meal' : 'meals'}
                </span>
              </div>

              <div className="grid gap-4">
                {dateMeals.map((meal) => {
                  const timeStr = new Date(meal.logged_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={meal.meal_id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-gray-200 transition"
                    >
                      <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="capitalize font-bold text-gray-900 text-lg">
                              {meal.meal_type}
                            </span>
                            <span className="text-xs text-gray-400">• {timeStr}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            P: {Math.round(meal.total_protein_g || 0)}g &nbsp;|&nbsp;
                            C: {Math.round(meal.total_carbs_g || 0)}g &nbsp;|&nbsp;
                            F: {Math.round(meal.total_fat_g || 0)}g
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-xl font-bold text-primary-600">
                              {Math.round(meal.total_calories || 0)}
                            </span>
                            <span className="text-xs text-gray-500 block">kcal</span>
                          </div>

                          <button
                            onClick={() => handleDelete(meal.meal_id)}
                            disabled={deletingId === meal.meal_id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Delete meal"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Item details */}
                      <div className="pt-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Items ({meal.items?.length || 0})
                        </div>
                        {meal.items && meal.items.length > 0 ? (
                          <div className="space-y-2">
                            {meal.items.map((item) => (
                              <div
                                key={item.item_id}
                                className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-800">
                                    {item.food_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({item.quantity_grams}g)
                                  </span>
                                </div>
                                <span className="font-semibold text-gray-700">
                                  {Math.round(item.estimated_calories)} kcal
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No food items listed</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {page < totalPages && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold px-6 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Meals'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
