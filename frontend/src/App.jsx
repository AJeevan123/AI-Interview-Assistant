import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { InterviewSetup } from './pages/InterviewSetup';
import { Interview } from './pages/Interview';
import { InterviewResult } from './pages/InterviewResult';
import { History } from './pages/History';
import { ResumeAnalyzer } from './pages/ResumeAnalyzer';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';

// Protected Layout Route
const AppLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070B] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#1684FF]/20 border-t-[#1684FF] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#05070B] flex text-white font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <Navbar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Public Route (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070B] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#1684FF]/20 border-t-[#1684FF] animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            <Route
              path="/interview/setup"
              element={
                <AppLayout>
                  <InterviewSetup />
                </AppLayout>
              }
            />
            <Route
              path="/interview/:id"
              element={
                <AppLayout>
                  <Interview />
                </AppLayout>
              }
            />
            <Route
              path="/interview/:id/result"
              element={
                <AppLayout>
                  <InterviewResult />
                </AppLayout>
              }
            />
            <Route
              path="/history"
              element={
                <AppLayout>
                  <History />
                </AppLayout>
              }
            />
            <Route
              path="/resume"
              element={
                <AppLayout>
                  <ResumeAnalyzer />
                </AppLayout>
              }
            />
            <Route
              path="/progress"
              element={
                <AppLayout>
                  <Progress />
                </AppLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <AppLayout>
                  <Settings />
                </AppLayout>
              }
            />

            {/* Default Catch-all */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
