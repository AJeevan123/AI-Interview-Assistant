import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  ArrowLeft, 
  Sparkles, 
  BookOpen, 
  TrendingUp, 
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import { ScoreCard } from '../components/ScoreCard';
import { QuestionCard } from '../components/QuestionCard';
import { DownloadButton } from '../components/DownloadButton';

export const InterviewResult = () => {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuestions, setShowQuestions] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const detail = await api.getInterview(id);
        setInterview(detail);

        // Trigger confetti celebration!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1684FF', '#38BDF8', '#10B981', '#A855F7']
        });
      } catch (err) {
        setError('Failed to load interview results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  const handleDownloadSingleQuestion = async (qId, qNum) => {
    try {
      const res = await api.downloadQuestion(id, qId);
      if (res && res.blob) {
        const url = window.URL.createObjectURL(res.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename || `AI_Interview_Question_${String(qNum).padStart(2, '0')}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      alert('Failed to download question report.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#1684FF]/20 border-t-[#1684FF] animate-spin" />
        <p className="text-sm text-gray-400">Loading comprehensive performance evaluation...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-[#101318] border border-white/10 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Result Not Found</h2>
        <p className="text-sm text-gray-400">{error || 'Unable to display report.'}</p>
        <Link to="/dashboard" className="inline-block px-4 py-2 bg-[#1684FF] text-white rounded-xl text-xs font-semibold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Interview Completed 🎉</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Evaluation Report
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {interview.role} • {interview.interview_type} • {interview.difficulty}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#151922] hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <DownloadButton
            type="full"
            interviewId={interview.id}
            label="Download Full Interview"
            className="flex-1 sm:flex-initial"
          />
        </div>
      </div>

      {/* Main Overall Score Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#101318] via-[#151922] to-[#101318] border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#1684FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Overall Candidate Score
            </span>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {interview.overall_score || 0}%
              </span>
              <span className="text-sm font-semibold text-gray-400">
                / 100%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 max-w-lg leading-relaxed pt-1">
              {interview.summary || 'Strong performance demonstrating good technical understanding and clarity.'}
            </p>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className="p-3.5 rounded-xl bg-[#101318] border border-white/5 text-center">
              <span className="text-[11px] text-gray-400 font-medium">Technical Accuracy</span>
              <div className="text-lg font-bold text-white mt-1">{interview.technical_score || 0}%</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#101318] border border-white/5 text-center">
              <span className="text-[11px] text-gray-400 font-medium">Communication</span>
              <div className="text-lg font-bold text-white mt-1">{interview.clarity_score || 0}%</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#101318] border border-white/5 text-center">
              <span className="text-[11px] text-gray-400 font-medium">Relevance</span>
              <div className="text-lg font-bold text-white mt-1">{interview.relevance_score || 0}%</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#101318] border border-white/5 text-center">
              <span className="text-[11px] text-gray-400 font-medium">Completeness</span>
              <div className="text-lg font-bold text-white mt-1">{interview.completeness_score || 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Score Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Technical Accuracy"
          score={interview.technical_score || 0}
          icon={Award}
          color="#1684FF"
        />
        <ScoreCard
          title="Communication"
          score={interview.clarity_score || 0}
          icon={Sparkles}
          color="#A855F7"
        />
        <ScoreCard
          title="Relevance"
          score={interview.relevance_score || 0}
          icon={CheckCircle2}
          color="#10B981"
        />
        <ScoreCard
          title="Completeness"
          score={interview.completeness_score || 0}
          icon={Layers}
          color="#F59E0B"
        />
      </div>

      {/* AI Qualitative Feedback: Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-[#101318] border border-emerald-500/20 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Strengths</span>
          </div>
          <ul className="space-y-2.5">
            {(interview.strengths || []).map((str, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-300">
                <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-[#101318] border border-amber-500/20 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Areas to Improve</span>
          </div>
          <ul className="space-y-2.5">
            {(interview.weaknesses || []).map((wk, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-300">
                <span className="text-amber-400 font-bold mt-0.5">•</span>
                <span>{wk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Practice */}
      {interview.recommendations && interview.recommendations.length > 0 && (
        <div className="bg-[#101318] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>Recommended Practice Topics</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {interview.recommendations.map((rec, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-[#151922] border border-white/10 text-xs font-medium text-gray-300"
              >
                {rec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Question by Question Detailed Breakdown */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Detailed Questions & Answers</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#151922] text-gray-400 border border-white/5">
              {interview.questions?.length || 0} Questions
            </span>
          </h2>
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="text-xs text-[#1684FF] hover:text-blue-400 flex items-center gap-1 font-medium"
          >
            <span>{showQuestions ? 'Collapse All' : 'Expand All'}</span>
            {showQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showQuestions && (
          <div className="space-y-4">
            {(interview.questions || []).map((item, idx) => (
              <QuestionCard
                key={item.question.id || idx}
                questionNumber={item.question.question_number}
                questionText={item.question.question_text}
                topic={item.question.topic}
                difficulty={item.question.difficulty}
                isFollowUp={Boolean(item.question.is_follow_up)}
                candidateAnswer={item.answer?.answer_text}
                aiFeedback={item.answer?.feedback}
                score={item.answer?.score}
                strengths={item.answer?.strengths || []}
                areasToImprove={item.answer?.areas_to_improve || []}
                isDemoMode={item.answer?.is_demo_mode}
                onDownload={() => handleDownloadSingleQuestion(item.question.id, item.question.question_number)}
              />
            ))}
          </div>
        )}
      </div>

      {/* College Project Credit Footer */}
      <div className="pt-6 border-t border-white/10 text-center text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-400">AI Interview Assistant • Minor Project</p>
        <p>Supervisor: Dr. A V S Pavan Kumar | Section AIML-B | Group 18</p>
        <p>Students: D. ABHAY (24CSEAIML243), KORADA SRAVANTH KUMAR (24CSEAIML256), KODI JANAKI RAO (24CSEAIML261)</p>
      </div>
    </div>
  );
};
