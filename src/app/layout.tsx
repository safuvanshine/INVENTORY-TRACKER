import type { Metadata } from 'next';
import { Montserrat, Inter } from 'next/font/google';
import './globals.css';
import { InventoryProvider } from '@/context/InventoryContext';
import { AuthProvider } from '@/context/AuthContext';
import { LoginGate } from '@/components/auth/LoginGate';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { AIAssistantModal } from '@/components/ai/AIAssistantModal';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap'
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'SHINE GOLD & DIAMONDS — Preserving Purity',
  description: 'Enterprise High-Security Gold Bullion & Diamond Vault Inventory Tracking System',
  icons: {
    icon: '/logo.png'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="bg-[#f7f9fb] text-slate-900 min-h-screen antialiased flex selection:bg-[#fed65b] selection:text-[#0f172a]">
        <InventoryProvider>
          <AuthProvider>
            <LoginGate>
              {/* Persistent Sidebar on Desktop */}
              <Sidebar />

              {/* Main Layout Area offset by Sidebar */}
              <div className="flex-1 flex flex-col md:ml-[240px] min-w-0">
                <TopHeader />
                <div className="flex-1 flex flex-col">{children}</div>
              </div>

              {/* Built-in SHINE AI Copilot & Assistant */}
              <AIAssistantModal />

              {/* Global Toast Notification System */}
              <ToastContainer />
            </LoginGate>
          </AuthProvider>
        </InventoryProvider>
      </body>
    </html>
  );
}
