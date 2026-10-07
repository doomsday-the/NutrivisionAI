import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, CheckCircle, Search, Edit2, X, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface FoodItem {
  food_id: number;
  name: string;
  brand?: string;
  reference_unit?: string;
  source?: { source_name: string };
}

export default function LogMeal() {
  const { token } = useAuth();
  const navigate = useNavigate();

  // Photo mode state
  const [file, setFile] = useState<File | null>(null);
  const [mealType, setMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Manual mode state
  const [manualMode, setManualMode] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualSearchResults, setManualSearchResults] = useState<FoodItem[]>([]);
  const [searchingManual, setSearchingManual] = useState(false);
  const [addingFoodId, setAddingFoodId] = useState<number | null>(null);
  const [manualQuantity, setManualQuantity] = useState<number>(100);
  const [submittingManual, setSubmittingManual] = useState(false);

  // Correction Modal State (for existing meal items)
  const [editingItem, setEditingItem] = useState<any>(null);
  const [correctionQuery, setCorrectionQuery] = useState('');
  const [correctionResults, setCorrectionResults] = useState<any[]>([]);
  const [searchingCorrection, setSearchingCorrection] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState<number | ''>('');
  const [correcting, setCorrecting] = useState(false);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('meal_type', mealType);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/meals/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...authHeaders,
        },
      });
      setAnalysisResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to analyze meal');
    } finally {
      setLoading(false);
    }
  };

  // Manual search debounced effect
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
        setManualSearchResults(res.data);
      } catch (err) {
        console.error('Manual search failed', err);
      } finally {
        setSearchingManual(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [manualSearchQuery, token]);

  // Handle adding a manual item
  const handleConfirmAddItem = async (food: FoodItem) => {
    if (!manualQuantity || manualQuantity <= 0) {
      alert('Please enter a valid quantity in grams.');
      return;
    }

    setSubmittingManual(true);
    setError('');

    try {
      let targetMealId = analysisResult?.meal_id;

      // If no meal exists yet, create one first
      if (!targetMealId) {
        const createMealRes = await axios.post(
          `${API_BASE_URL}/api/meals`,
          { meal_type: mealType },
          { headers: authHeaders }
        );
        targetMealId = createMealRes.data.meal_id;
      }

      // Add item to meal
      const addRes = await axios.post(
        `${API_BASE_URL}/api/meals/${targetMealId}/items`,
        {
          food_id: food.food_id,
          quantity_grams: Number(manualQuantity),
        },
        { headers: authHeaders }
      );

      setAnalysisResult(addRes.data);
      setAddingFoodId(null);
      setManualQuantity(100);
      setManualSearchQuery('');
      setManualSearchResults([]);
    } catch (err: any) {
      console.error('[Add Item Error]', err);
      setError(err.response?.data?.message || 'Failed to add food item to meal');
    } finally {
      setSubmittingManual(false);
    }
  };

  // Correction search debounced effect
  useEffect(() => {
    if (correctionQuery.trim().length < 2) {
      setCorrectionResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      try {
        setSearchingCorrection(true);
        const res = await axios.get(
          `${API_BASE_URL}/api/foods/search?q=${encodeURIComponent(correctionQuery.trim())}`,
          { headers: authHeaders }
        );
        setCorrectionResults(res.data);
      } catch (err) {
        console.error('Correction search failed', err);
      } finally {
        setSearchingCorrection(false);
      }
    }, 400);

    return () => clearTimeout(debounce);
  }, [correctionQuery, token]);

  const openCorrectionModal = (item: any) => {
    setEditingItem(item);
    setCorrectionQuery('');
    setCorrectionResults([]);
    setSelectedFood(null);
    setNewQuantity(item.quantity_grams);
  };

  const closeCorrectionModal = () => {
    setEditingItem(null);
  };

  const handleCorrectionSubmit = async () => {
    if (!selectedFood || !newQuantity) return;

    setCorrecting(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/meals/${analysisResult.meal_id}/items/${editingItem.item_id}`,
        {
          new_food_id: selectedFood.food_id,
          quantity_grams: Number(newQuantity),
        },
        { headers: authHeaders }
      );

      setAnalysisResult({
        ...analysisResult,
        total_calories: res.data.total_calories,
        total_protein_g: res.data.total_protein_g,
        total_carbs_g: res.data.total_carbs_g,
        total_fat_g: res.data.total_fat_g,
        items: res.data.items,
        meal_items: res.data.items,
      });
      closeCorrectionModal();
    } catch (err) {
      console.error('Correction failed', err);
      alert('Failed to correct item.');
    } finally {
      setCorrecting(false);
    }
  };

  // If a meal result is present (either from AI upload or manual creation)
  if (analysisResult) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center relative">
        <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
        <h1 className="text-2xl font-bold mb-1 text-gray-900">Meal Logged Successfully!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Here is your recorded meal. You can correct existing items or add more foods below.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-left">
            {error}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-xl text-left mb-6 border border-gray-100">
          <div className="flex justify-between items-center font-bold text-lg border-b border-gray-200 pb-2 mb-2">
            <span className="capitalize">{analysisResult.meal_type}</span>
            <span className="text-primary-600">{Math.round(analysisResult.total_calories)} kcal</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mb-4">
            <span>P: {Math.round(analysisResult.total_protein_g || 0)}g</span>
            <span>C: {Math.round(analysisResult.total_carbs_g || 0)}g</span>
            <span>F: {Math.round(analysisResult.total_fat_g || 0)}g</span>
          </div>

          <h3 className="font-semibold text-gray-800 text-sm mb-2">Meal Items:</h3>
          <ul className="space-y-2">
            {(analysisResult.items || analysisResult.meal_items)?.map((item: any, idx: number) => (
              <li
                key={idx}
                className="flex items-center justify-between bg-white p-3 border border-gray-200 rounded-lg shadow-2xs"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm flex items-center gap-2 text-gray-900">
                    {item.food_name || item.food?.name}
                    {item.user_corrected && (
                      <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                        Updated
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{item.quantity_grams}g</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-sm text-gray-800">
                    {Math.round(item.estimated_calories)} kcal
                  </div>
                  <button
                    onClick={() => openCorrectionModal(item)}
                    className="text-gray-400 hover:text-primary-600 p-1 rounded transition"
                    title="Correct this item"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Add more foods to this meal manually */}
        <div className="mb-6 text-left border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Add Another Food:</span>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search food to add (e.g., Rice, Dal, Milk)..."
              value={manualSearchQuery}
              onChange={(e) => setManualSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          {manualSearchQuery.length > 1 && (
            <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-40 bg-gray-50 mb-2">
              {searchingManual ? (
                <div className="p-3 text-xs text-gray-500 text-center">Searching...</div>
              ) : manualSearchResults.length === 0 ? (
                <div className="p-3 text-xs text-gray-500 text-center">No foods found.</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {manualSearchResults.map((food) => (
                    <li key={food.food_id} className="p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800">{food.name}</div>
                          <div className="text-gray-400 text-[11px]">{food.reference_unit}</div>
                        </div>
                        {addingFoodId !== food.food_id ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAddingFoodId(food.food_id);
                              setManualQuantity(100);
                            }}
                            className="bg-primary-50 text-primary-600 hover:bg-primary-100 px-2.5 py-1 rounded font-medium transition"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              value={manualQuantity}
                              onChange={(e) => setManualQuantity(Number(e.target.value))}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                            <span className="text-[11px] text-gray-500">g</span>
                            <button
                              type="button"
                              onClick={() => handleConfirmAddItem(food)}
                              disabled={submittingManual}
                              className="bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded font-medium disabled:opacity-50"
                            >
                              {submittingManual ? '...' : 'OK'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingFoodId(null)}
                              className="text-gray-400 hover:text-gray-600 px-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/history')}
            className="flex-1 bg-gray-100 text-gray-700 p-3 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            View History
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-primary-600 text-white p-3 rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Dashboard
          </button>
        </div>

        {/* Correction Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-left">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative flex flex-col max-h-[90vh]">
              <button
                onClick={closeCorrectionModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold mb-1">Correct Meal Item</h2>
              <p className="text-sm text-gray-500 mb-4">
                Replacing:{' '}
                <span className="font-semibold text-gray-800">
                  {editingItem.food_name || editingItem.food?.name}
                </span>
              </p>

              <div className="space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Food Database
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="e.g. Paneer, Rice, Apple..."
                      value={correctionQuery}
                      onChange={(e) => setCorrectionQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                  </div>
                </div>

                {correctionQuery.length > 1 && (
                  <div className="border rounded-lg overflow-y-auto max-h-48 bg-gray-50">
                    {searchingCorrection ? (
                      <div className="p-3 text-sm text-gray-500 text-center">Searching...</div>
                    ) : correctionResults.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">No foods found.</div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {correctionResults.map((food) => (
                          <li
                            key={food.food_id}
                            onClick={() => setSelectedFood(food)}
                            className={`p-3 cursor-pointer text-sm hover:bg-primary-50 transition ${
                              selectedFood?.food_id === food.food_id
                                ? 'bg-primary-100 font-medium text-primary-900'
                                : ''
                            }`}
                          >
                            <div className="font-semibold">{food.name}</div>
                            <div className="text-xs text-gray-500 flex justify-between">
                              <span>{food.brand || food.source?.source_name || 'Generic'}</span>
                              <span>{food.reference_unit}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {selectedFood && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity (grams)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newQuantity}
                        onChange={(e) =>
                          setNewQuantity(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>

                    <button
                      onClick={handleCorrectionSubmit}
                      disabled={!newQuantity || correcting}
                      className="w-full bg-primary-600 text-white p-2.5 rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50"
                    >
                      {correcting ? 'Updating...' : 'Confirm Correction'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pre-analysis View: Toggle between Photo Upload and Manual Search
  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          {manualMode ? <Search size={24} className="text-primary-600" /> : <Camera size={24} className="text-primary-600" />}
          {manualMode ? 'Manual Food Logging' : 'Log a Meal'}
        </h1>
        <button
          type="button"
          onClick={() => {
            setManualMode(!manualMode);
            setError('');
          }}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-200 transition"
        >
          {manualMode ? 'Switch to Photo Upload' : 'Search manually'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Meal Type Selector (Shared by both modes) */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      {manualMode ? (
        /* Manual Search Mode */
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Food Database
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search food by name (e.g., Rice, Dal, Egg, Apple)..."
                value={manualSearchQuery}
                onChange={(e) => setManualSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Type at least 2 characters to search the nutritional database.
            </p>
          </div>

          {manualSearchQuery.length > 1 && (
            <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-60 bg-gray-50">
              {searchingManual ? (
                <div className="p-4 text-sm text-gray-500 text-center">Searching foods...</div>
              ) : manualSearchResults.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">No foods matching "{manualSearchQuery}"</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {manualSearchResults.map((food) => (
                    <li key={food.food_id} className="p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800">{food.name}</div>
                          <div className="text-xs text-gray-400">
                            {food.brand || food.source?.source_name || 'Generic'} • {food.reference_unit}
                          </div>
                        </div>

                        {addingFoodId !== food.food_id ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAddingFoodId(food.food_id);
                              setManualQuantity(100);
                            }}
                            className="inline-flex items-center gap-1 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                          >
                            <Plus size={14} /> Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={manualQuantity}
                              onChange={(e) => setManualQuantity(Number(e.target.value))}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                            />
                            <span className="text-xs text-gray-500">g</span>
                            <button
                              type="button"
                              onClick={() => handleConfirmAddItem(food)}
                              disabled={submittingManual}
                              className="bg-primary-600 hover:bg-primary-700 text-white px-2.5 py-1 rounded text-xs font-semibold disabled:opacity-50"
                            >
                              {submittingManual ? 'Saving...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingFoodId(null)}
                              className="text-gray-400 hover:text-gray-600 p-1"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Photo Upload Mode */
        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Food Image</label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-primary-500 cursor-pointer transition">
              <Upload size={32} className="mb-2" />
              <input
                type="file"
                accept="image/jpeg, image/png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file ? (
                <span className="text-primary-600 font-semibold">{file.name}</span>
              ) : (
                <span>Click to upload or drag and drop</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-primary-600 text-white p-3 rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 transition"
          >
            {loading ? 'Analyzing with AI...' : 'Analyze Meal'}
          </button>
        </form>
      )}
    </div>
  );
}
