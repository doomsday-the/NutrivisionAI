import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Camera,
  Upload,
  Search,
  Edit2,
  X,
  Plus,
  Sparkles,
  AlertCircle,
  Coffee,
  Sun,
  Moon,
  Apple,
  Loader2,
  Scan,
  ArrowRight,
  Layers,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { Button, Badge } from '../components/ui';

interface FoodItem {
  food_id: number;
  name: string;
  brand?: string;
  category_name?: string;
  energy_kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

interface MealTypeOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

const MEAL_TYPES: MealTypeOption[] = [
  { value: 'breakfast', label: 'Breakfast', icon: <Coffee size={14} /> },
  { value: 'lunch', label: 'Lunch', icon: <Sun size={14} /> },
  { value: 'dinner', label: 'Dinner', icon: <Moon size={14} /> },
  { value: 'snack', label: 'Snack', icon: <Apple size={14} /> },
];

export default function LogMeal() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mealType, setMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Manual addition state
  const [manualMode, setManualMode] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualSearchResults, setManualSearchResults] = useState<FoodItem[]>([]);
  const [searchingManual, setSearchingManual] = useState(false);
  const [manualQuantity, setManualQuantity] = useState<number>(100);
  const [submittingManual, setSubmittingManual] = useState(false);

  // Correction Modal State
  const [editingItem, setEditingItem] = useState<any>(null);
  const [correctionQuery, setCorrectionQuery] = useState('');
  const [correctionResults, setCorrectionResults] = useState<FoodItem[]>([]);
  const [searchingCorrection, setSearchingCorrection] = useState(false);
  const [selectedCorrectionFood, setSelectedCorrectionFood] = useState<FoodItem | null>(null);
  const [newQuantity, setNewQuantity] = useState<number | ''>('');
  const [correcting, setCorrecting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  // Initialize query param search if passed from top nav
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setManualMode(true);
      setManualSearchQuery(q);
    }
  }, [searchParams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setError('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type === 'image/jpeg' || f.type === 'image/png')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setError('');
    }
  };

  const handleUploadAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('meal_type', mealType);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/meals/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...authHeaders },
      });
      setAnalysisResult(response.data);
      try {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith('nutricoach_insight_')) sessionStorage.removeItem(key);
        });
      } catch {}
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to analyze meal. Please check image format or try again.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced Food Search for Manual Add
  useEffect(() => {
    if (manualSearchQuery.trim().length < 2) {
      setManualSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchingManual(true);
        const res = await axios.get<FoodItem[]>(
          `${API_BASE_URL}/api/foods/search?q=${encodeURIComponent(manualSearchQuery.trim())}`,
          { headers: authHeaders }
        );
        setManualSearchResults(res.data || []);
      } catch (err) {
        console.error('Manual food search failed', err);
      } finally {
        setSearchingManual(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [manualSearchQuery, token]);

  // Debounced Food Search for Correction
  useEffect(() => {
    if (correctionQuery.trim().length < 2) {
      setCorrectionResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSearchingCorrection(true);
        const res = await axios.get<FoodItem[]>(
          `${API_BASE_URL}/api/foods/search?q=${encodeURIComponent(correctionQuery.trim())}`,
          { headers: authHeaders }
        );
        setCorrectionResults(res.data || []);
      } catch (err) {
        console.error('Correction search failed', err);
      } finally {
        setSearchingCorrection(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [correctionQuery, token]);

  const handleConfirmAddItem = async (food: FoodItem) => {
    if (!manualQuantity || manualQuantity <= 0) {
      alert('Please enter a valid portion in grams.');
      return;
    }

    setSubmittingManual(true);
    setError('');

    try {
      let targetMealId = analysisResult?.meal_id;
      if (!targetMealId) {
        const createMealRes = await axios.post(
          `${API_BASE_URL}/api/meals`,
          { meal_type: mealType },
          { headers: authHeaders }
        );
        targetMealId = createMealRes.data.meal_id;
      }

      const addRes = await axios.post(
        `${API_BASE_URL}/api/meals/${targetMealId}/items`,
        { food_id: food.food_id, quantity_grams: Number(manualQuantity) },
        { headers: authHeaders }
      );

      setAnalysisResult(addRes.data);
      try {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith('nutricoach_insight_')) sessionStorage.removeItem(key);
        });
      } catch {}
      setManualQuantity(100);
      setManualSearchQuery('');
      setManualSearchResults([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add food item to meal');
    } finally {
      setSubmittingManual(false);
    }
  };

  const openCorrectionModal = (item: any) => {
    setEditingItem(item);
    setNewQuantity(item.quantity_grams || 100);
    setCorrectionQuery('');
    setCorrectionResults([]);
    setSelectedCorrectionFood(null);
  };

  const handleSaveCorrection = async () => {
    if (!editingItem || !analysisResult?.meal_id) return;
    setCorrecting(true);

    try {
      const foodId = selectedCorrectionFood ? selectedCorrectionFood.food_id : (editingItem.food_id || editingItem.food?.food_id);
      const payload: any = {
        quantity_grams: Number(newQuantity) || editingItem.quantity_grams,
      };
      if (foodId) {
        payload.new_food_id = foodId;
      }

      const res = await axios.put(
        `${API_BASE_URL}/api/meals/${analysisResult.meal_id}/items/${editingItem.item_id}`,
        payload,
        { headers: authHeaders }
      );

      setAnalysisResult(res.data);
      try {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith('nutricoach_insight_')) sessionStorage.removeItem(key);
        });
      } catch {}
      setEditingItem(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust food portion.');
    } finally {
      setCorrecting(false);
    }
  };

  // If a meal has been analyzed/created, display the interactive results review view
  if (analysisResult) {
    const items = analysisResult.items || analysisResult.meal_items || [];

    return (
      <div className="space-y-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#8ba0a6]">
            <span className="text-emerald-400">✳</span>
            <span>Computer Vision Recognition Complete</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-[1.15]">
            Plate breakdown & macro analysis{' '}
            <span className="text-[#8ba0a6] font-normal">
              ready for confirmation
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[#8ba0a6] max-w-2xl font-normal pt-1">
            Review food segmentation, fine-tune portion weights, or add sides from the verified catalog.
          </p>
        </div>

        {/* Horizontal Control Strip in Results View */}
        <div className="w-full bg-[#0b171b] border border-[#18282c] rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#18282c] overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
              Total Caloric Intake
            </span>
            <div className="text-2xl font-black text-white tabular-num">
              {Math.round(analysisResult.total_calories || 0)}{' '}
              <span className="text-xs font-normal text-[#8ba0a6]">kcal</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
              Protein
            </span>
            <div className="text-xl font-extrabold text-[#f43f5e] tabular-num">
              {Math.round(analysisResult.total_protein_g || 0)}g
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
              Carbohydrates
            </span>
            <div className="text-xl font-extrabold text-[#f59e0b] tabular-num">
              {Math.round(analysisResult.total_carbs_g || 0)}g
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
              Fats
            </span>
            <div className="text-xl font-extrabold text-[#38bdf8] tabular-num">
              {Math.round(analysisResult.total_fat_g || 0)}g
            </div>
          </div>

          <div className="p-3 sm:p-3 flex items-center justify-center bg-[#0e1d22] sm:bg-transparent">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full h-full min-h-[48px] py-3 px-5 rounded-xl bg-white text-black hover:bg-slate-200 transition-all font-extrabold text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
            >
              <span>Done & Return</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Sidebar + Main Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar: Photo Preview & Summary */}
          <aside className="lg:col-span-4 space-y-6">
            {preview && (
              <div className="health-card p-4 bg-[#0b171b] border-[#18282c] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6] block">
                  Plate Visual Source
                </span>
                <div className="relative rounded-xl overflow-hidden border border-[#18282c]">
                  <img
                    src={preview}
                    alt="Analyzed Plate"
                    className="w-full h-56 object-cover object-center"
                  />
                  {items.map((item: any, idx: number) => {
                    if (item.bbox && typeof item.bbox.x === 'number') {
                      return (
                        <div
                          key={idx}
                          className="absolute border-2 border-emerald-400 bg-emerald-500/10 rounded pointer-events-none"
                          style={{
                            left: `${item.bbox.x}%`,
                            top: `${item.bbox.y}%`,
                            width: `${item.bbox.width}%`,
                            height: `${item.bbox.height}%`,
                          }}
                        >
                          <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-black whitespace-nowrap">
                            {item.food_name}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}

            <div className="health-card p-5 bg-[#0b171b] border-[#18282c] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6] block">
                Next Step
              </span>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setAnalysisResult(null);
                  setFile(null);
                  setPreview(null);
                }}
              >
                Scan Another Plate
              </Button>
            </div>
          </aside>

          {/* Right Main Content: Ingredients & Add Side Items */}
          <section className="lg:col-span-8 space-y-6">
            {/* Detected Items List */}
            <div className="health-card p-6 bg-[#0b171b] border-[#18282c] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#18282c]">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers size={15} className="text-emerald-400" />
                  <span>Detected Ingredients ({items.length})</span>
                </h3>
                <Badge variant="emerald" size="sm">
                  Verified
                </Badge>
              </div>

              {items.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#281a06] border border-[#543609] text-center space-y-1">
                  <p className="text-xs font-bold text-[#fbbf24]">No food items detected in this photo.</p>
                  <p className="text-[11px] text-[#f59e0b]">Use the search tool below to manually add your meal items.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#081215] border border-[#18282c] hover:border-[#274047] transition flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white truncate">
                            {item.food_name || item.food?.name}
                          </span>
                          {item.user_corrected && (
                            <Badge variant="amber" size="sm">
                              Adjusted
                            </Badge>
                          )}
                          {typeof item.confidence === 'number' && item.confidence < 1 && (
                            <Badge variant="emerald" size="sm">
                              {Math.round(item.confidence * 100)}% conf
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-[#8ba0a6] mt-1 flex items-center gap-2 tabular-num">
                          <span>{item.quantity_grams}g portion</span>
                          <span>•</span>
                          <span className="text-white font-bold">{Math.round(item.estimated_calories)} kcal</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCorrectionModal(item)}
                        icon={<Edit2 size={12} />}
                      >
                        Adjust Portion
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Side Dish Search */}
            <div className="health-card p-6 bg-[#0b171b] border-[#18282c] space-y-4">
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Add Side Dish or Beverage
                </h3>
              </div>
              <p className="text-xs text-[#8ba0a6]">
                Query Indian ICMR-IFCT & USDA verified food catalogs.
              </p>

              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-[#566c73]" size={14} />
                <input
                  type="text"
                  placeholder="Search side item (e.g. Rice, Dal, Curd, Chutney, Salad)..."
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#18282c] bg-[#081215] text-xs text-white placeholder-[#566c73] outline-none focus:border-white/30"
                />
              </div>

              {searchingManual && (
                <div className="p-3 text-center text-xs text-[#8ba0a6] flex items-center justify-center gap-2">
                  <Loader2 size={13} className="animate-spin text-emerald-400" />
                  Searching food database...
                </div>
              )}

              {manualSearchResults.length > 0 && (
                <div className="max-h-56 overflow-y-auto space-y-1.5 p-1 rounded-xl bg-[#081215] border border-[#18282c]">
                  {manualSearchResults.map((food) => (
                    <div
                      key={food.food_id}
                      className="p-2.5 rounded-lg hover:bg-[#0e1d22] flex items-center justify-between text-xs transition border border-transparent hover:border-[#1d3238]"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-bold text-white block truncate">{food.name}</span>
                        <span className="text-[#8ba0a6] text-[10px] tabular-num">
                          {Math.round(food.energy_kcal || 0)} kcal / 100g
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={10}
                          max={2000}
                          defaultValue={100}
                          onChange={(e) => setManualQuantity(Number(e.target.value))}
                          className="w-16 px-2 py-1 rounded bg-[#0b171b] border border-[#18282c] text-right text-xs text-white tabular-num outline-none"
                        />
                        <span className="text-[#8ba0a6] text-[10px]">g</span>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={submittingManual}
                          onClick={() => handleConfirmAddItem(food)}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Correction Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
            <div className="health-card p-6 sm:p-7 max-w-md w-full space-y-4 bg-[#0b171b] border-[#1d3238] shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#18282c]">
                <h3 className="font-bold text-sm text-white">Adjust Food Portion</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1 rounded-lg text-[#8ba0a6] hover:text-white hover:bg-[#122227] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8ba0a6] block mb-1">
                  Serving Weight (Grams)
                </label>
                <input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#18282c] bg-[#081215] text-xs font-bold text-white tabular-num outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8ba0a6] block mb-1">
                  Replace Item Match (Optional)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-[#566c73]" size={14} />
                  <input
                    type="text"
                    placeholder="Search replacement..."
                    value={correctionQuery}
                    onChange={(e) => setCorrectionQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#18282c] bg-[#081215] text-xs text-white placeholder-[#566c73] outline-none focus:border-white/30"
                  />
                </div>

                {searchingCorrection && (
                  <div className="p-3 text-center text-xs text-[#8ba0a6] flex items-center justify-center gap-2">
                    <Loader2 size={13} className="animate-spin text-emerald-400" />
                    Searching alternatives...
                  </div>
                )}

                {correctionResults.length > 0 && (
                  <div className="max-h-36 overflow-y-auto mt-2 space-y-1 p-1 rounded-xl bg-[#081215] border border-[#18282c]">
                    {correctionResults.map((food) => (
                      <button
                        key={food.food_id}
                        type="button"
                        onClick={() => setSelectedCorrectionFood(food)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition flex justify-between cursor-pointer ${
                          selectedCorrectionFood?.food_id === food.food_id
                            ? 'bg-white text-black font-bold'
                            : 'hover:bg-[#122227] text-white'
                        }`}
                      >
                        <span>{food.name}</span>
                        <span className="tabular-num">{Math.round(food.energy_kcal || 0)} kcal</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#18282c]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={correcting}
                  onClick={handleSaveCorrection}
                >
                  Save Adjustments
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Primary Ingestion View: Camera AI Scanner vs Database Search
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── 1. Hero Section & Oversized Heading ───────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#8ba0a6]">
          <span className="text-emerald-400">✳</span>
          <span>Computer Vision Ingestion Studio</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white leading-[1.15]">
          Scan your plate or search foods{' '}
          <span className="text-[#8ba0a6] font-normal">
            to instantly log macros
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-[#8ba0a6] max-w-2xl font-normal pt-1">
          Dual-pipeline intake: deep learning visual plate segmentation combined with USDA & ICMR-IFCT food indexing.
        </p>
      </div>

      {/* ── 2. Full-Width Horizontal Segmented Control Strip ──── */}
      <div className="w-full bg-[#0b171b] border border-[#18282c] rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#18282c] overflow-hidden shadow-xl">
        {/* Column 1: Mode Switcher */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Input Modality
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <button
              onClick={() => setManualMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                !manualMode ? 'bg-white text-black' : 'text-[#8ba0a6] hover:text-white hover:bg-[#122227]'
              }`}
            >
              <Camera size={13} />
              <span>Camera</span>
            </button>
            <button
              onClick={() => setManualMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                manualMode ? 'bg-white text-black' : 'text-[#8ba0a6] hover:text-white hover:bg-[#122227]'
              }`}
            >
              <Search size={13} />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Column 2: Meal Time Picker */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Meal Classification
          </span>
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {MEAL_TYPES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMealType(m.value)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition cursor-pointer capitalize ${
                  mealType === m.value
                    ? 'bg-emerald-400 text-black'
                    : 'text-[#8ba0a6] hover:text-white hover:bg-[#122227]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Column 3: Model State */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Vision Engine
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white">YOLO + Gemini Vision</span>
          </div>
          <span className="text-[11px] text-[#566c73]">Depth & Volume Math</span>
        </div>

        {/* Column 4: Portion Standard */}
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6] block mb-1">
            Portion Metric
          </span>
          <div className="text-xs font-bold text-white">
            Weight in Grams (g)
          </div>
          <span className="text-[11px] text-[#566c73]">Dual Database Standards</span>
        </div>

        {/* Column 5: High-Contrast White Action Block */}
        <div className="p-3 sm:p-3 flex items-center justify-center bg-[#0e1d22] sm:bg-transparent">
          <button
            onClick={() => {
              if (!manualMode && file) {
                handleUploadAndAnalyze({ preventDefault: () => {} } as any);
              } else if (!manualMode && !file) {
                fileInputRef.current?.click();
              } else {
                setManualMode(!manualMode);
              }
            }}
            disabled={loading}
            className="w-full h-full min-h-[48px] py-3 px-5 rounded-xl bg-white text-black hover:bg-slate-200 transition-all font-extrabold text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin text-black" />
            ) : (
              <Sparkles size={16} />
            )}
            <span>{loading ? 'Analyzing...' : !manualMode ? (file ? 'Analyze Plate' : 'Pick Image') : 'Search DB'}</span>
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
        {/* ── Left Sidebar: Quick Presets & Ingestion Guidelines ── */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Meal Time Selector Card */}
          <div className="health-card p-5 bg-[#0b171b] border-[#18282c] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6]">
              Select Meal Time
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map((option) => {
                const isSelected = mealType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMealType(option.value)}
                    className={`p-3 rounded-xl border transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black font-extrabold border-white shadow-xs'
                        : 'bg-[#081215] text-[#8ba0a6] hover:text-white border-[#18282c]'
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span className="text-xs capitalize">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vision Best Practices */}
          <div className="health-card p-5 bg-[#0b171b] border-[#18282c] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8ba0a6] flex items-center gap-1.5">
              <Info size={13} className="text-emerald-400" />
              <span>Vision Recognition Tips</span>
            </h3>
            <ul className="space-y-2 text-xs text-[#8ba0a6]">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Top-down 45° angle provides optimal depth calculation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Ensure bright lighting without harsh single-direction shadows</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Include entire rim of plate for volume estimation</span>
              </li>
            </ul>
          </div>
        </aside>

        {/* ── Right Main Content Area: Viewfinder / Manual Search ─ */}
        <section className="lg:col-span-8 space-y-6">
          {!manualMode ? (
            /* Mode A: Photo AI Scanner */
            <form onSubmit={handleUploadAndAnalyze} className="space-y-5">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-150 overflow-hidden ${
                  preview
                    ? 'border-emerald-400/80 bg-[#081f18]/30'
                    : 'border-[#18282c] bg-[#0b171b] hover:border-[#2b444b] hover:bg-[#0e1d22]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {preview ? (
                  <div className="space-y-4">
                    <div className="relative max-h-80 w-full rounded-xl overflow-hidden mx-auto border border-[#1d3238] shadow-2xl">
                      <img
                        src={preview}
                        alt="Plate Preview"
                        className="w-full h-80 object-cover object-center"
                      />
                      {loading && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                          <Scan size={44} className="text-emerald-400 animate-pulse" />
                          <div className="text-center">
                            <span className="text-base font-black text-white block">
                              Scanning Ingredients...
                            </span>
                            <span className="text-xs text-emerald-300 font-medium">
                              Computer Vision & Depth Estimation
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#8ba0a6]">
                      Click or drag another food photo to replace
                    </p>
                  </div>
                ) : (
                  <div className="py-12 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#081f18] border border-[#134937] flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
                      <Upload size={26} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Upload or Drag Plate Photograph
                      </h3>
                      <p className="text-xs text-[#8ba0a6] mt-1">
                        High resolution JPEG or PNG formats supported
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#081215] border border-[#18282c] text-xs font-medium text-emerald-400">
                      <Sparkles size={12} />
                      <span>Auto-detects ingredients, portions, calories & macros</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!file || loading}
                className="w-full py-4 px-6 rounded-xl bg-white text-black hover:bg-slate-200 transition font-black text-sm tracking-tight flex items-center justify-center gap-2 cursor-pointer shadow-xl disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-black" />
                    <span>Analyzing Plate Ingredients...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Analyze Meal Plate with AI</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Mode B: Manual Database Search */
            <div className="health-card p-6 sm:p-7 bg-[#0b171b] border-[#18282c] space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                  Dual-Source Food Database
                </h3>
                <p className="text-xs text-[#8ba0a6]">
                  Search verified Indian ICMR IFCT & USDA nutritional items.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-[#566c73]" size={15} />
                <input
                  type="text"
                  placeholder="Search ingredient (e.g. Boiled Rice, Dal Tadka, Dosa, Paneer, Chicken Breast)..."
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#18282c] bg-[#081215] text-xs text-white placeholder-[#566c73] outline-none focus:border-white/40"
                />
              </div>

              {searchingManual && (
                <div className="py-8 text-center text-xs text-[#8ba0a6] flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-emerald-400" />
                  Searching verified nutritional entries...
                </div>
              )}

              {manualSearchResults.length > 0 && (
                <div className="max-h-80 overflow-y-auto space-y-2 p-1">
                  {manualSearchResults.map((food) => (
                    <div
                      key={food.food_id}
                      className="p-3.5 rounded-xl bg-[#081215] border border-[#18282c] hover:border-[#274047] flex items-center justify-between gap-3 text-xs transition"
                    >
                      <div>
                        <span className="font-bold text-white block text-sm">{food.name}</span>
                        <span className="text-[11px] text-[#8ba0a6] tabular-num">
                          {Math.round(food.energy_kcal || 0)} kcal • P: {food.protein_g || 0}g • C: {food.carbs_g || 0}g • F: {food.fat_g || 0}g (per 100g)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={10}
                          defaultValue={100}
                          onChange={(e) => setManualQuantity(Number(e.target.value))}
                          className="w-16 px-2 py-1.5 rounded-lg bg-[#0b171b] border border-[#18282c] text-right text-xs text-white tabular-num outline-none"
                        />
                        <span className="text-[#8ba0a6] text-[10px]">g</span>
                        <button
                          disabled={submittingManual}
                          onClick={() => handleConfirmAddItem(food)}
                          className="py-1.5 px-3 rounded-lg bg-white text-black hover:bg-slate-200 text-xs font-bold cursor-pointer transition disabled:opacity-50"
                        >
                          Log
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
