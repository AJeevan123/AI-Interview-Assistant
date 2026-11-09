import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, Award, ChevronRight, History as HistoryIcon, Download } from 'lucide-react';
import { api } from '../services/api';
import { InterviewCard } from '../components/InterviewCard';

export const History = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.listInterviews();
        setInterviews(data);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleDownloadReport = async (interviewId) => {
    try {
      const res = await api.downloadFullReport(interviewId);
      if (res && res.blob) {
        const url = window.URL.createObjectURL(res.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename || 'AI_Interview_Report.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      alert('Failed to download interview report.');
    }
  };

  const filteredInterviews = interviews.filter((item) => {
    const matchesSearch =
      item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.interview_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'All' || item.role === selectedRole;
    const matchesType = selectedType === 'All' || item.interview_type === selectedType;
    return matchesSearch && matchesRole && matchesType;
  });

  const uniqueRoles = ['All', ...new Set(interviews.map((i) => i.role))];
  const uniqueTypes = ['All', ...new Set(interviews.map((i) => i.interview_type))];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1684FF]/15 border border-[#1684FF]/30 text-xs font-semibold text-[#1684FF] mb-2">
          <HistoryIcon className="w-3.5 h-3.5" />
          <span>Past Sessions Archive</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Interview History
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Review all past simulated interviews, examine scoring performance, and export complete reports.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#101318] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by role or interview type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#151922] border border-white/10 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-[#1684FF]"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#151922] border border-white/10 text-xs sm:text-sm text-gray-300 focus:outline-none focus:border-[#1684FF]"
          >
            {uniqueRoles.map((r) => (
              <option key={r} value={r}>Role: {r}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#151922] border border-white/10 text-xs sm:text-sm text-gray-300 focus:outline-none focus:border-[#1684FF]"
          >
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>Type: {t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Interview Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">Loading interview records...</div>
      ) : filteredInterviews.length === 0 ? (
        <div className="bg-[#101318] border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm text-gray-400">No interviews found matching the search criteria.</p>
          <Link
            to="/interview/setup"
            className="inline-block px-4 py-2 bg-[#1684FF] text-white rounded-xl text-xs font-semibold"
          >
            Practice New Interview
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInterviews.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onDownload={handleDownloadReport}
            />
          ))}
        </div>
      )}
    </div>
  );
};
