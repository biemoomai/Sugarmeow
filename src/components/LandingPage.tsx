'use client';

import { FaLine } from 'react-icons/fa6';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF5F8] to-[#FCE7F3] p-6 relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-pink-200/50 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-rose-200/50 rounded-full blur-3xl" />
      
      <div className="max-w-md w-full bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-white/50 text-center relative z-10 flex flex-col items-center">
        {/* Cat Avatar/Icon */}
        <div className="w-24 h-24 bg-gradient-to-tr from-pink-400 to-rose-400 rounded-full flex items-center justify-center shadow-lg shadow-pink-200 mb-6">
          <span className="text-4xl">🐱</span>
        </div>
        
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 mb-3">
          ชูก้าร์แมวมึน
        </h1>
        <p className="text-slate-600 mb-8 font-medium">
          ระบบบันทึกรายรับ-รายจ่ายผ่านแชท LINE ที่ง่ายที่สุด
        </p>
        
        <div className="flex flex-col gap-4 w-full">
          {/* Option 1: Want to Chat / Add Bot */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
            <div className="text-sm font-semibold text-slate-500 text-left">สำหรับผู้ใช้ใหม่ (อยากแชท)</div>
            <a 
              href="https://line.me/R/ti/p/@212bgchu" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b34c] text-white py-3 px-6 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-[#06C755]/30"
            >
              <FaLine className="text-xl" />
              เพิ่มเพื่อน LINE บอท
            </a>
          </div>

          {/* Option 2: Want to view web dashboard */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 mt-2">
            <div className="text-sm font-semibold text-slate-500 text-left">สำหรับสมาชิก (อยากเข้าเว็บ)</div>
            <button 
              onClick={() => alert("เพื่อความปลอดภัยของข้อมูล กรุณาพิมพ์คำว่า 'รายงาน' หรือ 'แดชบอร์ด' ในแชท LINE ของชูก้าร์แมวมึน แล้วกดลิงก์ที่บอทส่งให้เพื่อเข้าสู่ระบบครับ 🐱")}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-3 px-6 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-slate-800/30"
            >
              เข้าสู่ระบบผ่านแชท
            </button>
            <p className="text-xs text-slate-400 mt-1">พิมพ์ "รายงาน" ในแชทเพื่อรับลิงก์เข้าสู่ระบบ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
