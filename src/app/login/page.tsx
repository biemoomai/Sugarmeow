'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Cat } from 'lucide-react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    } else if (status === 'unauthenticated') {
      // Auto trigger LINE OAuth login instantly
      signIn('line', { callbackUrl: '/' });
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
      <div className="flex flex-col items-center gap-4 bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-slate-100 max-w-xs w-full">
        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 animate-pulse shadow-sm">
          <Cat className="w-8 h-8" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-lg">กำลังเชื่อมต่อกับ LINE...</h2>
          <p className="text-xs text-slate-400 mt-1">ระบบกำลังเข้าสู่ระบบให้อัตโนมัติในแป๊บเดียวครับ</p>
        </div>
        <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mt-2"></div>
      </div>
    </div>
  );
}
