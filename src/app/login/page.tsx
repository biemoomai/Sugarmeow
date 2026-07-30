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
      // Auto redirect to LINE login for seamless UX
      signIn('line', { callbackUrl: '/' });
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.5 10.155c0-4.321-4.298-7.834-9.569-7.834-5.274 0-9.57 3.513-9.57 7.834 0 3.843 3.327 7.106 8.01 7.742.311.042.736.134.846.335.1.182.032.559.015.772l-.145.875c-.042.257-.197.973.854.53 1.05-.44 5.666-3.336 7.77-5.733.916-1.045 1.789-2.585 1.789-4.521zm-13.674 1.485c0 .356-.289.645-.645.645h-1.928v1.928c0 .356-.289.645-.645.645s-.645-.289-.645-.645v-3.218c0-.356.289-.645.645-.645h2.573c.356 0 .645.289.645.645zm2.748.645c0 .356-.289.645-.645.645h-.543v-1.93h.543c.356 0 .645.289.645.645v.64zm3.857-1.29v2.573c0 .356-.289.645-.645.645-.19 0-.37-.083-.493-.223l-1.637-1.859v1.437c0 .356-.289.645-.645.645s-.645-.289-.645-.645v-2.573c0-.356.289-.645.645-.645.19 0 .37.083.493.223l1.637 1.859v-1.437c0-.356.289-.645.645-.645s.645.289.645.645z" />
          </svg>
        </div>
        
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">ระบบแดชบอร์ด</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">กรุณาเข้าสู่ระบบด้วย LINE<br/>เพื่อดูข้อมูลบัญชีของคุณ</p>
        </div>

        <button
          onClick={() => signIn('line', { callbackUrl: '/' })}
          className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.5 10.155c0-4.321-4.298-7.834-9.569-7.834-5.274 0-9.57 3.513-9.57 7.834 0 3.843 3.327 7.106 8.01 7.742.311.042.736.134.846.335.1.182.032.559.015.772l-.145.875c-.042.257-.197.973.854.53 1.05-.44 5.666-3.336 7.77-5.733.916-1.045 1.789-2.585 1.789-4.521z" />
          </svg>
          เข้าสู่ระบบด้วย LINE
        </button>
      </div>
    </div>
  );
}
