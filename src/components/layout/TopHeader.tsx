'use client';

import React, { useState } from 'react';
import {
  Search,
  Bell,
  User,
  MapPin,
  ChevronDown,
  Sparkles,
  TrendingUp,
  X,
  Menu,
  Gem,
  LogOut
} from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

export function TopHeader() {
  const {
    globalSearch,
    setGlobalSearch,
    selectedBranch,
    setSelectedBranch,
    branches,
    alerts,
    dismissAlert,
    goldSpotPrice
  } = useInventory();
  const { currentUser, logout, isAdmin } = useAuth();

  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  return (
    <header className="h-16 w-full sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm flex items-center justify-between px-6">
      {/* Mobile Hamburger toggle */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/gold" className="relative w-32 h-10 flex items-center">
          <Image
            src="/logo.png"
            alt="Shine Gold & Diamonds"
            fill
            className="object-contain"
          />
        </Link>
      </div>

      {/* Global Search Bar (on left) */}
      <div className="hidden md:flex flex-1 items-center max-w-md">
        <div className="relative w-full group">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0f172a] transition-colors" />
          <input
            type="text"
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            placeholder="Search Tag No, Certificate, Brand, Vault..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-transparent rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-200 transition-all"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-3 md:gap-4 ml-auto">
        {/* Ask RUBY AI Assistant Quick Trigger */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('open-ai-assistant'));
            }
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0f172a] hover:bg-slate-800 text-[#fed65b] border border-rose-500/40 hover:border-rose-400 shadow-sm text-xs font-bold font-headline transition-all hover:scale-105"
        >
          <Gem className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-white">Ask <span className="text-rose-400">RUBY</span></span>
        </button>

        {/* Spot Gold Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#fed65b]/20 border border-[#fed65b]/50 text-[#735c00] text-xs font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Spot AU:</span>
          <span className="font-bold font-mono">${goldSpotPrice.toFixed(2)}/g</span>
        </div>

        {/* Global Branch Selector Dropdown */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-xs font-medium text-slate-800 transition-colors border border-slate-200 cursor-pointer">
            <MapPin className="w-3.5 h-3.5 text-slate-600" />
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              aria-label="Filter active vault location"
              className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="All Branches">All Branches (14)</option>
              {branches.map(b => (
                <option key={b.id} value={b.name}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors relative"
            title="System Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-headline">
                    System Alerts & Tasks
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                    {alerts.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowAlertMenu(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {alerts.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No active system alerts.</p>
                ) : (
                  alerts.map(alert => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-colors relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                            alert.priority === 'Critical'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : alert.priority === 'High Priority'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {alert.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-800 mt-1">{alert.title}</h5>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{alert.description}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                        <Link
                          href="/admin"
                          onClick={() => setShowAlertMenu(false)}
                          className="text-[11px] font-semibold text-[#735c00] hover:underline"
                        >
                          {alert.actionLabel || 'Investigate →'}
                        </Link>
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="text-[10px] text-slate-400 hover:text-rose-600"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                <Link
                  href="/admin"
                  onClick={() => setShowAlertMenu(false)}
                  className="text-xs font-bold text-[#0f172a] hover:text-[#735c00] transition-colors"
                >
                  View All in Admin Control Center →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile pill with Logout */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#0f172a] text-[#fed65b] flex items-center justify-center text-xs font-bold shadow-sm ring-1 ring-slate-300">
              {currentUser.initials || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                {isAdmin ? (
                  <span className="text-[9px] text-[#fed65b] bg-[#0f172a] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    Admin
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    Staff
                  </span>
                )}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">{currentUser.role}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out / Lock Vault"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 top-16 bg-white z-50 p-6 flex flex-col gap-4 md:hidden animate-in slide-in-from-top">
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Search Tag No..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm"
            />
          </div>
          <Link
            href="/gold"
            onClick={() => setShowMobileMenu(false)}
            className="py-3 border-b text-sm font-semibold text-slate-800"
          >
            Gold Inventory
          </Link>
          <Link
            href="/diamonds"
            onClick={() => setShowMobileMenu(false)}
            className="py-3 border-b text-sm font-semibold text-slate-800"
          >
            Diamond Inventory
          </Link>
          <Link
            href="/branches"
            onClick={() => setShowMobileMenu(false)}
            className="py-3 border-b text-sm font-semibold text-slate-800"
          >
            Branch Status
          </Link>
          <Link
            href="/admin"
            onClick={() => setShowMobileMenu(false)}
            className="py-3 border-b text-sm font-semibold text-slate-800"
          >
            Admin Section
          </Link>
        </div>
      )}
    </header>
  );
}
