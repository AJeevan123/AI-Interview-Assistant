import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Upload, 
  FileText, 
  Code, 
  Check, 
  AlertCircle, 
  Bot, 
  Briefcase,
  Layers,
  Gauge,
  HelpCircle,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';

export const InterviewSetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [role, setRole] = useState(location.state?.prefillRole || settings.defaultRole || 'AI / ML Engineer');
  const [customRole, setCustomRole] = useState('');
  const [interviewType, setInterviewType] = useState(location.state?.prefillType || 'Technical');
  const [difficulty, setDifficulty] = useState(settings.defaultDifficulty || 'Medium');
  const [questionCount, setQuestionCount] = useState(settings.defaultQuestionCount || 5);
  
  // Optional Resume & JD
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState(location.state?.prefillResumeText || '');
  const [jdText, setJdText] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    'AI / ML Engineer',
    'Python Developer',
    'Java Developer',
    'Web Developer',
    'Data Scientist',
    'Software Engineer',
    'Custom'
  ];

  const interviewTypes = [
    { type: 'Technical', desc: 'Coding, system design, and algorithmic fundamentals' },
    { type: 'HR', desc: 'Workplace culture, career aspirations, and team collaboration' },
    { type: 'Behavioral', desc: 'STAR situational problem-solving and scenario leadership' },
    { type: 'Mixed', desc: 'Balanced combination of technical theory and behavioral questions' }
  ];

  const difficulties = [
    { level: 'Easy', desc: 'Foundational concepts and standard definitions' },
    { level: 'Medium', desc: 'Practical trade-offs, architecture, and core problem-solving' },
    { level: 'Hard', desc: 'Advanced internals, distributed systems, and edge cases' }
  ];

  const questionCounts = [5, 10, 15];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file only.');
      return;
    }

    setResumeFile(file);
    setUploadingResume(true);
    setError('');

    try {
      const res = await api.uploadResume(file);
      setResumeText(res.extracted_text);
      setResumeAnalysis(res.analysis);
    } catch (err) {
      setError('Could not extract text from PDF. You can still proceed without a resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleStartInterview = async () => {
    setError('');
    const finalRole = role === 'Custom' ? customRole.trim() : role;
    if (!finalRole) {
      setError('Please enter or select a target job role.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.createInterview({
        role: finalRole,
        interview_type: interviewType,
        difficulty,
        question_count: questionCount,
        resume_text: resumeText || null,
        jd_text: jdText.trim() || null
      });

      // Navigate to interview live screen with state
      navigate(`/interview/${data.interview_id}`, {
        state: { initialData: data }
      });
    } catch (err) {
      setError(err.message || 'Failed to initialize interview. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1684FF]/15 border border-[#1684FF]/30 text-xs font-semibold text-[#1684FF] mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Configuration Wizard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Set Up Your Interview
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Customize your role, difficulty, questions, and optional resume to personalize questions.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Choose Role */}
      <section className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
          <div className="w-7 h-7 rounded-lg bg-[#1684FF]/20 text-[#1684FF] flex items-center justify-center text-xs font-bold">
            1
          </div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span>Target Job Role</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {roles.map((r) => {
            const isSelected = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-medium border text-left transition-all ${
                  isSelected
                    ? 'bg-[#1684FF]/20 border-[#1684FF] text-white shadow-md shadow-blue-500/15'
                    : 'bg-[#151922] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        {role === 'Custom' && (
          <div className="mt-3">
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="e.g. Cloud Security Specialist, DevOps Engineer"
              className="w-full px-4 py-2.5 rounded-xl bg-[#151922] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#1684FF]"
            />
          </div>
        )}
      </section>

      {/* Step 2: Interview Type */}
      <section className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
          <div className="w-7 h-7 rounded-lg bg-[#1684FF]/20 text-[#1684FF] flex items-center justify-center text-xs font-bold">
            2
          </div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400" />
            <span>Interview Format</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {interviewTypes.map((item) => {
            const isSelected = interviewType === item.type;
            return (
              <div
                key={item.type}
                onClick={() => setInterviewType(item.type)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#1684FF]/15 border-[#1684FF] shadow-md shadow-blue-500/10'
                    : 'bg-[#151922] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${isSelected ? 'text-[#1684FF]' : 'text-white'}`}>
                    {item.type}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-[#1684FF]" />}
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Step 3 & 4: Difficulty & Questions in 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 3: Difficulty */}
        <section className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
            <div className="w-7 h-7 rounded-lg bg-[#1684FF]/20 text-[#1684FF] flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-gray-400" />
              <span>Difficulty</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {difficulties.map((item) => {
              const isSelected = difficulty === item.level;
              return (
                <div
                  key={item.level}
                  onClick={() => setDifficulty(item.level)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#1684FF]/15 border-[#1684FF]'
                      : 'bg-[#151922] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-[#1684FF]' : 'text-white'}`}>
                      {item.level}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#1684FF]" />}
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 4: Question Count */}
        <section className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
            <div className="w-7 h-7 rounded-lg bg-[#1684FF]/20 text-[#1684FF] flex items-center justify-center text-xs font-bold">
              4
            </div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <span>Question Count</span>
            </h2>
          </div>

          <p className="text-xs text-gray-400">
            Select the number of questions you wish to practice in this session:
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {questionCounts.map((count) => {
              const isSelected = questionCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`py-5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#1684FF]/20 border-[#1684FF] text-white shadow-md shadow-blue-500/15'
                      : 'bg-[#151922] border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="text-2xl font-bold text-white mb-1">{count}</span>
                  <span className="text-[11px] text-gray-400">Questions</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Step 5: Optional Resume */}
      <section className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1684FF]/20 text-[#1684FF] flex items-center justify-center text-xs font-bold">
              5
            </div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Optional Resume (PDF)</span>
            </h2>
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">Optional</span>
        </div>

        <p className="text-xs text-gray-400">
          Upload your resume so the AI can formulate tailored questions based on your projects and skills.
        </p>

        {resumeText ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white">
                  {resumeFile ? resumeFile.name : 'Resume Loaded'}
                </span>
                <p className="text-[11px] text-gray-400">
                  {resumeText.length} characters parsed successfully
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setResumeText('');
                setResumeFile(null);
              }}
              className="text-gray-400 hover:text-red-400 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="border-2 border-dashed border-white/15 hover:border-[#1684FF]/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-[#151922]/50 hover:bg-[#151922]">
            <Upload className="w-8 h-8 text-blue-400 mb-2" />
            <span className="text-xs sm:text-sm font-medium text-white">
              {uploadingResume ? 'Extracting text from PDF...' : 'Click to browse or drop PDF resume'}
            </span>
            <span className="text-[11px] text-gray-500 mt-1">
              Supports PDF files up to 5MB
            </span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploadingResume}
            />
          </label>
        )}
      </section>

      {/* Step 6: Optional Job Description */}
      <section className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1684FF]/20 text-[#1684FF] flex items-center justify-center text-xs font-bold">
              6
            </div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span>Optional Job Description</span>
            </h2>
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">Optional</span>
        </div>

        <textarea
          rows={3}
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the target job description here to align interview questions with specific company requirements..."
          className="w-full p-3.5 rounded-xl bg-[#151922] border border-white/10 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-[#1684FF] transition"
        />
      </section>

      {/* Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Bot className="w-4 h-4 text-[#1684FF]" />
          <span>AI Interviewer is prepared to generate {questionCount} questions.</span>
        </div>

        <button
          onClick={handleStartInterview}
          disabled={submitting}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#1684FF] hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-60 hover:scale-[1.02]"
        >
          <span>{submitting ? 'Preparing AI Session...' : 'Start AI Interview →'}</span>
        </button>
      </div>
    </div>
  );
};
