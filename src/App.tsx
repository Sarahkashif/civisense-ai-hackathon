import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import ConfirmationPage from './pages/ConfirmationPage';
import TrackPage from './pages/TrackPage';
import AuthorityPage from './pages/AuthorityPage';
import { initializeData } from './services/complaintService';
import type { User } from './types';

function WelcomeBanner({ user, onDone }: { user: User; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 5000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-accent-100 text-accent-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Welcome to CiviSense AI!
        </h1>
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-2">
          Report civic problems and help make your city better.
        </p>
        <p className="text-primary-600 font-semibold">
          Hello, {user.fullName}!
        </p>
        <div className="mt-6">
          <div className="w-8 h-1 bg-primary-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-primary-600 rounded-full animate-[shrink_5s_linear_forwards]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, setUser } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeDone, setWelcomeDone] = useState(() => {
    return sessionStorage.getItem('civisense_welcomed') === 'true';
  });

  const handleAuth = (u: User) => {
    setUser(u);
    setShowWelcome(true);
    setWelcomeDone(false);
  };

  const handleWelcomeDone = () => {
    setShowWelcome(false);
    setWelcomeDone(true);
    sessionStorage.setItem('civisense_welcomed', 'true');
  };

  useEffect(() => {
    initializeData().catch(err => console.error('Failed to initialize data:', err));
  }, []);

  // Not logged in — show login/signup
  if (!user) {
    return <LoginPage onAuth={handleAuth} />;
  }

  // Logged in but welcome not yet shown — show welcome banner
  if (showWelcome && !welcomeDone) {
    return <WelcomeBanner user={user} onDone={handleWelcomeDone} />;
  }

  // Main app
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/confirmation/:id" element={<ConfirmationPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/authority" element={<AuthorityPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
