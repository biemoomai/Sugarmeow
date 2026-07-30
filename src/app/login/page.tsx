'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-pulse">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.5 10.155c0-4.321-4.298-7.834-9.569-7.834-5.274 0-9.57 3.513-9.57 7.834 0 3.843 3.327 7.106 8.01 7.742.311.042.736.134.846.335.1.182.032.559.015.772l-.145.875c-.042.257-.197.973.854.53 1.05-.44 5.666-3.336 7.77-5.733.916-1.045 1.789-2.585 1.789-4.521z" />
          </svg>
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
