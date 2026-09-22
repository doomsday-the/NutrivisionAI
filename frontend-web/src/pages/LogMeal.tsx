import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload } from 'lucide-react';

export default function LogMeal() {
  const [file, setFile] = useState<File | null>(null);
  const [mealType, setMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('meal_type', mealType);

    try {
      await axios.post('http://localhost:3000/api/meals/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to analyze meal');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Camera /> Log a Meal</h1>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
          <select 
            value={mealType} 
            onChange={e => setMealType(e.target.value)}
            className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Food Image</label>
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-primary-500 cursor-pointer">
            <Upload size={32} className="mb-2" />
            <input 
              type="file" 
              accept="image/jpeg, image/png"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? <span className="text-primary-600 font-semibold">{file.name}</span> : <span>Click to upload or drag and drop</span>}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={!file || loading}
          className="w-full bg-primary-600 text-white p-3 rounded font-bold hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing with AI...' : 'Analyze Meal'}
        </button>
      </form>
    </div>
  );
}
