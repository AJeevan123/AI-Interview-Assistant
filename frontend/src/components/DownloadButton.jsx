import React, { useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export const DownloadButton = ({
  type = 'full', // 'full' | 'question'
  interviewId,
  questionId,
  label = 'Download Report',
  className = ''
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      let result;
      if (type === 'question' && questionId) {
        result = await api.downloadQuestion(interviewId, questionId);
      } else {
        result = await api.downloadFullReport(interviewId);
      }

      if (result && result.blob) {
        const url = window.URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `AI_Interview_${type === 'question' ? 'Question' : 'Report'}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setDownloaded(true);
        setTimeout(() => setDownloaded(false), 2500);
      }
    } catch (err) {
      console.error('Download failed:', err);
      alert('Unable to download report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition shadow-md ${
        downloaded
          ? 'bg-emerald-600 text-white'
          : 'bg-[#1684FF] hover:bg-blue-600 text-white shadow-blue-500/25'
      } ${downloading ? 'opacity-70 cursor-wait' : ''} ${className}`}
    >
      {downloading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating...</span>
        </>
      ) : downloaded ? (
        <>
          <Check className="w-4 h-4" />
          <span>Downloaded!</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
