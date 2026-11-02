'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  GoldItem,
  DiamondItem,
  Branch,
  SystemAlert,
  AuditLogEntry,
  UserAccount,
  TickerMovement
} from '@/lib/types';
import {
  INITIAL_GOLD_ITEMS,
  INITIAL_DIAMOND_ITEMS,
  INITIAL_BRANCHES,
  INITIAL_ALERTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS,
  INITIAL_TICKER_MOVEMENTS,
  GOLD_SPOT_PRICE_PER_GRAM
} from '@/lib/initialData';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface InventoryContextType {
  // Gold State
  goldItems: GoldItem[];
  addGoldItem: (item: Omit<GoldItem, 'id' | 'lastUpdated'>) => void;
  updateGoldItem: (id: string, item: Partial<GoldItem>) => void;
  deleteGoldItem: (id: string) => void;
  bulkDeleteGold: (ids: string[]) => void;
  clearAllGold: () => void;
  bulkAddGold: (items: Omit<GoldItem, 'id' | 'lastUpdated'>[], options?: { mode?: 'upsert' | 'replace' | 'append' }) => void;

  // Diamond State
  diamondItems: DiamondItem[];
  addDiamondItem: (item: Omit<DiamondItem, 'id' | 'lastUpdated'>) => void;
  updateDiamondItem: (id: string, item: Partial<DiamondItem>) => void;
  deleteDiamondItem: (id: string) => void;
  bulkDeleteDiamonds: (ids: string[]) => void;
  clearAllDiamonds: () => void;
  bulkAddDiamonds: (items: Omit<DiamondItem, 'id' | 'lastUpdated'>[], options?: { mode?: 'upsert' | 'replace' | 'append' }) => void;

  // Reset & Restore Data
  resetDefaultData: () => void;

  // Branch & Filter State
  branches: Branch[];
  selectedBranch: string;
  setSelectedBranch: (branchName: string) => void;
  globalSearch: string;
  setGlobalSearch: (search: string) => void;

  // System Alerts & Logs
  alerts: SystemAlert[];
  dismissAlert: (id: string) => void;
  markAlertRead: (id: string) => void;
  auditLogs: AuditLogEntry[];
  addAuditLog: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;

  // Users
  users: UserAccount[];
  addUser: (user: Omit<UserAccount, 'id' | 'initials' | 'lastActive'>) => void;
  updateUser: (id: string, user: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;

  // Spot Prices & Tickers
  goldSpotPrice: number;
  setGoldSpotPrice: (price: number) => void;
  tickerMovements: TickerMovement[];

  // Toast System
  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

  // Aggregated Stats
  totalGoldWeightKg: number;
  totalGoldValueUsd: number;
  totalDiamondCarats: number;
  totalDiamondValueUsd: number;
  activeVaultCount: number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  GOLD: 'shine_gold_items_v2',
  DIAMOND: 'shine_diamond_items_v2',
  ALERTS: 'shine_alerts_v2',
  AUDIT_LOGS: 'shine_audit_logs_v2',
  USERS: 'shine_users_v2',
  SPOT_PRICE: 'shine_gold_spot_price_v2'
};

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [goldItems, setGoldItems] = useState<GoldItem[]>(INITIAL_GOLD_ITEMS);
  const [diamondItems, setDiamondItems] = useState<DiamondItem[]>(INITIAL_DIAMOND_ITEMS);
  const [branches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [selectedBranch, setSelectedBranch] = useState<string>('All Branches');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [goldSpotPrice, setGoldSpotPrice] = useState<number>(GOLD_SPOT_PRICE_PER_GRAM);
  const [tickerMovements, setTickerMovements] = useState<TickerMovement[]>(INITIAL_TICKER_MOVEMENTS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync state between client (localStorage cache) and central server repository (/api/inventory)
  useEffect(() => {
    let isMounted = true;

    const initializeLedger = async () => {
      try {
        // 1. Fetch live shared ledger from server
        const res = await fetch('/api/inventory');
        const result = await res.json();

        if (result.success && result.data && isMounted) {
          const serverData = result.data;
          // If server already has saved items, use them as truth for ALL browsers & links!
          if (serverData.goldItems && serverData.goldItems.length > 0) {
            setGoldItems(serverData.goldItems);
          }
          if (serverData.diamondItems && serverData.diamondItems.length > 0) {
            setDiamondItems(serverData.diamondItems);
          }
          if (serverData.alerts) setAlerts(serverData.alerts);
          if (serverData.auditLogs) setAuditLogs(serverData.auditLogs);
          if (serverData.users) setUsers(serverData.users);
          if (serverData.goldSpotPrice) setGoldSpotPrice(serverData.goldSpotPrice);
        } else {
          // 2. Server uninitialized: check if this client already has localStorage data (e.g. from Chrome)
          const storedGold = localStorage.getItem(STORAGE_KEYS.GOLD);
          const storedDiamond = localStorage.getItem(STORAGE_KEYS.DIAMOND);
          const storedAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS);
          const storedLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
          const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
          const storedSpot = localStorage.getItem(STORAGE_KEYS.SPOT_PRICE);

          const initialGold = storedGold ? JSON.parse(storedGold) : INITIAL_GOLD_ITEMS;
          const initialDiamond = storedDiamond ? JSON.parse(storedDiamond) : INITIAL_DIAMOND_ITEMS;
          const initialAlerts = storedAlerts ? JSON.parse(storedAlerts) : INITIAL_ALERTS;
          const initialLogs = storedLogs ? JSON.parse(storedLogs) : INITIAL_AUDIT_LOGS;
          const initialUsers = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
          const initialSpot = storedSpot ? parseFloat(storedSpot) : GOLD_SPOT_PRICE_PER_GRAM;

          if (isMounted) {
            setGoldItems(initialGold);
            setDiamondItems(initialDiamond);
            setAlerts(initialAlerts);
            setAuditLogs(initialLogs);
            setUsers(initialUsers);
            setGoldSpotPrice(initialSpot);
          }

          // Immediately sync to server so Edge and other browsers see this
          await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              goldItems: initialGold,
              diamondItems: initialDiamond,
              alerts: initialAlerts,
              auditLogs: initialLogs,
              users: initialUsers,
              goldSpotPrice: initialSpot
            })
          });
        }
      } catch (err) {
        console.error('Failed to sync with central server ledger, using local cache:', err);
        try {
          const storedGold = localStorage.getItem(STORAGE_KEYS.GOLD);
          if (storedGold && isMounted) setGoldItems(JSON.parse(storedGold));
          const storedDiamond = localStorage.getItem(STORAGE_KEYS.DIAMOND);
          if (storedDiamond && isMounted) setDiamondItems(JSON.parse(storedDiamond));
        } catch {}
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };

    initializeLedger();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to localStorage AND broadcast to central server whenever state updates
  useEffect(() => {
    if (!isLoaded) return;

    // Cache locally
    try {
      localStorage.setItem(STORAGE_KEYS.GOLD, JSON.stringify(goldItems));
      localStorage.setItem(STORAGE_KEYS.DIAMOND, JSON.stringify(diamondItems));
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.SPOT_PRICE, goldSpotPrice.toString());
    } catch (e) {
      console.error('Failed to save to localStorage cache', e);
    }

    // Debounced sync to server file
    const syncTimeout = setTimeout(async () => {
      try {
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goldItems,
            diamondItems,
            alerts,
            auditLogs,
            users,
            goldSpotPrice
          })
        });
      } catch (err) {
        console.error('Failed to broadcast inventory update to server:', err);
      }
    }, 350);

    return () => clearTimeout(syncTimeout);
  }, [goldItems, diamondItems, alerts, auditLogs, users, goldSpotPrice, isLoaded]);

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addAuditLog = (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newLog: AuditLogEntry = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: 'Just now'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addGoldItem = (item: Omit<GoldItem, 'id' | 'lastUpdated'>) => {
    const newItem: GoldItem = {
      ...item,
      id: `gld-${Date.now()}`,
      lastUpdated: 'Just now'
    };
    setGoldItems(prev => [newItem, ...prev]);
    addAuditLog({
      user: 'Master Admin',
      action: 'Gold Lot Deposited',
      itemTag: item.tagNo,
      category: 'Gold',
      branch: item.branch,
      details: `Added ${item.item} (${item.weight} kg) - ${item.brand}`
    });
    setTickerMovements(prev => [
      {
        id: `t-${Date.now()}`,
        type: 'IN',
        tagNo: item.tagNo,
        description: `${item.item} ${item.weight}kg (${item.branch})`,
        timeAgo: 'Just now'
      },
      ...prev.slice(0, 15)
    ]);
    showToast('Gold Lot Deposited', `${item.tagNo} (${item.weight} kg) added to ${item.branch}`);
  };

  const updateGoldItem = (id: string, updates: Partial<GoldItem>) => {
    setGoldItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates, lastUpdated: 'Just now' };
          addAuditLog({
            user: 'Master Admin',
            action: 'Gold Lot Modified',
            itemTag: updated.tagNo,
            category: 'Gold',
            branch: updated.branch,
            details: `Updated attributes for ${updated.tagNo}`
          });
          return updated;
        }
        return item;
      })
    );
    showToast('Record Updated', 'Gold inventory record updated successfully.', 'info');
  };

  const deleteGoldItem = (id: string) => {
    const target = goldItems.find(i => i.id === id);
    if (target) {
      setGoldItems(prev => prev.filter(item => item.id !== id));
      addAuditLog({
        user: 'Master Admin',
        action: 'Gold Lot Removed',
        itemTag: target.tagNo,
        category: 'Gold',
        branch: target.branch,
        details: `Deleted ${target.tagNo} from ${target.branch}`
      });
      showToast('Record Removed', `Gold item ${target.tagNo} removed from vault.`, 'info');
    }
  };

  const bulkDeleteGold = (ids: string[]) => {
    if (ids.length === 0) return;
    setGoldItems(prev => prev.filter(item => !ids.includes(item.id)));
    addAuditLog({
      user: 'Master Admin',
      action: 'Bulk Gold Deletion',
      itemTag: `${ids.length} items`,
      category: 'Gold',
      branch: 'All Branches',
      details: `Deleted ${ids.length} gold records in bulk`
    });
    showToast('Bulk Delete Completed', `Removed ${ids.length} gold record(s) successfully.`, 'info');
  };

  const clearAllGold = () => {
    const count = goldItems.length;
    setGoldItems([]);
    addAuditLog({
      user: 'Master Admin',
      action: 'Cleared All Gold',
      itemTag: 'ALL',
      category: 'Gold',
      branch: 'All Branches',
      details: `Cleared all ${count} gold items from system`
    });
    showToast('Gold Cleared', `Removed all ${count} gold records.`, 'info');
  };

  const bulkAddGold = (
    items: Omit<GoldItem, 'id' | 'lastUpdated'>[],
    options?: { mode?: 'upsert' | 'replace' | 'append' }
  ) => {
    const mode = options?.mode || 'upsert';

    if (mode === 'replace') {
      const newItems: GoldItem[] = items.map((item, idx) => ({
        ...item,
        id: `gld-bulk-${Date.now()}-${idx}`,
        lastUpdated: 'Just now'
      }));
      setGoldItems(newItems);
      addAuditLog({
        user: 'Master Admin',
        action: 'Excel Gold Manifest Replace',
        itemTag: `${newItems.length} items`,
        category: 'Gold',
        branch: 'All Branches',
        details: `Replaced vault gold records with ${newItems.length} items from Excel`
      });
      showToast('Vault Gold Replaced', `Loaded ${newItems.length} gold assets from Excel.`);
      return;
    }

    if (mode === 'append') {
      const newItems: GoldItem[] = items.map((item, idx) => ({
        ...item,
        id: `gld-bulk-${Date.now()}-${idx}`,
        lastUpdated: 'Just now'
      }));
      setGoldItems(prev => [...newItems, ...prev]);
      showToast('Excel Manifest Ingested', `Imported ${newItems.length} gold assets successfully.`);
      return;
    }

    // Default 'upsert': update matching tag numbers, append new
    let updatedCount = 0;
    let addedCount = 0;

    setGoldItems(prev => {
      const updatedList: GoldItem[] = [...prev];
      const newlyAdded: GoldItem[] = [];

      items.forEach((item, idx) => {
        const cleanTag = item.tagNo.toLowerCase().trim();
        const existingIndex = updatedList.findIndex(x => x.tagNo.toLowerCase().trim() === cleanTag);

        if (existingIndex >= 0) {
          updatedList[existingIndex] = {
            ...updatedList[existingIndex],
            ...item,
            lastUpdated: 'Just updated from Excel'
          };
          updatedCount++;
        } else {
          newlyAdded.push({
            ...item,
            id: `gld-bulk-${Date.now()}-${idx}`,
            lastUpdated: 'Just now'
          });
          addedCount++;
        }
      });

      return [...newlyAdded, ...updatedList];
    });

    if (updatedCount > 0 && addedCount > 0) {
      showToast('Excel Manifest Synced', `Updated ${updatedCount} existing records and added ${addedCount} new gold assets.`);
    } else if (updatedCount > 0) {
      showToast('Gold Records Updated', `Successfully updated ${updatedCount} items from Excel.`);
    } else {
      showToast('Excel Manifest Ingested', `Imported ${addedCount} gold assets successfully.`);
    }
  };

  const addDiamondItem = (item: Omit<DiamondItem, 'id' | 'lastUpdated'>) => {
    const newItem: DiamondItem = {
      ...item,
      id: `dia-${Date.now()}`,
      lastUpdated: 'Just now'
    };
    setDiamondItems(prev => [newItem, ...prev]);
    addAuditLog({
      user: 'Master Admin',
      action: 'Diamond Lot Created',
      itemTag: item.tagNo,
      category: 'Diamond',
      branch: item.branch,
      details: `Registered ${item.item} ${item.shape} (${item.carat} ct)`
    });
    setTickerMovements(prev => [
      {
        id: `t-${Date.now()}`,
        type: 'IN',
        tagNo: item.tagNo,
        description: `${item.shape} ${item.carat}ct ($${item.tagPrice.toLocaleString()})`,
        timeAgo: 'Just now'
      },
      ...prev.slice(0, 15)
    ]);
    showToast('Diamond Catalogued', `${item.tagNo} (${item.carat} ct) catalogued.`);
  };

  const updateDiamondItem = (id: string, updates: Partial<DiamondItem>) => {
    setDiamondItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates, lastUpdated: 'Just now' };
          addAuditLog({
            user: 'Master Admin',
            action: 'Diamond Lot Modified',
            itemTag: updated.tagNo,
            category: 'Diamond',
            branch: updated.branch,
            details: `Updated attributes for ${updated.tagNo}`
          });
          return updated;
        }
        return item;
      })
    );
    showToast('Diamond Updated', 'Diamond stone record updated successfully.', 'info');
  };

  const deleteDiamondItem = (id: string) => {
    const target = diamondItems.find(i => i.id === id);
    if (target) {
      setDiamondItems(prev => prev.filter(item => item.id !== id));
      addAuditLog({
        user: 'Master Admin',
        action: 'Diamond Lot Removed',
        itemTag: target.tagNo,
        category: 'Diamond',
        branch: target.branch,
        details: `Deleted diamond ${target.tagNo}`
      });
      showToast('Stone Deleted', `Diamond ${target.tagNo} removed.`, 'info');
    }
  };

  const bulkDeleteDiamonds = (ids: string[]) => {
    if (ids.length === 0) return;
    setDiamondItems(prev => prev.filter(item => !ids.includes(item.id)));
    addAuditLog({
      user: 'Master Admin',
      action: 'Bulk Diamond Deletion',
      itemTag: `${ids.length} items`,
      category: 'Diamond',
      branch: 'All Branches',
      details: `Deleted ${ids.length} diamond records in bulk`
    });
    showToast('Bulk Delete Completed', `Removed ${ids.length} diamond record(s) successfully.`, 'info');
  };

  const clearAllDiamonds = () => {
    const count = diamondItems.length;
    setDiamondItems([]);
    addAuditLog({
      user: 'Master Admin',
      action: 'Cleared All Diamonds',
      itemTag: 'ALL',
      category: 'Diamond',
      branch: 'All Branches',
      details: `Cleared all ${count} diamond items from system`
    });
    showToast('Diamonds Cleared', `Removed all ${count} diamond records.`, 'info');
  };

  const bulkAddDiamonds = (
    items: Omit<DiamondItem, 'id' | 'lastUpdated'>[],
    options?: { mode?: 'upsert' | 'replace' | 'append' }
  ) => {
    const mode = options?.mode || 'upsert';

    if (mode === 'replace') {
      const newItems: DiamondItem[] = items.map((item, idx) => ({
        ...item,
        id: `dia-bulk-${Date.now()}-${idx}`,
        lastUpdated: 'Just now'
      }));
      setDiamondItems(newItems);
      addAuditLog({
        user: 'Master Admin',
        action: 'Excel Diamond Manifest Replace',
        itemTag: `${newItems.length} items`,
        category: 'Diamond',
        branch: 'All Branches',
        details: `Replaced vault diamond records with ${newItems.length} items from Excel`
      });
      showToast('Vault Diamonds Replaced', `Loaded ${newItems.length} diamond items from Excel.`);
      return;
    }

    if (mode === 'append') {
      const newItems: DiamondItem[] = items.map((item, idx) => ({
        ...item,
        id: `dia-bulk-${Date.now()}-${idx}`,
        lastUpdated: 'Just now'
      }));
      setDiamondItems(prev => [...newItems, ...prev]);
      addAuditLog({
        user: 'Master Admin',
        action: 'Excel Diamond Manifest Ingest',
        itemTag: `${newItems.length} items`,
        category: 'Diamond',
        branch: 'All Branches',
        details: `Imported ${newItems.length} diamond items from Excel manifest`
      });
      showToast('Excel Manifest Ingested', `Imported ${newItems.length} diamond items successfully.`);
      return;
    }

    // Default 'upsert': update matching tag numbers, append new
    let updatedCount = 0;
    let addedCount = 0;

    setDiamondItems(prev => {
      const updatedList: DiamondItem[] = [...prev];
      const newlyAdded: DiamondItem[] = [];

      items.forEach((item, idx) => {
        const cleanTag = item.tagNo.toLowerCase().trim();
        const existingIndex = updatedList.findIndex(x => x.tagNo.toLowerCase().trim() === cleanTag);

        if (existingIndex >= 0) {
          updatedList[existingIndex] = {
            ...updatedList[existingIndex],
            ...item,
            lastUpdated: 'Just updated from Excel'
          };
          updatedCount++;
        } else {
          newlyAdded.push({
            ...item,
            id: `dia-bulk-${Date.now()}-${idx}`,
            lastUpdated: 'Just now'
          });
          addedCount++;
        }
      });

      return [...newlyAdded, ...updatedList];
    });

    addAuditLog({
      user: 'Master Admin',
      action: 'Excel Manifest Sync',
      itemTag: `${items.length} items`,
      category: 'Diamond',
      branch: 'All Branches',
      details: `Excel Ingest: Updated ${updatedCount} existing records with accurate Carat & Tag Price, added ${addedCount} new items`
    });

    if (updatedCount > 0 && addedCount > 0) {
      showToast('Excel Manifest Synced', `Updated ${updatedCount} existing records and added ${addedCount} new diamond items.`);
    } else if (updatedCount > 0) {
      showToast('Diamond Records Updated', `Successfully updated ${updatedCount} diamond records with accurate Carat & Tag Price.`);
    } else {
      showToast('Excel Manifest Ingested', `Imported ${addedCount} diamond items successfully.`);
    }
  };

  const resetDefaultData = () => {
    setGoldItems(INITIAL_GOLD_ITEMS);
    setDiamondItems(INITIAL_DIAMOND_ITEMS);
    setAlerts(INITIAL_ALERTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setUsers(INITIAL_USERS);
    setGoldSpotPrice(GOLD_SPOT_PRICE_PER_GRAM);
    try {
      localStorage.removeItem(STORAGE_KEYS.GOLD);
      localStorage.removeItem(STORAGE_KEYS.DIAMOND);
      localStorage.removeItem(STORAGE_KEYS.ALERTS);
      localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.SPOT_PRICE);
    } catch (e) {}

    fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goldItems: INITIAL_GOLD_ITEMS,
        diamondItems: INITIAL_DIAMOND_ITEMS,
        alerts: INITIAL_ALERTS,
        auditLogs: INITIAL_AUDIT_LOGS,
        users: INITIAL_USERS,
        goldSpotPrice: GOLD_SPOT_PRICE_PER_GRAM
      })
    }).catch(() => {});

    showToast('Data Reset', 'All inventory data restored to initial default specimen.', 'info');
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    showToast('Alert Dismissed', 'Notification marked as resolved.', 'info');
  };

  const markAlertRead = (id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, read: true } : a)));
  };

  const addUser = (user: Omit<UserAccount, 'id' | 'initials' | 'lastActive'>) => {
    const initials = user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    const newUser: UserAccount = {
      ...user,
      id: `usr-${Date.now()}`,
      initials,
      lastActive: 'Just now'
    };
    setUsers(prev => [newUser, ...prev]);
    showToast('User Provisioned', `Granted ${user.role} access to ${user.name}`);
  };

  const updateUser = (id: string, updatedFields: Partial<UserAccount>) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== id) return u;
        const updatedName = updatedFields.name !== undefined ? updatedFields.name : u.name;
        const initials = updatedFields.name
          ? updatedName
              .split(' ')
              .filter(Boolean)
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2) || u.initials
          : u.initials;
        return {
          ...u,
          ...updatedFields,
          name: updatedName,
          initials
        };
      })
    );
    showToast('User Updated', `Account details for ${updatedFields.name || 'personnel'} updated`);
  };

  const deleteUser = (id: string) => {
    const target = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast('User Removed', `${target?.name || 'Account'} has been deleted`, 'info');
  };

  // Stats calculation
  const totalGoldWeightKg = goldItems.reduce((sum, item) => sum + (item.weight || 0), 0);
  const totalGoldValueUsd = goldItems.reduce((sum, item) => sum + (item.estValueUsd || (item.weight || 0) * 1000 * goldSpotPrice), 0);
  const totalDiamondCarats = diamondItems.reduce((sum, item) => sum + (item.carat || 0), 0);
  const totalDiamondValueUsd = diamondItems.reduce((sum, item) => sum + (item.tagPrice || 0), 0);
  const activeVaultCount = new Set(goldItems.map(i => i.branch).concat(diamondItems.map(i => i.branch))).size;

  return (
    <InventoryContext.Provider
      value={{
        goldItems,
        addGoldItem,
        updateGoldItem,
        deleteGoldItem,
        bulkDeleteGold,
        clearAllGold,
        bulkAddGold,
        diamondItems,
        addDiamondItem,
        updateDiamondItem,
        deleteDiamondItem,
        bulkDeleteDiamonds,
        clearAllDiamonds,
        bulkAddDiamonds,
        resetDefaultData,
        branches,
        selectedBranch,
        setSelectedBranch,
        globalSearch,
        setGlobalSearch,
        alerts,
        dismissAlert,
        markAlertRead,
        auditLogs,
        addAuditLog,
        users,
        addUser,
        updateUser,
        deleteUser,
        goldSpotPrice,
        setGoldSpotPrice,
        tickerMovements,
        toasts,
        showToast,
        dismissToast,
        totalGoldWeightKg,
        totalGoldValueUsd,
        totalDiamondCarats,
        totalDiamondValueUsd,
        activeVaultCount
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
