import React from 'react';
import { Bot, User, MessageSquare, Download, CheckCircle2, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';

export const getScoreBadgeStyle = (score) => {
  const num = Number(score);
  if (isNaN(num)) return null;
  if (num < 4.0) {
    return {
      tier: 'Low',
      badgeClass: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
      iconClass: 'bg-rose-500/20 text-rose-400',
      cardClass: 'bg-rose-500/5 border-rose-500/20',
      titleClass: 'text-rose-400'
    };
  } else if (num < 6.0) {
    return {
      tier: 'Needs Improvement',
      badgeClass: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      iconClass: 'bg-amber-500/20 text-amber-400',
      cardClass: 'bg-amber-500/5 border-amber-500/20',
      titleClass: 'text-amber-400'
    };
  } else if (num < 8.0) {
    return {
      tier: 'Good',
      badgeClass: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
      iconClass: 'bg-blue-500/20 text-blue-400',
      cardClass: 'bg-blue-500/5 border-blue-500/20',
      titleClass: 'text-blue-400'
    };
  } else {
    return {
      tier: 'Excellent',
      badgeClass: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      iconClass: 'bg-emerald-500/20 text-emerald-400',
      cardClass: 'bg-emerald-500/5 border-emerald-500/20',
      titleClass: 'text-emerald-400'
    };
  }
};

export const QuestionCard = ({
  questionNumber,
  questionText,
  topic,
  difficulty,
  isFollowUp,
  candidateAnswer,
  aiFeedback,
  score,
  strengths = [],
  areasToImprove = [],
  isDemoMode = undefined,
  onDownload,
  interactive = false
}) => {
  const badgeStyle = score !== undefined && score !== null ? getScoreBadgeStyle(score) : null;

  return (
    <div className="bg-[#101318] border border-white/10 rounded-2xl p-5 sm:p-6 transition-all shadow-md">
      {/* Question Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#1684FF]/20 text-[#1684FF] border border-[#1684FF]/30">
            Question {questionNumber}
          </span>
          {isFollowUp ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Follow-up
            </span>
          ) : null}
          {topic && (
            <span className="text-xs text-gray-400 bg-[#151922] px-2.5 py-0.5 rounded-md border border-white/5 hidden sm:inline">
              {topic}
            </span>
          )}
        </div>

        {score !== undefined && score !== null && (
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badgeStyle ? badgeStyle.badgeClass : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
              Score: {score}/10 {badgeStyle ? `• ${badgeStyle.tier}` : ''}
            </span>
            {isDemoMode !== undefined && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${isDemoMode ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-blue-500/10 text-blue-300 border-blue-500/20'}`}>
                {isDemoMode ? 'Demo AI Mode' : 'Live AI Mode'}
              </span>
            )}
            {onDownload && (
              <button
                onClick={onDownload}
                title="Download Question Report"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-[#151922] hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI Question Text */}
      <div className="flex items-start gap-3 mt-2">
        <div className="w-8 h-8 rounded-xl bg-[#1684FF]/20 text-[#1684FF] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm sm:text-base font-medium text-white leading-relaxed">
            {questionText}
          </h3>
        </div>
      </div>

      {/* Candidate Answer (if provided, for review mode) */}
      {candidateAnswer && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 bg-[#151922] p-3.5 rounded-xl border border-white/5">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Your Answer
            </div>
            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {candidateAnswer}
            </p>
          </div>
        </div>
      )}

      {/* AI Feedback */}
      {aiFeedback && (
        <div className="mt-3 flex items-start gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${badgeStyle ? badgeStyle.iconClass : 'bg-emerald-500/20 text-emerald-400'}`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className={`flex-1 border p-3.5 rounded-xl ${badgeStyle ? badgeStyle.cardClass : 'bg-emerald-500/5 border-emerald-500/15'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${badgeStyle ? badgeStyle.titleClass : 'text-emerald-400'}`}>
                AI Evaluation & Feedback {badgeStyle ? `(${badgeStyle.tier})` : ''}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {aiFeedback}
            </p>
            {/* Strengths & Areas to Improve lists if present */}
            {((strengths && strengths.length > 0) || (areasToImprove && areasToImprove.length > 0)) && (
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {strengths && strengths.length > 0 && (
                  <div>
                    <span className="font-semibold text-emerald-400">Strengths:</span>
                    <ul className="list-disc list-inside mt-1 text-gray-300 space-y-0.5">
                      {strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {areasToImprove && areasToImprove.length > 0 && (
                  <div>
                    <span className="font-semibold text-amber-400">Areas to Improve:</span>
                    <ul className="list-disc list-inside mt-1 text-gray-300 space-y-0.5">
                      {areasToImprove.map((a, idx) => <li key={idx}>{a}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

