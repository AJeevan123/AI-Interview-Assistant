import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bot, 
  Send, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  SkipForward, 
  Power, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { AIInterviewer } from '../components/AIInterviewer';
import { QuestionCard } from '../components/QuestionCard';
import { ProgressBar } from '../components/ProgressBar';
import { VoiceButton, AISpeechButton } from '../components/VoiceButton';

const getScoreTierInfo = (score) => {
  const num = Number(score);
  if (isNaN(num)) return { tier: 'Evaluated', badge: 'text-gray-300 bg-gray-800 border-gray-700', border: 'border-white/10', text: 'text-gray-300', iconBg: 'bg-white/10 text-gray-300' };
  if (num < 4.0) {
    return {
      tier: 'Low',
      badge: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
      border: 'border-rose-500/30 bg-rose-500/5',
      text: 'text-rose-400',
      iconBg: 'bg-rose-500/20 text-rose-400',
    };
  } else if (num < 6.0) {
    return {
      tier: 'Needs Improvement',
      badge: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      border: 'border-amber-500/30 bg-amber-500/5',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/20 text-amber-400',
    };
  } else if (num < 8.0) {
    return {
      tier: 'Good',
      badge: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
      border: 'border-blue-500/30 bg-blue-500/5',
      text: 'text-blue-400',
      iconBg: 'bg-blue-500/20 text-blue-400',
    };
  } else {
    return {
      tier: 'Excellent',
      badge: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      border: 'border-emerald-500/30 bg-emerald-500/5',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
    };
  }
};

