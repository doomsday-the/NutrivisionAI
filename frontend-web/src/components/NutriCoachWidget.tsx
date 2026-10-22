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
import { Button, Badge } from './ui';

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

  const getBadgeVariant = (badge: string): 'amber' | 'rose' | 'emerald' => {
    const b = badge.toLowerCase();
    if (b.includes('protein') || b.includes('attention') || b.includes('boost')) {
      return 'amber';
    }
    if (b.includes('limit') || b.includes('exceeded') || b.includes('over')) {
      return 'rose';
    }
    return 'emerald';
  };

  return (
    <div className="health-card p-6 sm:p-7 relative overflow-hidden bg-[#0b171b] border-[#18282c]">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#18282c]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#09221a] border border-[#114b38] flex items-center justify-center text-[#34d399] shrink-0">
            <Bot size={20} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold tracking-tight text-white">
                NutriCoach Intelligence
              </h3>
              {insight?.badge && (
                <Badge variant={getBadgeVariant(insight.badge)} size="sm">
                  {insight.badge}
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#8ba0a6] font-normal mt-0.5">
              {loading
                ? 'Calibrating personalized dietary feedback...'
                : mealsCount > 0
                ? `Real-time critique for your ${mealsCount} logged meal${mealsCount > 1 ? 's' : ''}`
                : 'Awaiting meal logs to formulate dietary recommendations'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/coach')}
            icon={<MessageSquare size={13} className="text-[#34d399]" />}
          >
            Chat with Coach
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Coach Advice"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-[#34d399]' : 'text-[#8ba0a6]'} />
          </Button>
        </div>
      </div>

      {/* ── Body Content ───────────────────────────────────── */}
      <div className="pt-5">
        {loading && !insight ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#8ba0a6]">
            <RefreshCw size={22} className="animate-spin text-[#34d399]" />
            <span className="text-xs font-semibold text-white">
              NutriCoach is reading today's plate and analyzing nutritional balance...
            </span>
          </div>
        ) : mealsCount === 0 && (!insight || insight.context.total_calories === 0) ? (
          /* Empty Plate State */
          <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#082018] border border-[#114b38] flex items-center justify-center text-[#34d399] shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Ready to analyze today's nutrition
                </p>
                <p className="text-xs text-[#8ba0a6] mt-0.5">
                  Log your first meal via camera or manual search, and NutriCoach will evaluate your macros and suggest healthy meal swaps.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/log-meal')}
              className="shrink-0"
            >
              <span>Log Meal to Trigger AI</span>
              <ArrowRight size={13} className="ml-1" />
            </Button>
          </div>
        ) : (
          /* Active Insight State */
          <div className="space-y-4">
            {/* Executive Summary Callout */}
            <div className="p-4 rounded-xl bg-[#081215] border border-[#18282c]">
              <p className="text-xs sm:text-sm font-medium text-white leading-relaxed">
                {insight?.summary}
              </p>
            </div>

            {/* Suggestions & Swaps Grid */}
            {insight?.suggestions && insight.suggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Lightbulb size={13} className="text-[#f59e0b]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8ba0a6]">
                    Recommended Food Swaps & Additions
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {insight.suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#081215] border border-[#18282c] hover:border-[#2b444b] transition-all duration-150 flex gap-2.5 items-start group"
                    >
                      <div className="w-5 h-5 rounded-md bg-[#0a271e] text-[#34d399] border border-[#135740] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-white font-medium leading-snug">
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
              <div className="p-3.5 rounded-xl bg-[#081215] border border-[#18282c]">
                <div className="flex items-center gap-1.5 mb-1 text-[#34d399]">
                  <Utensils size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Next Meal Recommendation
                  </span>
                </div>
                <p className="text-xs text-[#8ba0a6] font-medium leading-relaxed">
                  {insight?.next_meal_tip}
                </p>
              </div>

              {/* Macro & Pacing Critique */}
              <div className="p-3.5 rounded-xl bg-[#081215] border border-[#18282c]">
                <div className="flex items-center gap-1.5 mb-1 text-[#fbbf24]">
                  <Target size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Macro Critique & Pace
                  </span>
                </div>
                <p className="text-xs text-[#8ba0a6] font-medium leading-relaxed">
                  {insight?.macro_critique}
                </p>
              </div>
            </div>

            {/* Expandable Full Coaching Commentary */}
            {insight?.advice && (
              <div className="pt-1">
                <button
                  onClick={() => setShowFullAdvice(!showFullAdvice)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#34d399] hover:text-[#10b981] transition cursor-pointer"
                >
                  <span>{showFullAdvice ? 'Hide detailed coaching commentary' : 'Read detailed coaching commentary'}</span>
                  {showFullAdvice ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showFullAdvice && (
                  <div className="mt-3 p-4 rounded-xl bg-[#081215] border border-[#18282c] text-xs text-white leading-relaxed whitespace-pre-line font-normal">
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
