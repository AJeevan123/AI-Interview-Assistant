import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Sliders, 
  Mic, 
  Volume2, 
  Moon, 
  LogOut, 
  GraduationCap, 
  Check,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const Settings = () => {
  const { user, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [saved, setSaved] = useState(false);

  const roles = [
    'AI / ML Engineer',
    'Python Developer',
    'Java Developer',
    'Web Developer',
    'Data Scientist',
    'Software Engineer'
  ];

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1684FF]/15 border border-[#1684FF]/30 text-xs font-semibold text-[#1684FF] mb-2">
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>System Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Settings & Profile
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Customize your interview defaults, voice assistance toggles, and view project team credentials.
        </p>
      </div>

      {/* User Profile */}
      <section className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
          <User className="w-4 h-4 text-[#1684FF]" />
          <h2 className="text-base font-semibold text-white">
            User Profile
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Full Name
            </label>
            <input
              type="text"
              readOnly
              value={user?.name || ''}
              className="w-full px-4 py-2.5 rounded-xl bg-[#151922] border border-white/10 text-white text-xs sm:text-sm cursor-not-allowed opacity-90"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              readOnly
              value={user?.email || ''}
              className="w-full px-4 py-2.5 rounded-xl bg-[#151922] border border-white/10 text-white text-xs sm:text-sm cursor-not-allowed opacity-90"
            />
          </div>
        </div>
      </section>

      {/* Default Interview Preferences */}
      <section className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
          <Sliders className="w-4 h-4 text-purple-400" />
          <h2 className="text-base font-semibold text-white">
            Interview Defaults
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Default Target Role
            </label>
            <select
              value={settings.defaultRole}
              onChange={(e) => updateSettings({ defaultRole: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#151922] border border-white/10 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-[#1684FF]"
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Default Difficulty
            </label>
            <select
              value={settings.defaultDifficulty}
              onChange={(e) => updateSettings({ defaultDifficulty: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#151922] border border-white/10 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-[#1684FF]"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Default Question Count
            </label>
            <select
              value={settings.defaultQuestionCount}
              onChange={(e) => updateSettings({ defaultQuestionCount: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#151922] border border-white/10 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-[#1684FF]"
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
            </select>
          </div>
        </div>
      </section>

      {/* Voice & Speech Assistance Settings */}
      <section className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
          <Mic className="w-4 h-4 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">
            Voice & Speech Features
          </h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#151922] border border-white/5 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-white">Enable Microphone Input</span>
                <p className="text-[11px] text-gray-400">Uses Web Speech API for voice-to-text answers</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(e) => updateSettings({ voiceEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-[#1684FF] focus:ring-[#1684FF] bg-black/40 border-white/20"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#151922] border border-white/5 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-[#1684FF] flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-semibold text-white">Enable AI Voice Output</span>
                <p className="text-[11px] text-gray-400">Reads AI questions aloud via speech synthesis</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.aiSpeechEnabled}
              onChange={(e) => updateSettings({ aiSpeechEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-[#1684FF] focus:ring-[#1684FF] bg-black/40 border-white/20"
            />
          </label>
        </div>
      </section>

      {/* College Minor Project Information & Attribution */}
      <section className="bg-gradient-to-tr from-[#101318] to-[#141b25] border border-blue-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1684FF]/20 text-[#1684FF] flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                College Minor Project Credentials
              </h2>
              <span className="text-xs text-blue-400 font-semibold">Group 18 • AIML-B</span>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            Verified
          </span>
        </div>

        <div className="space-y-3 text-xs text-gray-300">
          <div className="p-3 rounded-xl bg-[#101318]/80 border border-white/5">
            <span className="text-gray-400 font-medium">Supervisor:</span>
            <div className="text-sm font-bold text-white mt-0.5">Dr. A V S Pavan Kumar</div>
          </div>

          <div className="p-3 rounded-xl bg-[#101318]/80 border border-white/5 space-y-2">
            <span className="text-gray-400 font-medium">Student Team Members:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-[#151922] border border-white/5">
                <p className="font-bold text-white">D. ABHAY</p>
                <p className="text-[11px] text-gray-400">Roll: 24CSEAIML243</p>
                <p className="text-[11px] text-gray-400">Reg: 24UG010737</p>
              </div>
              <div className="p-2 rounded-lg bg-[#151922] border border-white/5">
                <p className="font-bold text-white">K. SRAVANTH KUMAR</p>
                <p className="text-[11px] text-gray-400">Roll: 24CSEAIML256</p>
                <p className="text-[11px] text-gray-400">Reg: 24UG010749</p>
              </div>
              <div className="p-2 rounded-lg bg-[#151922] border border-white/5">
                <p className="font-bold text-white">KODI JANAKI RAO</p>
                <p className="text-[11px] text-gray-400">Roll: 24CSEAIML261</p>
                <p className="text-[11px] text-gray-400">Reg: 24UG010753</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logout button */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-semibold text-xs sm:text-sm transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out from account</span>
        </button>
      </div>
    </div>
  );
};
