import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlayCircle, 
  FileText, 
  History, 
  TrendingUp, 
  Settings, 
  LogOut,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/interview/setup', label: 'Mock Interview', icon: PlayCircle },
    { to: '/resume', label: 'Resume Analyzer', icon: FileText },
    { to: '/history', label: 'Interview History', icon: History },
    { to: '/progress', label: 'Progress', icon: TrendingUp },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const closeMobile = () => {
    if (setMobileMenuOpen) setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={closeMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0A0D12] border-r border-white/10 flex flex-col justify-between
        transition-transform duration-300 ease-in-out md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Top: Logo / Brand */}
        <div>
          <div className="p-5 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1684FF] to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white leading-snug">
                AI Interview Assistant
              </h2>
              <span className="text-[11px] text-gray-400">
                Minor Project • Group 18
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobile}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-[#1684FF] text-white shadow-lg shadow-blue-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-[#151922]'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: College Project Info & User Card */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {/* College Project Mini Pill */}
          <div className="p-2.5 rounded-xl bg-[#101318] border border-white/5 text-[11px] text-gray-400">
            <div className="text-gray-300 font-semibold mb-0.5 flex items-center justify-between">
              <span>AIML-B Group 18</span>
              <span className="text-[10px] text-[#1684FF]">Active</span>
            </div>
            <p className="truncate">Sup: Dr. A V S Pavan Kumar</p>
          </div>

          {/* User & Logout */}
          {user && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-[#151922] border border-white/10 flex items-center justify-center text-xs font-semibold text-blue-400 flex-shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-medium text-white truncate">{user.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{user.email}</div>
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
