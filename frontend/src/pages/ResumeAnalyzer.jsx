import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Check, 
  Sparkles, 
  Bot, 
  ArrowRight, 
  AlertCircle, 
  Code2, 
  Briefcase, 
  GraduationCap, 
  FolderGit2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export const ResumeAnalyzer = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF resumes are supported.');
      return;
    }

    setFile(uploadedFile);
    setUploading(true);
    setError('');

    try {
      const res = await api.uploadResume(uploadedFile);
      setExtractedText(res.extracted_text);
      setAnalysis(res.analysis);
    } catch (err) {
      setError(err.message || 'Failed to analyze PDF resume. Please ensure file is valid.');
    } finally {
      setUploading(false);
    }
  };

  const handleStartInterviewWithResume = () => {
    navigate('/interview/setup', {
      state: {
        prefillResumeText: extractedText,
        prefillRole: analysis?.skills?.[0] ? `${analysis.skills[0]} Developer` : 'AI / ML Engineer'
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1684FF]/15 border border-[#1684FF]/30 text-xs font-semibold text-[#1684FF] mb-2">
          <FileText className="w-3.5 h-3.5" />
          <span>Resume Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          AI Resume Analyzer
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Upload your PDF resume to extract skills, review detected technologies, and generate tailored interview practice questions.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-[#101318] border border-white/10 rounded-3xl p-6 sm:p-8">
        <label className="border-2 border-dashed border-white/15 hover:border-[#1684FF]/50 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition bg-[#151922]/50 hover:bg-[#151922] group">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-[#1684FF] flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Upload className="w-8 h-8" />
          </div>
          <span className="text-sm sm:text-base font-semibold text-white">
            {uploading ? 'Extracting text and analyzing resume...' : 'Upload PDF Resume'}
          </span>
          <span className="text-xs text-gray-400 mt-1">
            Drag & drop or click to browse (Max 5MB)
          </span>
          {file && (
            <div className="mt-4 px-3 py-1 rounded-full bg-[#1684FF]/20 text-[#1684FF] text-xs font-medium flex items-center gap-1.5 border border-[#1684FF]/30">
              <Check className="w-3.5 h-3.5" />
              <span>{file.name}</span>
            </div>
          )}
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1684FF]" />
              <span>Extracted Resume Insights</span>
            </h2>

            <button
              onClick={handleStartInterviewWithResume}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1684FF] hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-blue-500/25"
            >
              <span>Practice Interview With This Resume</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills & Tech Stack */}
            <div className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                <Code2 className="w-4 h-4" />
                <span>Identified Skills & Technologies</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(analysis.skills || []).map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-[#151922] text-white border border-white/10 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="pt-2">
                <span className="text-xs text-gray-400 font-medium">All Detected Frameworks & Tools:</span>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  {(analysis.technologies || []).join(', ')}
                </p>
              </div>
            </div>

            {/* Experience & Education */}
            <div className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                <Briefcase className="w-4 h-4" />
                <span>Experience & Academic Summary</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {analysis.experience_summary}
              </p>

              <div className="pt-2 border-t border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Academic Qualifications:</span>
                </div>
                <div className="text-xs text-gray-200">
                  {(analysis.education || []).join(' • ')}
                </div>
              </div>
            </div>
          </div>

          {/* Projects Detected */}
          <div className="bg-[#101318] border border-white/10 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <FolderGit2 className="w-4 h-4" />
              <span>Highlighted Projects</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(analysis.projects || []).map((p, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#151922] border border-white/5 text-xs text-gray-200 font-medium">
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommended Practice Questions */}
          <div className="bg-[#101318] border border-[#1684FF]/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#1684FF] font-semibold text-sm">
              <Bot className="w-4 h-4" />
              <span>Questions Likely to be Asked in Your Interview</span>
            </div>
            <p className="text-xs text-gray-400">
              Based on your resume, the interviewer is expected to probe into:
            </p>
            <div className="space-y-2.5">
              {(analysis.recommended_questions || []).map((q, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#151922] border border-white/5 text-xs sm:text-sm text-gray-200 flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-[#1684FF]/20 text-[#1684FF] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{q}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
