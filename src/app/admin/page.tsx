'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { Badge } from '@/components/ui/Badge';
import { LiveTicker } from '@/components/layout/LiveTicker';
import { AddItemModal } from '@/components/modals/AddItemModal';
import { EditItemModal } from '@/components/modals/EditItemModal';
import { BulkUploadModal } from '@/components/modals/BulkUploadModal';
import { ProvisionUserModal } from '@/components/modals/ProvisionUserModal';
import { EditUserModal } from '@/components/modals/EditUserModal';
import { GoldItem, DiamondItem, UserAccount } from '@/lib/types';
import { downloadExcelGoldTemplate, downloadExcelDiamondTemplate, formatNumber, formatUsd } from '@/lib/utils';
import {
  ShieldAlert,
  FileSpreadsheet,
  Upload,
  UserPlus,
  Edit,
  Pencil,
  Trash2,
  Clock,
  Layers,
  Gem,
  Download,
  Plus,
  RefreshCw,
  ShieldCheck,
  CheckSquare,
  Square,
  MinusSquare,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';

export default function AdminPage() {
  const {
    goldItems,
    diamondItems,
    alerts,
    dismissAlert,
    users,
    updateUser,
    deleteUser,
    auditLogs,
    goldSpotPrice,
    setGoldSpotPrice,
    showToast,
    deleteGoldItem,
    deleteDiamondItem,
    bulkDeleteGold,
    bulkDeleteDiamonds,
    clearAllGold,
    clearAllDiamonds,
    resetDefaultData
  } = useInventory();

  // Admin Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Change Password Modal State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [changePassError, setChangePassError] = useState<string>('');
  const [changePassSuccess, setChangePassSuccess] = useState<string>('');
  const [isChangingPass, setIsChangingPass] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = sessionStorage.getItem('SHINE_ADMIN_AUTH') === 'true';
      setIsAuthenticated(isAuth);
      setIsAuthChecking(false);
    }
  }, []);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!passwordInput.trim()) {
      setAuthError('Please enter the Master Admin Password.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', password: passwordInput.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('SHINE_ADMIN_AUTH', 'true');
        }
        showToast('Access Granted', 'Master Admin governance unlocked.', 'success');
        setPasswordInput('');
      } else {
        setAuthError(data.error || 'Incorrect Master Password. Please try again.');
      }
    } catch {
      setAuthError('Failed to communicate with authentication service.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('SHINE_ADMIN_AUTH');
    }
    showToast('Admin Locked', 'Master Admin session locked.', 'info');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError('');
    setChangePassSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangePassError('Please complete all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePassError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 4) {
      setChangePassError('New password must be at least 4 characters.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();

      if (data.success) {
        setChangePassSuccess('Password updated successfully! Future logins will require this key.');
        showToast('Password Updated', 'Admin Master Password updated successfully.');
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setChangePassSuccess('');
        }, 1200);
      } else {
        setChangePassError(data.error || 'Failed to update password.');
      }
    } catch {
      setChangePassError('Error connecting to authentication service.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleResetToDefaultPassword = async () => {
    if (!confirm('Reset Master Password to default (shine123)?')) return;
    setIsChangingPass(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_to_default' })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Password Reset', 'Master password restored to default: shine123', 'info');
        setIsChangePasswordOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setChangePassError('');
        setChangePassSuccess('');
      } else {
        setChangePassError(data.error || 'Failed to reset password.');
      }
    } catch {
      setChangePassError('Error connecting to auth service.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Active Category Box Selector ('gold' | 'diamond')
  const [activeTab, setActiveTab] = useState<'gold' | 'diamond'>('gold');

  // Search filter inside admin tables
  const [adminSearch, setAdminSearch] = useState<string>('');

  // Selected Row IDs for Multi-Delete
  const [selectedGoldIds, setSelectedGoldIds] = useState<string[]>([]);
  const [selectedDiamondIds, setSelectedDiamondIds] = useState<string[]>([]);

  // Modals
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<'gold' | 'diamond'>('gold');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ item: GoldItem | DiamondItem; category: 'gold' | 'diamond' } | null>(null);

  // Confirm delete modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'single' | 'selected' | 'all';
    category: 'gold' | 'diamond';
    targetId?: string;
    count?: number;
  } | null>(null);

  // Spot price editor
  const [isEditingSpot, setIsEditingSpot] = useState(false);
  const [tempSpotPrice, setTempSpotPrice] = useState(goldSpotPrice.toString());

  const handleUpdateSpotPrice = () => {
    const p = parseFloat(tempSpotPrice);
    if (!isNaN(p) && p > 0) {
      setGoldSpotPrice(p);
      setIsEditingSpot(false);
      showToast('Spot Price Recalibrated', `Spot gold rate updated to $${p.toFixed(2)}/g`);
    }
  };

  const handleDownloadTemplate = (type: 'gold' | 'diamond') => {
    if (type === 'gold') {
      downloadExcelGoldTemplate();
    } else {
      downloadExcelDiamondTemplate();
    }
    showToast('Excel Template Downloaded', `${type.toUpperCase()} Excel manifest template downloaded.`);
  };

  // Filtered Gold Items
  const filteredGoldItems = useMemo(() => {
    const q = adminSearch.toLowerCase().trim();
    if (!q) return goldItems;
    return goldItems.filter(
      i =>
        i.tagNo.toLowerCase().includes(q) ||
        i.item.toLowerCase().includes(q) ||
        i.certificateNo.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        i.branch.toLowerCase().includes(q)
    );
  }, [goldItems, adminSearch]);

  // Filtered Diamond Items
  const filteredDiamondItems = useMemo(() => {
    const q = adminSearch.toLowerCase().trim();
    if (!q) return diamondItems;
    return diamondItems.filter(
      i =>
        i.tagNo.toLowerCase().includes(q) ||
        i.item.toLowerCase().includes(q) ||
        i.certificateNo.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.shape.toLowerCase().includes(q) ||
        i.clarity.toLowerCase().includes(q) ||
        i.colour.toLowerCase().includes(q) ||
        i.branch.toLowerCase().includes(q)
    );
  }, [diamondItems, adminSearch]);

  // Gold Selection logic
  const isAllGoldSelected = filteredGoldItems.length > 0 && selectedGoldIds.length === filteredGoldItems.length;
  const isSomeGoldSelected = selectedGoldIds.length > 0 && !isAllGoldSelected;

  const toggleSelectAllGold = () => {
    if (isAllGoldSelected) {
      setSelectedGoldIds([]);
    } else {
      setSelectedGoldIds(filteredGoldItems.map(i => i.id));
    }
  };

  const toggleGoldItem = (id: string) => {
    setSelectedGoldIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Diamond Selection logic
  const isAllDiamondSelected = filteredDiamondItems.length > 0 && selectedDiamondIds.length === filteredDiamondItems.length;
  const isSomeDiamondSelected = selectedDiamondIds.length > 0 && !isAllDiamondSelected;

  const toggleSelectAllDiamonds = () => {
    if (isAllDiamondSelected) {
      setSelectedDiamondIds([]);
    } else {
      setSelectedDiamondIds(filteredDiamondItems.map(i => i.id));
    }
  };

  const toggleDiamondItem = (id: string) => {
    setSelectedDiamondIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Handle Confirmed Deletions
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.category === 'gold') {
      if (deleteConfirm.type === 'single' && deleteConfirm.targetId) {
        deleteGoldItem(deleteConfirm.targetId);
        setSelectedGoldIds(prev => prev.filter(id => id !== deleteConfirm.targetId));
      } else if (deleteConfirm.type === 'selected') {
        bulkDeleteGold(selectedGoldIds);
        setSelectedGoldIds([]);
      } else if (deleteConfirm.type === 'all') {
        clearAllGold();
        setSelectedGoldIds([]);
      }
    } else {
      if (deleteConfirm.type === 'single' && deleteConfirm.targetId) {
        deleteDiamondItem(deleteConfirm.targetId);
        setSelectedDiamondIds(prev => prev.filter(id => id !== deleteConfirm.targetId));
      } else if (deleteConfirm.type === 'selected') {
        bulkDeleteDiamonds(selectedDiamondIds);
        setSelectedDiamondIds([]);
      } else if (deleteConfirm.type === 'all') {
        clearAllDiamonds();
        setSelectedDiamondIds([]);
      }
    }

    setDeleteConfirm(null);
  };

  // Totals for the 2 boxes
  const totalGoldWeight = goldItems.reduce((sum, item) => sum + (item.weight || 0), 0);
  const totalGoldVal = goldItems.reduce((sum, item) => sum + (item.estValueUsd || (item.weight || 0) * 1000 * goldSpotPrice), 0);
  const totalDiamondCarat = diamondItems.reduce((sum, item) => sum + (item.carat || 0), 0);
  const totalDiamondVal = diamondItems.reduce((sum, item) => sum + (item.tagPrice || 0), 0);

  // Loading screen while checking session storage
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d121c]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400 tracking-wider">VERIFYING MASTER VAULT CREDENTIALS...</p>
        </div>
      </div>
    );
  }

  // Gatekeeper Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#0a0e17] text-slate-100 relative overflow-hidden">
        {/* Background ambient luxury glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#fed65b]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#fed65b]/10 rounded-full blur-3xl pointer-events-none" />

        <LiveTicker mode="all" />

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#131b2e]/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#fed65b]/15 border border-[#fed65b]/40 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(254,214,91,0.2)]">
                <Lock className="w-8 h-8 text-[#fed65b]" />
              </div>
              <h2 className="text-2xl font-bold font-headline tracking-tight text-white mb-2">
                Admin Control Center
              </h2>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                Restricted governance access. Please enter the master authorization key to manage inventory manifests.
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold mb-2">
                  Master Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="Enter admin password..."
                    autoFocus
                    className="w-full px-4 py-3 bg-[#0a0e17] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#fed65b] focus:ring-1 focus:ring-[#fed65b] font-mono tracking-wider transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#fed65b] to-[#d4af37] text-slate-950 font-bold text-sm rounded-xl shadow-lg hover:shadow-[#fed65b]/20 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authorizing Vault...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Unlock Admin Portal</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-400 font-mono">
                Default Master Password: <span className="text-[#fed65b] font-bold bg-[#fed65b]/10 px-2 py-0.5 rounded border border-[#fed65b]/20">shine123</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                (You can reset or change this password at any time inside the admin center)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f9fb]">
      <LiveTicker mode="all" />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-headline">
                Admin Control Center
              </h1>
              <span className="bg-[#fed65b]/20 text-[#735c00] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-[#fed65b]/50 flex items-center gap-1 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-[#d4af37]" /> Master Editor
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Live Vault Database Manager • Full Ingestion, Bulk Deletion & Stock Calibration
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm transition-all"
              title="Change Master Admin password"
            >
              <Key className="w-3.5 h-3.5 text-[#d4af37]" />
              Change Password
            </button>

            <button
              onClick={() => {
                if (confirm('Restore sample specimen records? This will reload initial demo data.')) {
                  resetDefaultData();
                  setSelectedGoldIds([]);
                  setSelectedDiamondIds([]);
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm transition-all"
              title="Reset data back to initial sample catalog"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset Sample Data
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 flex items-center gap-1.5 shadow-sm transition-all"
              title="Lock Admin session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              Lock Admin
            </button>
          </div>
        </div>

        {/* System Alerts Section */}
        {alerts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 font-headline flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#d4af37]" />
                Live Operational Alerts ({alerts.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all ${
                    alert.priority === 'Critical'
                      ? 'border-rose-300 ring-1 ring-rose-100'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                          alert.priority === 'Critical'
                            ? 'bg-rose-100 text-rose-700'
                            : alert.priority === 'High Priority'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {alert.priority}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
                    </div>

                    <h4 className="font-headline font-bold text-xs text-slate-900 mb-1">
                      {alert.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (alert.title.includes('Spot') || alert.title.includes('Volatility')) {
                          setIsEditingSpot(true);
                        } else {
                          showToast('Audit Triggered', `Processing: ${alert.title}`);
                        }
                      }}
                      className="text-[11px] font-bold text-[#735c00] hover:underline"
                    >
                      {alert.actionLabel || 'Investigate →'}
                    </button>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-[10px] text-slate-400 hover:text-slate-700"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bulk Upload + User Management Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bulk Operations (2 Columns) */}
          <section className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-headline">
                Excel Import Pipeline
              </h3>
              <span className="text-xs font-mono text-slate-500">
                Persistent Database Upload
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gold Upload Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#735c00] block">
                      Gold Manifest Ingestion
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      7 Columns: TAG, ITEM, CERT, DESC, BRAND, WEIGHT, BRANCH
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownloadTemplate('gold')}
                    className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Template
                  </button>
                </div>

                <div
                  onClick={() => {
                    setBulkCategory('gold');
                    setIsBulkOpen(true);
                  }}
                  className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#d4af37] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[110px] group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#fed65b]/20 text-[#735c00] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Upload Gold Excel</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">.XLSX, .XLS, .CSV</p>
                </div>
              </div>

              {/* Diamond Upload Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#065f46] block">
                      Diamond Manifest Ingestion
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      10 Columns: TAG, ITEM, CERT, DESC, BRANCH, CARAT, CLARITY, SHAPE, COLOUR, PRICE
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownloadTemplate('diamond')}
                    className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Template
                  </button>
                </div>

                <div
                  onClick={() => {
                    setBulkCategory('diamond');
                    setIsBulkOpen(true);
                  }}
                  className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#065f46] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[110px] group"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#065f46] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Upload Diamond Excel</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">.XLSX, .XLS, .CSV</p>
                </div>
              </div>
            </div>

            {/* Spot Price Calibrator */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  LBMA Gold Spot Calibration
                </span>
                <span className="text-sm font-bold text-slate-900 font-headline">
                  Current Rate: ${goldSpotPrice.toFixed(2)} / gram USD
                </span>
              </div>

              {isEditingSpot ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={tempSpotPrice}
                    onChange={e => setTempSpotPrice(e.target.value)}
                    className="w-24 px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                  <button
                    onClick={handleUpdateSpotPrice}
                    className="px-3 py-1.5 rounded-lg bg-[#0f172a] text-[#fed65b] text-xs font-bold shadow-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingSpot(false)}
                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setTempSpotPrice(goldSpotPrice.toString());
                    setIsEditingSpot(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  Update Spot Rate
                </button>
              )}
            </div>
          </section>

          {/* User Management (1 Column) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-headline">
                User Management
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {users.length} Accounts
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-slate-700">Authenticated Personnel</span>
                <span className="text-slate-400">Clearance Verified</span>
              </div>

              <div className="divide-y divide-slate-100 flex-1 p-2 max-h-[260px] overflow-y-auto custom-scrollbar">
                {users.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-mono">
                    No active user accounts found. Click below to provision a user.
                  </div>
                ) : (
                  users.map(user => (
                    <div
                      key={user.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#0f172a] text-[#fed65b] flex items-center justify-center text-[10px] font-bold font-mono shrink-0 shadow-xs">
                          {user.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                user.activeStatus === 'Active'
                                  ? 'bg-emerald-500'
                                  : user.activeStatus === 'Idle'
                                  ? 'bg-amber-400'
                                  : 'bg-slate-300'
                              }`}
                              title={`Status: ${user.activeStatus}`}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono truncate">
                            {user.role} • {user.branch}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {/* Edit Name / Role / Details Button */}
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#0f172a] hover:bg-slate-100 transition-colors"
                          title={`Edit / Change Name for ${user.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete User Button */}
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={`Delete ${user.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-slate-100 bg-slate-50 flex justify-center">
                <button
                  onClick={() => setIsUserModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#0f172a] hover:text-[#735c00] transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Provision New User
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ===== 2 PROMINENT BOX CARDS: GOLD & DIAMOND SELECTOR ===== */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-headline mb-1">
              Vault Master Inventory Database
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Click either box below to switch view and manage live records with Select All & Bulk Deletion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* BOX 1: GOLD */}
            <div
              onClick={() => setActiveTab('gold')}
              className={`rounded-2xl p-6 cursor-pointer transition-all duration-200 relative border-2 flex items-center justify-between shadow-sm ${
                activeTab === 'gold'
                  ? 'bg-white border-[#d4af37] ring-4 ring-[#fed65b]/20 shadow-md'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white opacity-85'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    activeTab === 'gold'
                      ? 'bg-[#fed65b] text-[#735c00] shadow-sm'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Layers className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline font-bold text-lg text-slate-900">
                      GOLD INVENTORY
                    </h3>
                    {activeTab === 'gold' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#fed65b]/20 text-[#735c00] text-[10px] font-mono font-bold uppercase border border-[#fed65b]/50">
                        Active View
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {goldItems.length} active lots registered in vaults
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                    <span className="font-bold text-slate-800">
                      {formatNumber(totalGoldWeight, 1)} kg Fine Gold
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-emerald-700 font-semibold">
                      {formatUsd(totalGoldVal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <span className="text-2xl font-bold font-headline text-slate-900">
                  {goldItems.length}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Total Records
                </span>
              </div>
            </div>

            {/* BOX 2: DIAMOND */}
            <div
              onClick={() => setActiveTab('diamond')}
              className={`rounded-2xl p-6 cursor-pointer transition-all duration-200 relative border-2 flex items-center justify-between shadow-sm ${
                activeTab === 'diamond'
                  ? 'bg-white border-[#065f46] ring-4 ring-emerald-500/20 shadow-md'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white opacity-85'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    activeTab === 'diamond'
                      ? 'bg-[#065f46] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Gem className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline font-bold text-lg text-slate-900">
                      DIAMOND INVENTORY
                    </h3>
                    {activeTab === 'diamond' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#065f46] text-[10px] font-mono font-bold uppercase border border-emerald-200">
                        Active View
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {diamondItems.length} certified diamond stones
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                    <span className="font-bold text-slate-800">
                      {formatNumber(totalDiamondCarat, 2)} ct Carats
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-emerald-700 font-semibold">
                      {formatUsd(totalDiamondVal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <span className="text-2xl font-bold font-headline text-slate-900">
                  {diamondItems.length}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Total Records
                </span>
              </div>
            </div>
          </div>

          {/* ===== ACTIVE TABLE STATION (GOLD OR DIAMOND) ===== */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col mt-4">
            {/* Table Control Bar */}
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
              {/* Search in Admin */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                  placeholder={`Search ${activeTab === 'gold' ? 'Gold (Tag, Brand, Cert...)' : 'Diamonds (Tag, Shape, Branch...)'}`}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                {/* Select All Quick Button */}
                {activeTab === 'gold' ? (
                  <button
                    onClick={toggleSelectAllGold}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    {isAllGoldSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[#735c00]" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    {isAllGoldSelected ? 'Deselect All' : 'Select All'} ({filteredGoldItems.length})
                  </button>
                ) : (
                  <button
                    onClick={toggleSelectAllDiamonds}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    {isAllDiamondSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[#065f46]" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    {isAllDiamondSelected ? 'Deselect All' : 'Select All'} ({filteredDiamondItems.length})
                  </button>
                )}

                {/* Clear All Data Button */}
                <button
                  onClick={() => {
                    setDeleteConfirm({
                      isOpen: true,
                      type: 'all',
                      category: activeTab,
                      count: activeTab === 'gold' ? goldItems.length : diamondItems.length
                    });
                  }}
                  disabled={activeTab === 'gold' ? goldItems.length === 0 : diamondItems.length === 0}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Clear All {activeTab === 'gold' ? 'Gold' : 'Diamonds'}
                </button>

                {/* Add Item Button */}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-all ${
                    activeTab === 'gold'
                      ? 'bg-[#0f172a] hover:bg-slate-800 text-[#fed65b]'
                      : 'bg-[#065f46] hover:bg-[#002116]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add {activeTab === 'gold' ? 'Gold' : 'Diamond'}
                </button>
              </div>
            </div>

            {/* Multi-Select Floating Action Bar */}
            {((activeTab === 'gold' && selectedGoldIds.length > 0) ||
              (activeTab === 'diamond' && selectedDiamondIds.length > 0)) && (
              <div className="bg-[#0f172a] text-white px-5 py-3 flex items-center justify-between text-xs font-mono animate-in fade-in slide-in-from-top duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#fed65b]" />
                  <span className="font-bold">
                    {activeTab === 'gold' ? selectedGoldIds.length : selectedDiamondIds.length} item(s) selected
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      if (activeTab === 'gold') setSelectedGoldIds([]);
                      else setSelectedDiamondIds([]);
                    }}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                  >
                    Deselect
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirm({
                        isOpen: true,
                        type: 'selected',
                        category: activeTab,
                        count: activeTab === 'gold' ? selectedGoldIds.length : selectedDiamondIds.length
                      });
                    }}
                    className="px-3.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected ({activeTab === 'gold' ? selectedGoldIds.length : selectedDiamondIds.length})
                  </button>
                </div>
              </div>
            )}

            {/* ===== ACTIVE TABLE: GOLD ===== */}
            {activeTab === 'gold' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#fed65b]/10 font-mono font-bold text-[11px] uppercase tracking-wider text-[#735c00]">
                      <th className="px-4 py-3.5 w-10 text-center">
                        <button onClick={toggleSelectAllGold} className="flex items-center justify-center">
                          {isAllGoldSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#735c00]" />
                          ) : isSomeGoldSelected ? (
                            <MinusSquare className="w-4 h-4 text-[#735c00]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3.5">1. TAG NUMBER</th>
                      <th className="px-4 py-3.5">2. ITEM</th>
                      <th className="px-4 py-3.5">3. CERT NO</th>
                      <th className="px-4 py-3.5">4. DESCRIPTION</th>
                      <th className="px-4 py-3.5">5. BRAND</th>
                      <th className="px-4 py-3.5 text-right">6. WEIGHT</th>
                      <th className="px-4 py-3.5">7. BRANCH</th>
                      <th className="px-4 py-3.5 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredGoldItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-xs font-sans">
                          {adminSearch ? 'No gold items matched your search query.' : 'No gold records yet. Upload an Excel file or add manually.'}
                        </td>
                      </tr>
                    ) : (
                      filteredGoldItems.map(item => {
                        const isSelected = selectedGoldIds.includes(item.id);
                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors group ${
                              isSelected ? 'bg-amber-50/70 hover:bg-amber-50' : 'hover:bg-[#fed65b]/5'
                            }`}
                          >
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => toggleGoldItem(item.id)}
                                className="flex items-center justify-center"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-[#735c00]" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-bold text-[#0f172a]">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                                {item.tagNo}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-sans font-semibold text-slate-900 max-w-[160px] truncate">
                              {item.item}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-[11px]">
                              {item.certificateNo}
                            </td>
                            <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate font-sans">
                              {item.description}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {item.brand}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {formatNumber(item.weight, 3)} <span className="text-[10px] font-normal text-slate-400">kg</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">
                              {item.branch}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setEditingItem({ item, category: 'gold' })}
                                  className="p-1.5 rounded hover:bg-amber-100 text-slate-400 hover:text-amber-800 transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteConfirm({
                                      isOpen: true,
                                      type: 'single',
                                      category: 'gold',
                                      targetId: item.id
                                    });
                                  }}
                                  className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ===== ACTIVE TABLE: DIAMOND ===== */}
            {activeTab === 'diamond' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-200 bg-emerald-50 font-mono font-bold text-[11px] uppercase tracking-wider text-[#065f46]">
                      <th className="px-4 py-3.5 w-10 text-center">
                        <button onClick={toggleSelectAllDiamonds} className="flex items-center justify-center">
                          {isAllDiamondSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#065f46]" />
                          ) : isSomeDiamondSelected ? (
                            <MinusSquare className="w-4 h-4 text-[#065f46]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3.5">1. TAG NUMBER</th>
                      <th className="px-4 py-3.5">2. ITEM</th>
                      <th className="px-4 py-3.5">3. CERT NO</th>
                      <th className="px-4 py-3.5">4. DESCRIPTION</th>
                      <th className="px-4 py-3.5">5. BRANCH</th>
                      <th className="px-4 py-3.5 text-right">6. CARAT</th>
                      <th className="px-4 py-3.5 text-center">7. CLARITY</th>
                      <th className="px-4 py-3.5">8. SHAPE</th>
                      <th className="px-4 py-3.5 text-center">9. COLOUR</th>
                      <th className="px-4 py-3.5 text-right">10. TAG PRICE</th>
                      <th className="px-4 py-3.5 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredDiamondItems.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-6 py-12 text-center text-slate-400 text-xs font-sans">
                          {adminSearch ? 'No diamonds matched your search query.' : 'No diamond records yet. Upload an Excel file or add manually.'}
                        </td>
                      </tr>
                    ) : (
                      filteredDiamondItems.map(item => {
                        const isSelected = selectedDiamondIds.includes(item.id);
                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors group ${
                              isSelected ? 'bg-emerald-50/80 hover:bg-emerald-50' : 'hover:bg-emerald-50/40'
                            }`}
                          >
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => toggleDiamondItem(item.id)}
                                className="flex items-center justify-center"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-[#065f46]" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-bold text-[#0f172a]">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {item.tagNo}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-sans font-semibold text-slate-900 max-w-[160px] truncate">
                              {item.item}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-[11px]">
                              {item.certificateNo}
                            </td>
                            <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate font-sans">
                              {item.description}
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-[140px] truncate">
                              {item.branch}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {formatNumber(item.carat, 2)} <span className="text-[10px] font-normal text-slate-400">ct</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] font-bold text-slate-700">
                                {item.clarity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-700 font-medium">
                              {item.shape}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-emerald-800">
                              {item.colour}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-800">
                              {formatUsd(item.tagPrice)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setEditingItem({ item, category: 'diamond' })}
                                  className="p-1.5 rounded hover:bg-emerald-100 text-slate-400 hover:text-emerald-800 transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteConfirm({
                                      isOpen: true,
                                      type: 'single',
                                      category: 'diamond',
                                      targetId: item.id
                                    });
                                  }}
                                  className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer Summary */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600 font-bold">
                Showing {activeTab === 'gold' ? filteredGoldItems.length : filteredDiamondItems.length} of{' '}
                {activeTab === 'gold' ? goldItems.length : diamondItems.length} total records
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setBulkCategory(activeTab);
                    setIsBulkOpen(true);
                  }}
                  className={`font-bold hover:underline flex items-center gap-1 ${
                    activeTab === 'gold' ? 'text-[#735c00]' : 'text-[#065f46]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import {activeTab.toUpperCase()} Excel
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Confirmation Modal for Delete Actions */}
      {deleteConfirm?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-headline">Confirm Deletion</h3>
                <p className="text-xs text-slate-500 font-mono">Permanent database removal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {deleteConfirm.type === 'single' && 'Are you sure you want to permanently delete this inventory asset?'}
              {deleteConfirm.type === 'selected' &&
                `Are you sure you want to permanently delete all ${deleteConfirm.count} selected ${deleteConfirm.category} records?`}
              {deleteConfirm.type === 'all' &&
                `Caution: This will permanently wipe all ${deleteConfirm.count} records from the ${deleteConfirm.category.toUpperCase()} vault database. This action cannot be undone.`}
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <BulkUploadModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        targetCategory={bulkCategory}
      />

      <ProvisionUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
      />

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-headline mb-1">
              Delete User Account?
            </h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900 font-bold">{userToDelete.name}</strong> ({userToDelete.role}) from the system?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem?.item || null}
        itemCategory={editingItem?.category || 'gold'}
      />

      {/* Change / Reset Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                setIsChangePasswordOpen(false);
                setChangePassError('');
                setChangePassSuccess('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#fed65b]/20 border border-[#fed65b]/50 flex items-center justify-center text-[#735c00]">
                <Key className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-headline">Change Master Password</h3>
                <p className="text-xs text-slate-500 font-mono">Update or reset the admin portal master access key</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] font-mono tracking-wider text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 4 chars)..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] font-mono tracking-wider text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] font-mono tracking-wider text-slate-900"
                />
              </div>

              {changePassError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{changePassError}</span>
                </div>
              )}

              {changePassSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{changePassSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetToDefaultPassword}
                  className="text-xs text-slate-500 hover:text-rose-600 underline font-mono transition-colors"
                >
                  Reset to default (shine123)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangePasswordOpen(false);
                      setChangePassError('');
                      setChangePassSuccess('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#d4af37] hover:bg-[#c49f2e] text-slate-950 shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isChangingPass ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
