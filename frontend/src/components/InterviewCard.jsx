import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Calendar, CheckCircle2, ChevronRight, Clock, Layers } from 'lucide-react';

export const InterviewCard = ({ interview, onDownload }) => {
  const isCompleted = interview.status === 'completed';
  const score = interview.overall_score || 0;

  // Score badge color
  const getScoreColor = (sc) => {
    if (sc >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (sc >= 65) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  const formattedDate = interview.created_at
    ? new Date(interview.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Recent';

  return (
    <div className="bg-[#101318] border border-white/10 hover:border-[#1684FF]/40 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5 group flex flex-col justify-between">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#151922] text-blue-400 border border-blue-500/20">
            {interview.role}
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getScoreColor(score)}`}>
            {isCompleted ? `${score}% Score` : 'In Progress'}
          </span>
        </div>

        {/* Details row */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-4 mb-5">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-gray-500" />
            <span>{interview.interview_type} • {interview.difficulty}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
        <Link
          to={`/interview/${interview.id}/result`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1684FF] hover:text-blue-400 transition group-hover:translate-x-0.5"
        >
          <span>View Report</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>

        {onDownload && (
          <button
            onClick={() => onDownload(interview.id)}
            className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-lg bg-[#151922] hover:bg-white/10 transition"
          >
            Download
          </button>
        )}
      </div>
    </div>
  );
};
