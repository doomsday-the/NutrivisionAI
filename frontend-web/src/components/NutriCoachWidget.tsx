import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Lightbulb,
  Utensils,
  Target,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';

export interface CoachInsight {
  advice: string;
  badge: string;
  summary: string;
  suggestions: string[];
  macro_critique: string;
  next_meal_tip: string;
  context: {
    date: string;
    total_calories: number;
    target_calories: number;
    remaining_calories: number;
    calorie_status: string;
    total_protein_g: number;
    total_carbs_g: number;
    total_fat_g: number;
    meals_count: number;
  };
}

interface NutriCoachWidgetProps {
  insight: CoachInsight | null;
  loading: boolean;
  onRefresh: () => void;
  mealsCount: number;
}

export default function NutriCoachWidget({
  insight,
  loading,
  onRefresh,
  mealsCount,
}: NutriCoachWidgetProps) {
  const navigate = useNavigate();
  const [showFullAdvice, setShowFullAdvice] = useState(false);

  // Status badge color scheme
  const getBadgeStyle = (badge: string) => {
    const b = badge.toLowerCase();
    if (b.includes('protein') || b.includes('attention') || b.includes('boost')) {
      return 'bg-amber-100 text-amber-900 border-amber-300';
    }
    if (b.includes('limit') || b.includes('exceeded') || b.includes('over')) {
      return 'bg-rose-100 text-rose-900 border-rose-300';
    }
    return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-[#ffffff] via-[#fcfbf7] to-[#f4f8f4] border border-emerald-200/80 shadow-md shadow-emerald-950/5">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-200/15 rounded-full blur-3xl pointer-events-none -mb-20" />

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200/70">
        <div className="flex items-center gap-3.5">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 flex-shrink-0">
            <Bot size={22} />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-stone-900">
                NutriCoach AI Daily Insight
              </h3>
              {insight?.badge && (
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs tracking-wide uppercase ${getBadgeStyle(
                    insight.badge
                  )}`}
                >
                  {insight.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              {loading
                ? 'Calibrating personalized dietary feedback...'
                : mealsCount > 0
                ? `Automated real-time critique on your ${mealsCount} logged meal${mealsCount > 1 ? 's' : ''}`
                : 'Awaiting meals to formulate recommendations'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => navigate('/coach')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/90 text-xs font-bold text-stone-700 transition shadow-2xs hover:border-emerald-300"
            title="Open Interactive Chat Coach"
          >
            <MessageSquare size={13} className="text-emerald-600" />
            <span>Chat with Coach</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/90 text-stone-500 hover:text-stone-900 transition shadow-2xs disabled:opacity-50"
            title="Refresh Coach Advice"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-emerald-600' : ''} />
          </button>
        </div>
      </div>

      {/* ── Body Content ───────────────────────────────────── */}
      <div className="relative pt-5">
        {loading && !insight ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-stone-500">
            <RefreshCw size={24} className="animate-spin text-emerald-600" />
            <span className="text-xs font-bold text-stone-600">
              NutriCoach is reading today's plate and crafting Indian food swaps...
            </span>
          </div>
        ) : mealsCount === 0 && (!insight || insight.context.total_calories === 0) ? (
          /* Empty Plate State */
          <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-800">
                  Ready to analyze today's nutrition!
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  Log your first meal via photo or manual search, and NutriCoach will instantly critique your macros and recommend healthy Indian swaps.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/log-meal')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-700/20 transition flex-shrink-0"
            >
              <span>Log Meal to Trigger AI</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          /* Active Insight State */
          <div className="space-y-4">
            {/* Executive Summary Callout */}
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-stone-200/90 shadow-2xs">
              <p className="text-xs sm:text-sm font-medium text-stone-800 leading-relaxed">
                {insight?.summary}
              </p>
            </div>

            {/* Suggestions & Swaps Grid */}
            {insight?.suggestions && insight.suggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Lightbulb size={14} className="text-amber-600" />
                  <span className="text-xs font-black uppercase tracking-wider text-stone-600">
                    Recommended Indian Food Swaps & Additions
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {insight.suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white border border-stone-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition flex gap-2.5 items-start group"
                    >
                      <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-emerald-200 transition-colors">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-stone-700 font-semibold leading-snug">
                        {suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Dual-Panel: Next Meal & Macro Critique */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Next Meal Strategy */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                <div className="flex items-center gap-1.5 mb-1 text-emerald-900">
                  <Utensils size={13} className="text-emerald-700" />
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Next Meal Recommendation
                  </span>
                </div>
                <p className="text-xs text-stone-700 font-medium leading-relaxed">
                  {insight?.next_meal_tip}
                </p>
              </div>

              {/* Macro & Pacing Critique */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center gap-1.5 mb-1 text-amber-900">
                  <Target size={13} className="text-amber-700" />
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Macro Critique & Pace
                  </span>
                </div>
                <p className="text-xs text-stone-700 font-medium leading-relaxed">
                  {insight?.macro_critique}
                </p>
              </div>
            </div>

            {/* Expandable Full Coaching Commentary */}
            {insight?.advice && (
              <div className="pt-1">
                <button
                  onClick={() => setShowFullAdvice(!showFullAdvice)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 transition"
                >
                  <span>{showFullAdvice ? 'Hide full coaching notes' : 'Read full coaching notes'}</span>
                  {showFullAdvice ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showFullAdvice && (
                  <div className="mt-3 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed whitespace-pre-line animate-fade-in font-medium">
                    {insight.advice}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
