const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData vs JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If not a login/register request, clear token
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      removeAuthToken();
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
  }

  // Check if content-disposition indicates a download
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.includes('attachment')) {
    const blob = await response.blob();
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch ? filenameMatch[1] : 'download.txt';
    return { blob, filename };
  }

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // Interviews
  createInterview: (data) => request('/interviews', { method: 'POST', body: JSON.stringify(data) }),
  listInterviews: () => request('/interviews'),
  getInterview: (id) => request(`/interviews/${id}`),
  submitAnswer: (interviewId, questionId, answerData) => {
    const payload = typeof answerData === 'string'
      ? { answer_text: answerData, candidate_answer: answerData, question_id: questionId }
      : { question_id: questionId, ...answerData };
    return request(`/interviews/${interviewId}/answer?question_id=${encodeURIComponent(questionId)}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getNextQuestion: (interviewId) =>
    request(`/interviews/${interviewId}/next-question`, { method: 'POST' }),
  completeInterview: (interviewId) =>
    request(`/interviews/${interviewId}/complete`, { method: 'POST' }),

  // Downloads
  downloadFullReport: (interviewId) => request(`/interviews/${interviewId}/download`),
  downloadQuestion: (interviewId, questionId) =>
    request(`/interviews/${interviewId}/questions/${questionId}/download`),

  // Resume
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/resume/upload', { method: 'POST', body: formData });
  },
  analyzeResumeText: (text) => {
    const formData = new FormData();
    formData.append('resume_text', text);
    return request('/resume/analyze', { method: 'POST', body: formData });
  },
  analyzeJD: (text) => {
    const formData = new FormData();
    formData.append('jd_text', text);
    return request('/resume/jd/analyze', { method: 'POST', body: formData });
  },

  // Progress
  getProgress: () => request('/progress'),

  // Health
  getHealth: () => request('/health'),
};
