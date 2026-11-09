import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Sparkles, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-[#05070B]/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#151922] transition"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1684FF] to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                AI Interview Assistant
                <span className="text-[10px] uppercase font-semibold bg-[#1684FF]/20 text-[#1684FF] border border-[#1684FF]/30 px-1.5 py-0.5 rounded">
                  Demo AI
                </span>
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Quick actions & User profile */}
        <div className="flex items-center gap-3">
          <Link
            to="/interview/setup"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1684FF] hover:bg-blue-600 text-white text-xs sm:text-sm font-medium transition shadow-md shadow-blue-500/25"
          >
            <Sparkles className="w-4 h-4" />
            <span>Practice Interview</span>
          </Link>

          {user && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#151922] border border-white/15 flex items-center justify-center text-xs font-semibold text-blue-400">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden lg:inline text-xs text-gray-300 font-medium">
                  {user.name}
                </span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
