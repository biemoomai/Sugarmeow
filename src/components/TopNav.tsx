'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTransition, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || 'daily';

  if (pathname === '/login') return null;

  const tabs = [
    { id: 'daily', label: 'วันนี้' },
    { id: 'weekly', label: 'สัปดาห์นี้' },
    { id: 'monthly', label: 'เดือนนี้' },
    { id: 'yearly', label: 'ปีนี้' },
  ];

  const [isPending, startTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending) {
      setPendingTab(null);
    }
  }, [isPending]);

  const handleTabClick = (id: string) => {
    if (period === id) return;
    setPendingTab(id);
    const params = new URLSearchParams(searchParams);
    params.set('period', id);
    params.delete('offset'); // Reset offset when changing period
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="sticky top-0 z-40 bg-[#F8FAFC]/80 backdrop-blur-xl border-b border-slate-200/50 pt-4 pb-3 px-4 flex items-center justify-between gap-3 transition-opacity duration-300">
      <div className="flex-1 bg-slate-200/50 backdrop-blur-md p-1 rounded-xl shadow-inner border border-slate-200/60 max-w-md mx-auto">
        <div className="grid grid-cols-4 w-full gap-1">
          {tabs.map((tab) => {
            const isActive = period === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex-1 text-center py-1.5 rounded-lg text-[13px] font-bold transition-all relative flex justify-center items-center gap-1 ${
                  isActive ? 'text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="topNavTab"
                    className="absolute inset-0 bg-white rounded-lg"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {isPending && isActive && <Loader2 className="w-3 h-3 animate-spin absolute left-2" />}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <button 
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="shrink-0 p-2 text-slate-400 hover:text-rose-500 bg-white rounded-xl shadow-sm border border-slate-200 transition-colors"
      >
        <LogOut className="w-5 h-5" />
      </button>

      {/* Full Screen Loading Overlay */}
      <AnimatePresence>
        {isPending && pendingTab && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC]/70 backdrop-blur-md"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="text-slate-600 font-medium text-lg">
              กำลังโหลดข้อมูลของ <span className="text-indigo-600 font-bold">{tabs.find(t => t.id === pendingTab)?.label}</span>...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
