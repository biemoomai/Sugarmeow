'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const period = searchParams.get('period') || 'daily';

  if (!userId) return null;

  const tabs = [
    { id: 'daily', label: 'วันนี้' },
    { id: 'weekly', label: 'สัปดาห์นี้' },
    { id: 'monthly', label: 'เดือนนี้' },
    { id: 'yearly', label: 'ปีนี้' },
  ];

  const handleTabClick = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('period', id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="sticky top-0 z-40 bg-[#F8FAFC]/80 backdrop-blur-xl border-b border-slate-200/50 pt-4 pb-3 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-slate-200/50 backdrop-blur-md p-1 rounded-xl shadow-inner border border-slate-200/60">
          <div className="grid grid-cols-4 w-full gap-1">
            {tabs.map((tab) => {
              const isActive = period === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex-1 text-center py-1.5 rounded-lg text-sm font-bold transition-all relative ${
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
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
