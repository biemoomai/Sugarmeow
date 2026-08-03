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
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-center">
      <div className="flex flex-col items-center gap-6 bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-slate-800/80 max-w-sm w-full">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-inner">
          <Cat className="w-9 h-9" />
        </div>
        
        <div>
          <h1 className="font-bold text-white text-2xl tracking-tight">Sugarmeow</h1>
          <p className="text-xs text-slate-400 mt-1">ระบบจัดการสต๊อกและบิลแบบกวนๆ เข้าสู่ระบบเพื่อเริ่มใช้งาน</p>
        </div>

        <div className="flex flex-col gap-3 w-full mt-2">
          <button
            onClick={() => signIn('line', { callbackUrl: '/' })}
            className="w-full py-3.5 px-4 bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-950/20 active:scale-[0.98]"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M19.365 9.863c.349.0.63.285.63.631.0.345-.281.63-.63.63H17.61v1.125h1.755c.349.0.63.283.63.63.0.344-.281.629-.63.629h-2.386c-.345.0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346.0.627.285.627.63.0.349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211.0-.412-.105-.534-.281l-2.404-3.418v3.042c0 .344-.281.629-.63.629-.345.0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.202-.033.211.0.413.105.534.282l2.405 3.418V8.108c0-.345.282-.63.63-.63.345.0.626.285.626.63v4.771zm-6.237 0c0 .344-.282.629-.63.629-.345.0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.345.0.627.285.627.63v4.771zm-2.479.0h-2.386c-.346.0-.627-.285-.627-.629V8.108c0-.345.281-.63.627-.63.348.0.63.285.63.63v4.141h1.756c.348.0.629.285.629.63.0.344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08-.085.643-.388 2.513-.424 3.044-.056.828.384 1.139.845.696.463-.443 4.981-4.385 6.797-7.502C21.849 15.688 24 13.167 24 10.314"/>
            </svg>
            <span>เข้าสู่ระบบด้วย LINE</span>
          </button>

          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-750 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all border border-slate-700 shadow-md active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
              <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9c-.8-1.5-1.3-3.2-1.3-5z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
            </svg>
            <span>เข้าสู่ระบบด้วย Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
