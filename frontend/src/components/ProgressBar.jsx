import React from 'react';
import { motion } from 'framer-motion';

export const ProgressBar = ({ current, total, label = '' }) => {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
        <span>{label || `Question ${current} of ${total}`}</span>
        <span className="text-[#1684FF] font-semibold">{percentage}%</span>
      </div>
      <div className="w-full h-2.5 bg-[#151922] border border-white/5 rounded-full overflow-hidden p-0.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-[#1684FF] to-blue-400 rounded-full shadow-sm"
        />
      </div>
    </div>
  );
};
