'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount } from '@/lib/types';
import { useInventory } from '@/context/InventoryContext';

interface AuthContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'shine_vault_auth_session_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { users } = useInventory();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          timeout = setTimeout(() => {
            setCurrentUser(parsed);
          }, 0);
        }
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
    } finally {
      setIsLoading(false);
    }
    return () => clearTimeout(timeout);
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanIdentifier = usernameOrEmail.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      return { success: false, error: 'Please enter both username and password.' };
    }

    // 1. Check if trying to log in as Master Admin (Safuwan / admin)
    const isAdminAttempt =
      cleanIdentifier === 'safuwan' ||
      cleanIdentifier === 'admin' ||
      cleanIdentifier === 'safuwan@shinegold.luxury' ||
      cleanIdentifier === 'safuwanpc';

    if (isAdminAttempt) {
      try {
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', password: cleanPassword })
        });
        const data = await res.json();

        if (data.success) {
          const adminUser: UserAccount = {
            id: 'usr-safuwan',
            name: 'Safuwan',
            initials: 'SF',
            email: 'safuwan@shinegold.luxury',
            role: 'Master Admin',
            branch: 'HO',
            activeStatus: 'Active',
            lastActive: 'Now'
          };
          setCurrentUser(adminUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Incorrect Master Password.' };
        }
      } catch {
        // Fallback offline check
        if (cleanPassword === 'shine123') {
          const adminUser: UserAccount = {
            id: 'usr-safuwan',
            name: 'Safuwan',
            initials: 'SF',
            email: 'safuwan@shinegold.luxury',
            role: 'Master Admin',
            branch: 'HO',
            activeStatus: 'Active',
            lastActive: 'Now'
          };
          setCurrentUser(adminUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
          return { success: true };
        }
        return { success: false, error: 'Incorrect Master Password.' };
      }
    }

    // 2. Check Staff Users
    const matchedUser = users.find(
      u =>
        u.email.toLowerCase() === cleanIdentifier ||
        u.name.toLowerCase() === cleanIdentifier ||
        u.name.toLowerCase().replace(/\s+/g, '') === cleanIdentifier
    );

    if (matchedUser) {
      // If user has specific password set, use it; otherwise default staff password 'staff123' or master password
      const expectedPassword = matchedUser.password || 'staff123';
      if (cleanPassword === expectedPassword || cleanPassword === 'shine123') {
        const staffUser: UserAccount = {
          ...matchedUser,
          activeStatus: 'Active',
          lastActive: 'Now'
        };
        setCurrentUser(staffUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(staffUser));
        return { success: true };
      } else {
        return { success: false, error: 'Incorrect password for this user.' };
      }
    }

    return { success: false, error: 'User not found. Use "safuwan" for Master Admin or a registered staff name.' };
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
  };

  const isAdmin = currentUser?.role === 'Master Admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isAdmin,
        login,
        logout,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