export const Interview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, updateSettings } = useSettings();

  const [interview, setInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  
  // Bot & Answering state
  const [botState, setBotState] = useState('IDLE');
  const [botMessage, setBotMessage] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Evaluation feedback strictly mapped by question ID to prevent score leakage
  const [evaluationsByQuestion, setEvaluationsByQuestion] = useState({});

  // Timer & advance timeout refs
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const advanceTimeoutRef = useRef(null);

  // Active evaluation bound strictly to the current question
  const currentEvaluation = currentQuestion ? evaluationsByQuestion[currentQuestion.id] : null;
  const tierInfo = currentEvaluation ? getScoreTierInfo(currentEvaluation.score) : null;

  // Load interview details & initial question
  useEffect(() => {
    const initInterview = async () => {
      try {
        const detail = await api.getInterview(id);
        setInterview(detail);
        setTotalQuestions(detail.question_count || 5);

        // Pre-populate any existing evaluations keyed by question ID
        const initialEvals = {};
        (detail.questions || []).forEach((qItem) => {
          if (qItem.answer && qItem.question?.id) {
            initialEvals[qItem.question.id] = {
              score: qItem.answer.score,
              feedback: qItem.answer.feedback,
              relevance_score: qItem.answer.relevance_score,
              clarity_score: qItem.answer.clarity_score,
              technical_score: qItem.answer.technical_score,
              completeness_score: qItem.answer.completeness_score,
              strengths: qItem.answer.strengths || [],
              areas_to_improve: qItem.answer.areas_to_improve || [],
              is_demo_mode: qItem.answer.is_demo_mode,
            };
          }
        });
        setEvaluationsByQuestion(initialEvals);

        // Determine current unanswered question
        const unanswered = detail.questions.find((q) => !q.answer);
        if (unanswered) {
          setCurrentQuestion(unanswered.question);
          setCurrentNumber(unanswered.question.question_number);
        } else if (detail.questions.length > 0) {
          // If all existing questions are answered, check if we need to generate the next one or complete
          if (detail.questions.length >= detail.question_count) {
            navigate(`/interview/${id}/result`);
          } else {
            // Request next question
            const nextQ = await api.getNextQuestion(id);
            if (nextQ) {
              setCurrentQuestion(nextQ);
              setCurrentNumber(nextQ.question_number);
            } else {
              navigate(`/interview/${id}/result`);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load interview:', err);
        setError('Failed to load interview session.');
      }
    };

    initInterview();

    // Start timer
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, [id, navigate]);

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVoiceTranscript = useCallback((textChunk) => {
    if (!textChunk || !textChunk.trim()) return;
    setAnswerText((prev) => {
      const trimmedPrev = (prev || '').trim();
      const trimmedChunk = textChunk.trim();
      if (!trimmedPrev) return trimmedChunk;
      // Avoid duplicate appending if the exact same segment was already appended
      if (trimmedPrev.endsWith(trimmedChunk)) return trimmedPrev;
      return `${trimmedPrev} ${trimmedChunk}`;
    });
  }, []);

  const advanceQuestion = async () => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    setIsSubmitting(true);
    setBotState('THINKING');
    setBotMessage('Preparing next question...');
    setAnswerText(''); // Reset input text cleanly

    try {
      const nextQ = await api.getNextQuestion(id);
      if (nextQ) {
        setCurrentQuestion(nextQ);
        setCurrentNumber(nextQ.question_number);
        setAnswerText('');
        setBotState('IDLE');
        setBotMessage('Ready when you are.');
      } else {
        // All questions completed! Finalize interview
        setBotState('PROCESSING');
        setBotMessage('Generating comprehensive evaluation report...');
        await api.completeInterview(id);
        navigate(`/interview/${id}/result`);
      }
    } catch (err) {
      console.error('Error fetching next question:', err);
      await api.completeInterview(id);
      navigate(`/interview/${id}/result`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      setError('Please type or speak your answer before submitting.');
      return;
    }

    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    setError('');
    setIsSubmitting(true);
    setBotState('PROCESSING');
    setBotMessage('Evaluating your answer...');

    try {
      const payload = {
        interview_id: id,
        question_id: currentQuestion.id,
        question_number: currentQuestion.question_number,
        question_text: currentQuestion.question_text,
        candidate_answer: answerText.trim(),
        answer_text: answerText.trim(),
        role: interview?.role,
        interview_type: interview?.interview_type,
        difficulty: currentQuestion.difficulty || interview?.difficulty,
        topic: currentQuestion.topic,
      };

      const evaluation = await api.submitAnswer(id, currentQuestion.id, payload);

      // Store evaluation strictly mapped to this question ID
      setEvaluationsByQuestion((prev) => ({
        ...prev,
        [currentQuestion.id]: evaluation,
      }));

      // Check if a follow-up question was triggered
      if (evaluation.follow_up_required && evaluation.follow_up_question) {
        setBotState('IDLE');
        setBotMessage('I have a quick follow-up question based on your answer.');
        setCurrentQuestion(evaluation.follow_up_question);
        setAnswerText('');
        setIsSubmitting(false);
      } else {
        setBotState('IDLE');
        setBotMessage('Answer evaluated. Review your feedback below.');
        setIsSubmitting(false);

        // Auto-advance after 3.8 seconds so candidate can digest the feedback
        advanceTimeoutRef.current = setTimeout(() => {
          advanceQuestion();
        }, 3800);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit answer.');
      setBotState('IDLE');
      setBotMessage('Ready when you are.');
      setIsSubmitting(false);
    }
  };

  const handleSkipQuestion = async () => {
    if (isSubmitting) return;
    const confirmSkip = window.confirm('Are you sure you want to skip this question? A score of 0 will be assigned.');
    if (!confirmSkip) return;

    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    setIsSubmitting(true);
    setBotState('PROCESSING');
    setBotMessage('Recording skipped question...');

    try {
      const payload = {
        interview_id: id,
        question_id: currentQuestion.id,
        question_number: currentQuestion.question_number,
        question_text: currentQuestion.question_text,
        candidate_answer: 'Question was skipped by candidate.',
        answer_text: 'Question was skipped by candidate.',
        role: interview?.role,
        interview_type: interview?.interview_type,
        difficulty: currentQuestion.difficulty || interview?.difficulty,
        topic: currentQuestion.topic,
      };
      await api.submitAnswer(id, currentQuestion.id, payload);
      await advanceQuestion();
    } catch (err) {
      setError('Failed to advance question.');
      setIsSubmitting(false);
    }
  };

  const handleEndInterview = async () => {
    const confirmEnd = window.confirm('Are you sure you want to finish the interview now? Your answers so far will be evaluated.');
    if (!confirmEnd) return;

    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    setIsSubmitting(true);
    setBotState('PROCESSING');
    setBotMessage('Finalizing interview report...');
    try {
      await api.completeInterview(id);
      navigate(`/interview/${id}/result`);
    } catch (err) {
      navigate(`/interview/${id}/result`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header: Role, Progress & Timer */}
      <div className="bg-[#101318] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-[#1684FF]/20 text-[#1684FF] flex items-center justify-center font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-snug">
              {interview?.role || 'Technical Interview'}
            </h1>
            <span className="text-xs text-gray-400">
              {interview?.interview_type} • {interview?.difficulty}
            </span>
          </div>
        </div>

        {/* Progress & Duration */}
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <div className="w-36 sm:w-44">
            <ProgressBar
              current={currentNumber}
              total={totalQuestions}
              label={`Q ${currentNumber} of ${totalQuestions}`}
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151922] border border-white/10 text-xs font-semibold text-gray-300">
            <Clock className="w-3.5 h-3.5 text-[#1684FF]" />
            <span>{formatTime(seconds)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Center AI Bot Avatar */}
      <div className="bg-[#101318]/70 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center shadow-xl">
        <AIInterviewer state={botState} message={botMessage} size="large" />
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="relative">
          <QuestionCard
            questionNumber={currentQuestion.question_number}
            questionText={currentQuestion.question_text}
            topic={currentQuestion.topic}
            difficulty={currentQuestion.difficulty}
            isFollowUp={Boolean(currentQuestion.is_follow_up)}
          />

          {/* AI Speak Question button */}
          <div className="absolute top-5 right-5 hidden sm:block">
            <AISpeechButton
              textToRead={currentQuestion.question_text}
              onStateChange={(st) => setBotState(st)}
            />
          </div>
        </div>
      )}

      {/* Evaluation Feedback Section (dynamically mapped to currentQuestion.id) */}
      {currentEvaluation && tierInfo && (
        <div className={`border p-5 rounded-2xl space-y-4 animate-fadeIn transition-all shadow-lg ${tierInfo.border}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${tierInfo.iconBg}`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white">
                  Answer Evaluated
                </span>
                <span className={`ml-2 text-xs font-semibold ${tierInfo.text}`}>
                  ({tierInfo.tier})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tierInfo.badge}`}>
                Score: {currentEvaluation.score}/10
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${currentEvaluation.is_demo_mode ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-blue-500/10 text-blue-300 border-blue-500/20'}`}>
                {currentEvaluation.is_demo_mode ? 'Demo AI Mode' : 'Live AI Mode'}
              </span>
            </div>
          </div>

          {/* Subscores breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-[#151922] p-2 rounded-lg border border-white/5">
              <span className="text-gray-400 text-[10px] block">Technical</span>
              <span className="font-bold text-white">{currentEvaluation.technical_score ?? currentEvaluation.technical_accuracy ?? '-'}/10</span>
            </div>
            <div className="bg-[#151922] p-2 rounded-lg border border-white/5">
              <span className="text-gray-400 text-[10px] block">Relevance</span>
              <span className="font-bold text-white">{currentEvaluation.relevance_score ?? currentEvaluation.relevance ?? '-'}/10</span>
            </div>
            <div className="bg-[#151922] p-2 rounded-lg border border-white/5">
              <span className="text-gray-400 text-[10px] block">Clarity</span>
              <span className="font-bold text-white">{currentEvaluation.clarity_score ?? currentEvaluation.clarity ?? '-'}/10</span>
            </div>
            <div className="bg-[#151922] p-2 rounded-lg border border-white/5">
              <span className="text-gray-400 text-[10px] block">Completeness</span>
              <span className="font-bold text-white">{currentEvaluation.completeness_score ?? currentEvaluation.completeness ?? '-'}/10</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            {currentEvaluation.feedback}
          </p>

          {/* Strengths & Areas to Improve lists */}
          {((currentEvaluation.strengths && currentEvaluation.strengths.length > 0) || (currentEvaluation.areas_to_improve && currentEvaluation.areas_to_improve.length > 0)) && (
            <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {currentEvaluation.strengths && currentEvaluation.strengths.length > 0 && (
                <div className="bg-[#151922]/70 p-2.5 rounded-xl border border-emerald-500/15">
                  <span className="font-semibold text-emerald-400 block mb-1">Strengths:</span>
                  <ul className="list-disc list-inside text-gray-300 space-y-0.5">
                    {currentEvaluation.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}
              {currentEvaluation.areas_to_improve && currentEvaluation.areas_to_improve.length > 0 && (
                <div className="bg-[#151922]/70 p-2.5 rounded-xl border border-amber-500/15">
                  <span className="font-semibold text-amber-400 block mb-1">Areas to Improve:</span>
                  <ul className="list-disc list-inside text-gray-300 space-y-0.5">
                    {currentEvaluation.areas_to_improve.map((area, idx) => (
                      <li key={idx}>{area}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Manual advance button */}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={advanceQuestion}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-xl bg-[#1684FF] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
            >
              <span>Continue to Next Question</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Answer Area */}
      <div className="bg-[#101318] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Your Response
          </label>
          <span className="text-[11px] text-gray-500">
            {answerText.trim() ? `${answerText.trim().split(/\s+/).length} words` : '0 words'}
          </span>
        </div>

        <textarea
          rows={6}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          disabled={isSubmitting}
          placeholder="Type your answer here, or click 'Voice Answer' to speak through your microphone..."
          className="w-full p-4 rounded-xl bg-[#151922] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#1684FF] focus:ring-1 focus:ring-[#1684FF] transition leading-relaxed"
        />

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Voice Input */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {settings?.voiceEnabled !== false ? (
              <VoiceButton
                onTranscript={handleVoiceTranscript}
                disabled={isSubmitting}
                resetKey={currentQuestion?.id}
              />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#151922] border border-white/10 text-xs text-gray-400">
                <span>Microphone disabled in Settings.</span>
                <button
                  type="button"
                  onClick={() => updateSettings({ voiceEnabled: true })}
                  className="text-[#1684FF] hover:underline font-semibold"
                >
                  Enable Voice
                </button>
              </div>
            )}
            <div className="sm:hidden">
              {currentQuestion && (
                <AISpeechButton
                  textToRead={currentQuestion.question_text}
                  onStateChange={(st) => setBotState(st)}
                />
              )}
            </div>
          </div>

          {/* Submit & Navigation */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleSkipQuestion}
              disabled={isSubmitting}
              className="px-3.5 py-2.5 rounded-xl bg-[#151922] hover:bg-white/10 text-gray-400 hover:text-white text-xs sm:text-sm font-medium transition border border-white/10 flex items-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#1684FF] hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-blue-500/25 flex items-center gap-2 disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Evaluating...' : 'Submit Answer'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls: End Interview */}
      <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
        <span>Press Submit to record answer and evaluate.</span>
        <button
          onClick={handleEndInterview}
          className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition"
        >
          <Power className="w-3.5 h-3.5" />
          <span>End Interview Early</span>
        </button>
      </div>
    </div>
  );
};
