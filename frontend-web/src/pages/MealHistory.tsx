import { useState, useEffect, useMemo } from 'react';
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
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { Button } from '../components/ui';

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

const TYPE_FILTERS = [
  { id: 'all', label: 'All Records' },
  { id: 'breakfast', label: 'Breakfast', icon: <Coffee size={12} /> },
  { id: 'lunch', label: 'Lunch', icon: <Sun size={12} /> },
  { id: 'dinner', label: 'Dinner', icon: <Moon size={12} /> },
  { id: 'snack', label: 'Snacks', icon: <Apple size={12} /> },
];

export default function MealHistory() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
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
        return <Coffee size={18} className="text-[#f59e0b]" />;
      case 'lunch':
        return <Sun size={18} className="text-emerald-400" />;
      case 'dinner':
        return <Moon size={18} className="text-[#38bdf8]" />;
      default:
        return <Apple size={18} className="text-[#f43f5e]" />;
    }
  };

  const filteredMeals = useMemo(() => {
    if (selectedType === 'all') return meals;
    return meals.filter(
      (m) => m.meal_type?.toLowerCase() === selectedType.toLowerCase()
    );
  }, [meals, selectedType]);

  const totalCaloriesDisplayed = useMemo(() => {
    return filteredMeals.reduce((acc, m) => acc + (m.total_calories || 0), 0);
  }, [filteredMeals]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── 1. Hero Section & Oversized Heading ───────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#8ba0a6]">
          <span className="text-emerald-400">✳</span>
          <span>Nutritional Timeline & Audit</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-[1.15]">
          Browse every analyzed meal{' '}
          <span className="text-[#8ba0a6] font-normal">
            across your wellness journey
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-[#8ba0a6] max-w-2xl font-normal pt-1">
          Complete timeline of meals recorded via computer vision recognition and dual-database ingredient matching.
        </p>
      </div>

      {/* ── 2. Full-Width Horizontal Segmented Control Strip ──── */}
      <div className="w-full bg-[#0b171b] border border-[#18282c] rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#18282c] overflow-hidden shadow-xl">
        {/* Column 1: Date Filter Input */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Filter by Calendar Date
          </span>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#081215] border border-[#18282c] text-xs">
            <Calendar size={13} className="text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer w-full"
            />
            {selectedDate && (
              <button onClick={clearFilter} className="text-[#8ba0a6] hover:text-white p-0.5 cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Column 2: Total Recorded Meals */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Recorded History
          </span>
          <div>
            <div className="text-base font-extrabold text-white tabular-num">
              {meals.length}{' '}
              <span className="text-xs font-normal text-[#8ba0a6]">meals retrieved</span>
            </div>
            <span className="text-[11px] text-[#566c73]">
              Page {page} of {totalPages}
            </span>
          </div>
        </div>

        {/* Column 3: Energy Logged */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Period Energy Logged
          </span>
          <div>
            <div className="text-base font-extrabold text-[#f59e0b] tabular-num">
              {Math.round(totalCaloriesDisplayed)}{' '}
              <span className="text-xs font-normal text-[#8ba0a6]">kcal</span>
            </div>
            <span className="text-[11px] text-[#566c73]">
              From visible list
            </span>
          </div>
        </div>

        {/* Column 4: Status Indicator */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Ledger Status
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-white">
              {selectedDate ? `Date: ${selectedDate}` : 'All Dates Active'}
            </span>
          </div>
          <span className="text-[11px] text-[#566c73]">
            Database Synced
          </span>
        </div>

        {/* Column 5: High-Contrast White Action Block */}
        <div className="p-3 sm:p-3 flex items-center justify-center bg-[#0e1d22] sm:bg-transparent">
          <button
            onClick={() => navigate('/log-meal')}
            className="w-full h-full min-h-[48px] py-3 px-5 rounded-xl bg-white text-black hover:bg-slate-200 transition-all font-extrabold text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
          >
            <Plus size={16} />
            <span>+ Log Meal</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#281014] border border-[#521c25] text-[#fb7185] text-xs flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── 3. Sidebar-Plus-Main-Content Composition ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Sidebar: Filters & Time Shortcuts ─────────── */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6]">
              Filter By Meal Type
            </h3>
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.map((cat) => {
                const isActive = selectedType === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedType(cat.id)}
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

          {/* Quick Date Filters */}
          <div className="health-card p-5 bg-[#0b171b] border-[#18282c] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6]">
              Quick Range Shortcuts
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const today = new Date().toLocaleDateString('en-CA');
                  setSelectedDate(today);
                  fetchMeals(1, false, today);
                }}
                className="w-full py-2 px-3 rounded-lg bg-[#081215] hover:bg-[#122227] text-white border border-[#18282c] text-xs font-semibold transition text-left flex items-center justify-between cursor-pointer"
              >
                <span>Today's Meals</span>
                <ArrowRight size={13} className="text-[#8ba0a6]" />
              </button>
              <button
                onClick={() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  const yStr = y.toLocaleDateString('en-CA');
                  setSelectedDate(yStr);
                  fetchMeals(1, false, yStr);
                }}
                className="w-full py-2 px-3 rounded-lg bg-[#081215] hover:bg-[#122227] text-white border border-[#18282c] text-xs font-semibold transition text-left flex items-center justify-between cursor-pointer"
              >
                <span>Yesterday's Meals</span>
                <ArrowRight size={13} className="text-[#8ba0a6]" />
              </button>
              {selectedDate && (
                <button
                  onClick={clearFilter}
                  className="w-full py-2 px-3 rounded-lg bg-[#271014] text-[#fb7185] hover:bg-[#39151c] border border-[#521c25] text-xs font-bold transition text-center cursor-pointer"
                >
                  Clear Date Filter
                </button>
              )}
            </div>
          </div>

          {/* Quick Action Navigation Card */}
          <div className="health-card p-5 bg-[#0b171b] border-[#18282c] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6]">
              Nutrition Tools
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => navigate('/coach')}
                icon={<Utensils size={13} className="text-emerald-400" />}
              >
                <span>Ask NutriCoach</span>
                <ArrowRight size={13} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => navigate('/dashboard')}
                icon={<History size={13} className="text-emerald-400" />}
              >
                <span>Daily Dashboard</span>
                <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        </aside>

        {/* ── Right Main Content Area: Structured Rows ────────── */}
        <section className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3 text-[#8ba0a6]">
              <Loader2 size={30} className="animate-spin text-emerald-400" />
              <span className="text-xs font-semibold text-white">
                Retrieving chronological meal records...
              </span>
            </div>
          ) : filteredMeals.length === 0 ? (
            <div className="health-card p-12 text-center bg-[#0b171b] border-[#18282c]">
              <div className="w-12 h-12 rounded-xl bg-[#081f18] border border-[#134937] flex items-center justify-center mx-auto mb-3 text-emerald-400">
                <Utensils size={22} />
              </div>
              <h3 className="text-base font-bold text-white">No historical meals found</h3>
              <p className="text-xs text-[#8ba0a6] mt-1 mb-6 max-w-sm mx-auto">
                {selectedDate
                  ? `No meals were logged on ${selectedDate}. Try selecting another date or clearing the filter.`
                  : 'You have not logged any meals yet. Scan your plate to start your metabolic history.'}
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/log-meal')}
                icon={<Plus size={14} />}
              >
                Log a Meal Now
              </Button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredMeals.map((meal) => {
                const dateObj = new Date(meal.logged_at);
                const dateFormatted = dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const timeFormatted = dateObj.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  /* Information-dense row matching reference */
                  <div
                    key={meal.meal_id}
                    className="health-card-interactive p-5 sm:p-6 bg-[#0b171b] border-[#18282c] hover:border-[#274047] grid grid-cols-1 md:grid-cols-12 gap-5 items-center group"
                  >
                    {/* Left: Thumbnail / Visual Badge (3-span) */}
                    <div className="md:col-span-3">
                      <div className="w-full h-28 sm:h-32 rounded-xl bg-gradient-to-tr from-[#081215] via-[#0f2127] to-[#142d34] border border-[#1d3238] flex flex-col items-center justify-center p-3 relative overflow-hidden group-hover:border-[#2d4d55] transition">
                        <div className="w-12 h-12 rounded-xl bg-[#0b171b]/80 border border-[#1f373e] flex items-center justify-center shadow-lg mb-2">
                          {getMealIcon(meal.meal_type)}
                        </div>
                        <span className="text-xs font-bold text-white capitalize">
                          {meal.meal_type}
                        </span>
                        <span className="text-[10px] text-[#8ba0a6] flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          <span>{timeFormatted}</span>
                        </span>

                        <div className="absolute top-2 right-2">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0e1f24] text-[#8ba0a6] border border-[#1d3238]">
                            #{meal.meal_id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Detailed Attributes (6-span) */}
                    <div className="md:col-span-6 space-y-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                            Logged on {dateFormatted}
                          </span>
                          <span className="text-[#566c73] text-xs">•</span>
                          <span className="text-xs text-[#8ba0a6] font-medium">
                            {meal.items?.length || 1} item{meal.items?.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-white capitalize mt-0.5 group-hover:text-emerald-300 transition-colors">
                          {meal.meal_type} Analysis
                        </h4>
                      </div>

                      {/* Macro Breakdown Strip */}
                      <div className="grid grid-cols-3 gap-2 py-1 text-center text-xs max-w-sm">
                        <div className="p-1.5 rounded-lg bg-[#081215] border border-[#18282c]">
                          <span className="text-[9px] text-[#f43f5e] font-bold block">Protein</span>
                          <span className="font-extrabold text-white tabular-num text-xs mt-0.5 block">
                            {Math.round(meal.total_protein_g || 0)}g
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[#081215] border border-[#18282c]">
                          <span className="text-[9px] text-[#f59e0b] font-bold block">Carbs</span>
                          <span className="font-extrabold text-white tabular-num text-xs mt-0.5 block">
                            {Math.round(meal.total_carbs_g || 0)}g
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-[#081215] border border-[#18282c]">
                          <span className="text-[9px] text-[#38bdf8] font-bold block">Fats</span>
                          <span className="font-extrabold text-white tabular-num text-xs mt-0.5 block">
                            {Math.round(meal.total_fat_g || 0)}g
                          </span>
                        </div>
                      </div>

                      {/* Items Pill List */}
                      {meal.items && meal.items.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {meal.items.map((item) => (
                            <span
                              key={item.item_id}
                              className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-[#081215] border border-[#18282c] text-[#8ba0a6]"
                            >
                              <span className="font-semibold text-white">{item.food_name}</span>{' '}
                              <span className="text-[#566c73]">({item.quantity_grams}g)</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Key Metric & Stacked Action Buttons (3-span) */}
                    <div className="md:col-span-3 flex flex-col sm:flex-row md:flex-col justify-between items-start md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#18282c]">
                      <div className="md:text-right">
                        <span className="text-[10px] font-bold text-[#8ba0a6] uppercase tracking-wider block">
                          Total Energy
                        </span>
                        <div className="text-2xl sm:text-3xl font-black text-white tabular-num leading-tight">
                          {Math.round(meal.total_calories)}
                          <span className="text-xs font-bold text-[#8ba0a6] ml-1">kcal</span>
                        </div>
                      </div>

                      <div className="flex md:flex-col gap-2 w-full sm:w-auto md:w-32">
                        <button
                          disabled={deletingId === meal.meal_id}
                          onClick={() => handleDelete(meal.meal_id)}
                          className="flex-1 md:w-full py-2 px-3 rounded-lg bg-[#271014] hover:bg-[#3b151d] text-[#fb7185] border border-[#521c25] text-xs font-bold transition flex items-center justify-between cursor-pointer disabled:opacity-50"
                          title="Delete Meal"
                        >
                          <span>{deletingId === meal.meal_id ? 'Deleting...' : 'Delete'}</span>
                          <Trash2 size={13} />
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

              {page < totalPages && (
                <div className="text-center pt-5">
                  <Button
                    variant="outline"
                    size="md"
                    disabled={loadingMore}
                    loading={loadingMore}
                    onClick={handleLoadMore}
                  >
                    {loadingMore ? 'Loading Older Meals...' : 'Load Older Meals'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
