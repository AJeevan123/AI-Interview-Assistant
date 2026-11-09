import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  MessageSquare, 
  Flame, 
  Code2, 
  Sparkles, 
  Layers,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { ScoreCard } from '../components/ScoreCard';

export const Progress = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await api.getProgress();
        setStats(data);
      } catch (err) {
        console.error('Failed to load progress:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400 text-sm">
        Loading analytics...
      </div>
    );
  }

  const categoryScores = [
    { title: 'Technical Accuracy', score: stats?.technical_average || 0, color: '#1684FF', icon: Code2 },
    { title: 'Communication Clarity', score: stats?.clarity_average || 0, color: '#A855F7', icon: Sparkles },
    { title: 'Answer Relevance', score: stats?.relevance_average || 0, color: '#10B981', icon: CheckCircle2 },
    { title: 'Answer Completeness', score: stats?.completeness_average || 0, color: '#F59E0B', icon: Layers },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1684FF]/15 border border-[#1684FF]/30 text-xs font-semibold text-[#1684FF] mb-2">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Performance Analytics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Your Interview Progress
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Track interview metrics, skill mastery across key competencies, and historical score evolution.
        </p>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Total Interviews"
          score={stats?.interviews_completed || 0}
          icon={CheckCircle2}
          color="#1684FF"
          subtitle="completed"
        />
        <ScoreCard
          title="Average Score"
          score={stats?.average_score || 0}
          icon={Award}
          color="#10B981"
          subtitle="composite"
        />
        <ScoreCard
          title="Best Score"
          score={stats?.best_score || 0}
          icon={Sparkles}
          color="#A855F7"
          subtitle="peak result"
        />
        <ScoreCard
          title="Questions Answered"
          score={stats?.questions_answered || 0}
          icon={MessageSquare}
          color="#F59E0B"
          subtitle="total responses"
        />
      </div>

      {/* Core Competency Breakdown */}
      <div className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-6 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-[#1684FF]" />
            <span>Category Performance Rubric</span>
          </h2>
          <span className="text-xs text-gray-400">Aggregated across all completed sessions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoryScores.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.title} className="p-4 rounded-xl bg-[#151922] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      {cat.title}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {cat.score}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#101318] h-2.5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${cat.score}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Trend Timeline */}
      <div className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Session History Timeline</span>
          </h2>
          <Link to="/history" className="text-xs text-[#1684FF] hover:text-blue-400 font-medium">
            View full history →
          </Link>
        </div>

        {stats?.history?.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No completed interviews yet to graph.</p>
        ) : (
          <div className="space-y-3">
            {(stats?.history || []).slice(0, 5).map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#151922] border border-white/5 hover:border-white/10 transition"
              >
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-white">
                    {item.role}
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    {item.type} • {item.date}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.score}%
                  </span>
                  <Link
                    to={`/interview/${item.id}/result`}
                    className="text-xs text-[#1684FF] hover:text-blue-400 p-1"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
