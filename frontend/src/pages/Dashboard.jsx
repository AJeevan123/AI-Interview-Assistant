import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Code2, 
  Users, 
  BrainCircuit, 
  Shuffle, 
  CheckCircle2, 
  Award, 
  MessageSquare, 
  Flame,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AIInterviewer } from '../components/AIInterviewer';
import { InterviewCard } from '../components/InterviewCard';
import { ScoreCard } from '../components/ScoreCard';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progressData, interviewsData] = await Promise.all([
          api.getProgress(),
          api.listInterviews(),
        ]);
        setStats(progressData);
        setRecentInterviews(interviewsData.slice(0, 4));
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickTypes = [
    {
      title: 'Technical Interview',
      desc: 'Algorithm depth, coding questions, and system design.',
      type: 'Technical',
      icon: Code2,
      color: '#1684FF',
      role: 'AI / ML Engineer'
    },
    {
      title: 'HR Interview',
      desc: 'Culture fit, career trajectory, and professional ethics.',
      type: 'HR',
      icon: Users,
      color: '#A855F7',
      role: 'Software Engineer'
    },
    {
      title: 'Behavioral Interview',
      desc: 'STAR scenario handling, leadership, and conflict resolution.',
      type: 'Behavioral',
      icon: BrainCircuit,
      color: '#10B981',
      role: 'Software Engineer'
    },
    {
      title: 'Mixed Interview',
      desc: 'Comprehensive simulation testing both technical & behavioral skills.',
      type: 'Mixed',
      icon: Shuffle,
      color: '#F59E0B',
      role: 'Python Developer'
    },
  ];

  const handleQuickStart = (type, role) => {
    navigate('/interview/setup', { state: { prefillType: type, prefillRole: role } });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Candidate'} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Ready for your next interview practice session?
        </p>
      </div>

      {/* AI Bot Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#101318] via-[#131720] to-[#101318] border border-white/10 p-6 sm:p-8 shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#1684FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Left info */}
          <div className="text-center md:text-left space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1684FF]/15 border border-[#1684FF]/30 text-xs font-semibold text-[#1684FF]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive AI Practice Session</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Hi! I'm your AI Interviewer.
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              I simulate real technical, HR, and behavioral interviews, evaluate your answers across 5 rubrics, and deliver detailed feedback and downloadable reports.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link
                to="/interview/setup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1684FF] hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 hover:scale-[1.02]"
              >
                <span>Start AI Interview</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/resume"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#151922] hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-sm font-medium transition"
              >
                <FileCheck className="w-4 h-4 text-blue-400" />
                <span>Upload Resume First</span>
              </Link>
            </div>
          </div>

          {/* Right: AI Bot Avatar */}
          <div className="flex-shrink-0">
            <AIInterviewer state="IDLE" message="Ready when you are." size="large" />
          </div>
        </div>
      </div>

      {/* KPI Statistics */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#1684FF]" />
          <span>Practice Overview</span>
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ScoreCard
            title="Interviews Completed"
            score={stats?.interviews_completed || 0}
            icon={CheckCircle2}
            color="#1684FF"
            subtitle="sessions"
          />
          <ScoreCard
            title="Average Score"
            score={stats?.average_score || 0}
            icon={Award}
            color="#10B981"
            subtitle="overall"
          />
          <ScoreCard
            title="Questions Answered"
            score={stats?.questions_answered || 0}
            icon={MessageSquare}
            color="#A855F7"
            subtitle="responses"
          />
          <ScoreCard
            title="Current Streak"
            score={(stats?.current_streak || 1) * 14}
            icon={Flame}
            color="#F59E0B"
            subtitle={`${stats?.current_streak || 1} days active`}
          />
        </div>
      </div>

      {/* Quick Interview Setup Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1684FF]" />
            <span>Quick Start Modes</span>
          </h2>
          <Link
            to="/interview/setup"
            className="text-xs text-[#1684FF] hover:text-blue-400 font-medium flex items-center gap-1"
          >
            <span>Custom setup</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickTypes.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                onClick={() => handleQuickStart(item.type, item.role)}
                className="bg-[#101318] border border-white/10 hover:border-[#1684FF]/40 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 group flex flex-col justify-between"
              >
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition group-hover:scale-110"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-[#1684FF] transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#1684FF]">
                  <span>Launch Practice</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Interviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#1684FF]" />
            <span>Recent Interviews</span>
          </h2>
          <Link
            to="/history"
            className="text-xs text-[#1684FF] hover:text-blue-400 font-medium flex items-center gap-1"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentInterviews.length === 0 ? (
          <div className="bg-[#101318] border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-400">No interviews taken yet.</p>
            <Link
              to="/interview/setup"
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1684FF] text-white text-xs font-semibold"
            >
              Start Your First Interview
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentInterviews.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
