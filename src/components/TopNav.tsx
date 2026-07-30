'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';

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

  const handleTabClick = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('period', id);
    params.delete('offset'); // Reset offset when changing period
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className={`sticky top-0 z-40 bg-[#F8FAFC]/80 backdrop-blur-xl border-b border-slate-200/50 pt-4 pb-3 px-4 flex items-center justify-between gap-3 ${isPending ? 'opacity-60 pointer-events-none' : ''} transition-opacity duration-300`}>
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
    </div>
  );
}
