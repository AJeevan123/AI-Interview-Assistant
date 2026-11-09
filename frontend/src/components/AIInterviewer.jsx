import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Mic, Volume2, Loader2, CheckCircle } from 'lucide-react';

export const AIInterviewer = ({ state = 'IDLE', message = '', size = 'large' }) => {
  // States: 'IDLE' | 'THINKING' | 'SPEAKING' | 'LISTENING' | 'PROCESSING'
  
  const stateConfig = {
    IDLE: {
      text: "Ready when you are.",
      color: "#1684FF",
      glow: "rgba(22, 132, 255, 0.3)",
      badge: "AI Interviewer • Online",
      icon: Bot,
    },
    THINKING: {
      text: "Thinking...",
      color: "#38BDF8",
      glow: "rgba(56, 189, 248, 0.4)",
      badge: "AI Interviewer • Analyzing",
      icon: Sparkles,
    },
    SPEAKING: {
      text: "AI is asking...",
      color: "#60A5FA",
      glow: "rgba(96, 165, 250, 0.5)",
      badge: "AI Interviewer • Speaking",
      icon: Volume2,
    },
    LISTENING: {
      text: "Listening...",
      color: "#10B981",
      glow: "rgba(16, 185, 129, 0.5)",
      badge: "AI Interviewer • Listening",
      icon: Mic,
    },
    PROCESSING: {
      text: "Evaluating your answer...",
      color: "#F59E0B",
      glow: "rgba(245, 158, 11, 0.4)",
      badge: "AI Interviewer • Evaluating",
      icon: Loader2,
    }
  };

  const current = stateConfig[state] || stateConfig.IDLE;
  const StateIcon = current.icon;

  const isLarge = size === 'large';
  const avatarSizeClass = isLarge ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-16 h-16';
  const iconSizeClass = isLarge ? 'w-12 h-12' : 'w-8 h-8';

  return (
    <div className="flex flex-col items-center justify-center text-center select-none py-2">
      {/* Outer Glowing Ring */}
      <div className="relative flex items-center justify-center">
        {/* Animated ambient pulse ring */}
        <motion.div
          animate={{
            scale: state === 'LISTENING' || state === 'SPEAKING' ? [1, 1.15, 1] : state === 'PROCESSING' ? [1, 1.08, 1] : [1, 1.04, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: state === 'LISTENING' || state === 'SPEAKING' ? 1.5 : 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -inset-2.5 rounded-full filter blur-md"
          style={{ background: `radial-gradient(circle, ${current.glow} 0%, transparent 70%)` }}
        />

        {/* Orbiting particles for THINKING/PROCESSING */}
        {(state === 'THINKING' || state === 'PROCESSING') && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className={`absolute ${isLarge ? 'w-32 h-32' : 'w-20 h-20'} rounded-full border border-dashed border-[#1684FF]/60`}
          />
        )}

        {/* Circular Avatar Body */}
        <div
          className={`${avatarSizeClass} rounded-full flex items-center justify-center relative z-10 transition-all duration-300 border-2`}
          style={{
            backgroundColor: '#101318',
            borderColor: current.color,
            boxShadow: `0 0 20px ${current.glow}, inset 0 0 15px rgba(22, 132, 255, 0.15)`
          }}
        >
          {state === 'PROCESSING' ? (
            <Loader2 className={`${iconSizeClass} text-[#F59E0B] animate-spin`} />
          ) : (
            <motion.div
              animate={
                state === 'SPEAKING'
                  ? { y: [0, -3, 0], scale: [1, 1.05, 1] }
                  : state === 'LISTENING'
                  ? { scale: [1, 1.1, 1] }
                  : { y: [0, -2, 0] }
              }
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <StateIcon className={`${iconSizeClass}`} style={{ color: current.color }} />
            </motion.div>
          )}

          {/* Voice Waveform animation when speaking or listening */}
          {(state === 'SPEAKING' || state === 'LISTENING') && (
            <div className="absolute -bottom-2 flex items-center gap-1 bg-[#151922] px-2 py-0.5 rounded-full border border-white/10 shadow-lg">
              {[0.4, 0.8, 1, 0.6, 0.3].map((height, i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [0.3, height, 0.3] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                  className="w-1 h-3 rounded-full"
                  style={{ backgroundColor: current.color }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Online Status Badge */}
      <div className="mt-3.5 flex items-center gap-2 bg-[#151922] border border-white/10 px-3 py-1 rounded-full shadow-sm">
        <span
          className="w-2 h-2 rounded-full animate-ping"
          style={{ backgroundColor: current.color }}
        />
        <span className="text-xs font-medium tracking-wide text-gray-300">
          {current.badge}
        </span>
      </div>

      {/* Bot State Message */}
      <p className="mt-2 text-sm font-medium text-gray-400 min-h-[22px]">
        {message || current.text}
      </p>
    </div>
  );
};
