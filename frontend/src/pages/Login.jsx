import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Lock, Mail, ArrowRight, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@interview.ai');
    setPassword('password123');
    setError('');
    setSubmitting(true);
    try {
      await login('demo@interview.ai', 'password123');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070B] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#1684FF]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md bg-[#101318]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1684FF] to-blue-400 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Log in
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Continue your AI interview journey.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#151922] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#1684FF] focus:ring-1 focus:ring-[#1684FF] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#151922] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#1684FF] focus:ring-1 focus:ring-[#1684FF] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-3 text-gray-500 hover:text-gray-300 focus:outline-none transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 rounded-xl bg-[#1684FF] hover:bg-blue-600 text-white font-medium text-sm transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span>{submitting ? 'Logging in...' : 'Log in'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Fill Button */}
        <div className="mt-5 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-[#151922] hover:bg-white/10 border border-blue-500/30 text-blue-400 hover:text-white text-xs font-medium transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1684FF]" />
            <span>Instant Demo Account Login</span>
          </button>
        </div>

        {/* Sign up Link */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#1684FF] hover:text-blue-400 font-semibold transition">
            Sign up
          </Link>
        </p>

        {/* Academic Project Attribution */}
        <div className="mt-8 text-center text-[11px] text-gray-500 border-t border-white/5 pt-4">
          <p className="font-medium text-gray-400">AIML-B Group 18 • Minor Project</p>
          <p className="mt-0.5">D. Abhay • K. Sravanth Kumar • K. Janaki Rao</p>
        </div>
      </div>
    </div>
  );
};
