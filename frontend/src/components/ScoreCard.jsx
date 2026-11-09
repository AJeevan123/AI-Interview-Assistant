import React from 'react';
import { motion } from 'framer-motion';

export const ScoreCard = ({ title, score, icon: Icon, color = '#1684FF', subtitle = '' }) => {
  const numericScore = typeof score === 'number' ? Math.round(score) : 0;

  return (
    <div className="bg-[#101318] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition">
      {/* Background soft glow */}
      <div
        className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs sm:text-sm font-medium text-gray-400">
          {title}
        </span>
        {Icon && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}15`, color: color }}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {numericScore}%
        </span>
        {subtitle && (
          <span className="text-xs text-gray-500 font-medium">
            {subtitle}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#151922] h-2 rounded-full overflow-hidden border border-white/5 mt-1">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, numericScore))}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};
