import { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Flame, Utensils } from 'lucide-react';

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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/activity/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      }
    };
    fetchDashboard();
  }, []);

  if (!data) return <div className="text-center py-10">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Today's Summary</h1>
      
      {/* Calories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
          <div className="text-sm text-gray-500 font-semibold mb-1">TARGET</div>
          <div className="text-3xl font-bold">{data.target_calories}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-green-500">
          <div className="text-sm text-gray-500 font-semibold mb-1 flex items-center gap-1"><Utensils size={14}/> EATEN</div>
          <div className="text-3xl font-bold">{data.total_calories}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-orange-500">
          <div className="text-sm text-gray-500 font-semibold mb-1 flex items-center gap-1"><Flame size={14}/> BURNED</div>
          <div className="text-3xl font-bold">{data.calories_burned}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-primary-500">
          <div className="text-sm text-gray-500 font-semibold mb-1">REMAINING</div>
          <div className="text-3xl font-bold text-primary-600">{data.remaining_calories}</div>
        </div>
      </div>

      {/* Macros Overview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Macronutrients</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-gray-500 text-sm">Protein</div>
            <div className="text-2xl font-bold text-blue-600">{data.total_protein_g}g</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Carbs</div>
            <div className="text-2xl font-bold text-yellow-500">{data.total_carbs_g}g</div>
          </div>
          <div>
            <div className="text-gray-500 text-sm">Fat</div>
            <div className="text-2xl font-bold text-red-500">{data.total_fat_g}g</div>
          </div>
        </div>
      </div>

      {/* Meals List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Logged Meals</h2>
        {data.meals.length === 0 ? (
          <p className="text-gray-500 italic">No meals logged today.</p>
        ) : (
          <div className="space-y-3">
            {data.meals.map((meal, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 border rounded">
                <span className="capitalize font-semibold">{meal.meal_type}</span>
                <span className="text-primary-600 font-bold">{meal.total_calories} kcal</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
