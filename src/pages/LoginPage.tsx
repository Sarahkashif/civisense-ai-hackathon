import { useState } from 'react';
import { signUp, login } from '../services/authService';
import type { User } from '../types';

interface LoginPageProps {
  onAuth: (user: User) => void;
}

export default function LoginPage({ onAuth }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const result = await signUp(fullName, email, phone, password);
        if (result.user) {
          onAuth(result.user);
        } else {
          setError(result.error || 'Sign up failed.');
        }
      } else {
        const result = await login(email, password);
        if (result.user) {
          onAuth(result.user);
        } else {
          setError(result.error || 'Login failed.');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    }

    setLoading(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
      {/* Header */}
      <div className="text-center pt-10 sm:pt-16 pb-6 px-4">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7v14m18-14v14M6 7V4a1 1 0 011-1h10a1 1 0 011 1v3M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
            </svg>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-white">CiviSense AI</span>
        </div>
        <p className="text-primary-200 text-sm sm:text-base">Civic Intelligence Platform</p>
      </div>

      {/* Form Card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {mode === 'login'
              ? 'Log in to your CiviSense AI account.'
              : 'Sign up to start reporting civic issues.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="fullName" className="label-text">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  className="input-field"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="label-text">Email Address</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="phone" className="label-text">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  className="input-field"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="label-text">Password</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder={mode === 'login' ? 'Enter your password' : 'Create a password (min 6 characters)'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="label-text">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input-field"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg py-3"
            >
              {loading
                ? (mode === 'login' ? 'Logging in...' : 'Creating account...')
                : (mode === 'login' ? 'Log In' : 'Sign Up')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={switchMode}
                className="text-primary-600 font-semibold hover:text-primary-700 hover:underline"
              >
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
