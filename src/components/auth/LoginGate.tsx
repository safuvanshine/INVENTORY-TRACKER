'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, User, Eye, EyeOff, KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface LoginGateProps {
  children: React.ReactNode;
}

export function LoginGate({ children }: LoginGateProps) {
  const { isAuthenticated, login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0b1120] flex flex-col items-center justify-center z-[9999] text-white">
        <div className="w-16 h-16 border-4 border-[#fed65b]/20 border-t-[#fed65b] rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest text-[#fed65b] uppercase">Verifying Vault Clearance...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || 'Authentication failed. Please check credentials.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#070b14] flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto selection:bg-[#fed65b] selection:text-[#0b1120]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#fed65b]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#fed65b]/30 shadow-2xl shadow-[#fed65b]/10 mb-4 ring-1 ring-white/10">
            <Shield className="w-8 h-8 text-[#fed65b]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wider font-headline">
            SHINE GOLD & DIAMONDS
          </h1>
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#fed65b] mt-1 font-semibold">
            Vault Security Access Gate
          </p>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
            Authorized personnel only. Enter your credentials to unlock inventory ledger.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0f172a]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. safuwan"
                  className="w-full pl-10 pr-4 py-3 bg-[#1e293b]/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fed65b] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter vault password"
                  className="w-full pl-10 pr-11 py-3 bg-[#1e293b]/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fed65b] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#fed65b] to-[#e6be44] text-[#0f172a] font-bold text-sm tracking-wide shadow-lg shadow-[#fed65b]/20 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Unlock & Open Vault</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400">
            <Shield className="w-3 h-3 text-[#fed65b]" />
            <span>End-to-End Encrypted • Real-time Multi-Device Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
}

