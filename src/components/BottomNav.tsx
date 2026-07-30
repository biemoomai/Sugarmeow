'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'หน้าหลัก', href: '/', icon: Home },
    { name: 'รายการ', href: '/transactions', icon: List },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl p-2 flex justify-around items-center pointer-events-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full py-2 rounded-2xl transition-all ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNav"
                  className="absolute inset-0 bg-indigo-50/80 rounded-2xl"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className={`text-[11px] font-bold ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
