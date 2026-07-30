'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TrendingUp, ShoppingCart, Wallet, CreditCard, Activity, ChevronLeft, ChevronRight, BarChart2, Cat, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList } from 'recharts';
import { useTransition } from 'react';

type Stats = {
  sales: number;
  purchases: number;
  expenses: number;
  profit: number;
};

export default function DashboardClient({ data, dateStr, period, offset }: { data: Stats; dateStr: string; period: string; offset: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);
  };

  const handleOffsetChange = (newOffset: number) => {
    startTransition(() => {
      router.push(`/?period=${period}&offset=${newOffset}`);
    });
  };

  const handleNavigateToTransactions = (type: string) => {
    let typeParam = '';
    if (type === 'ยอดขาย' || type === 'sales') typeParam = 'sales';
    if (type === 'ซื้อเข้า' || type === 'purchases') typeParam = 'purchases';
    if (type === 'รายจ่าย' || type === 'expenses') typeParam = 'expenses';
    
    startTransition(() => {
      if (typeParam) {
        router.push(`/transactions?period=${period}&offset=${offset}&type=${typeParam}`);
      } else {
        router.push(`/transactions?period=${period}&offset=${offset}`);
      }
    });
  };

  const chartData = [
    { name: 'ยอดขาย', value: data.sales, color: '#0ea5e9' },
    { name: 'ซื้อเข้า', value: data.purchases, color: '#f59e0b' },
    { name: 'รายจ่าย', value: data.expenses, color: '#fb7185' },
    { name: 'กำไร', value: data.profit, color: data.profit >= 0 ? '#10b981' : '#ef4444' },
  ];

  return (
    <div className="bg-[#F8FAFC] text-slate-800 font-sans pb-24 selection:bg-indigo-100 relative overflow-hidden min-h-[calc(100vh-120px)]">
      {/* Decorative bg blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[40%] bg-emerald-400/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply" />

      <div className="max-w-md mx-auto px-4 pt-4 pb-6 relative z-10 transition-opacity duration-300">
        <header className="mb-4">
          <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-xl p-1.5 shadow-sm border border-slate-200 w-full">
            <button onClick={() => handleOffsetChange(offset - 1)} className="p-2 hover:bg-white rounded-lg text-slate-500 transition-colors shadow-sm active:scale-95">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center gap-2 flex-1">
              {isPending && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
              <p className="text-sm font-bold text-indigo-700 text-center">{dateStr}</p>
            </div>
            <button onClick={() => handleOffsetChange(offset + 1)} className="p-2 hover:bg-white rounded-lg text-slate-500 transition-colors shadow-sm active:scale-95" disabled={offset === 0}>
              <ChevronRight className={`w-5 h-5 ${offset === 0 ? 'opacity-30' : ''}`} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {data.sales === 0 && data.purchases === 0 && data.expenses === 0 && data.profit === 0 ? (
            <motion.div 
              key={`empty-${dateStr}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center h-64 mt-10 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="bg-indigo-50 p-4 rounded-full mb-3">
                <Cat className="w-12 h-12 text-indigo-300" />
              </div>
              <p className="font-bold text-slate-600">ยังไม่มีรายการในช่วงเวลานี้</p>
              <p className="text-xs text-slate-400 mt-1">กดปุ่ม + ด้านล่างเพื่อเพิ่มรายการแรกได้เลย!</p>
            </motion.div>
          ) : (
          <motion.div 
            key={`data-${dateStr}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex flex-col gap-4"
          >
          {/* Chart */}
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-500" /> กราฟเปรียบเทียบ
            </h3>
            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 25, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(value) => value >= 1000 || value <= -1000 ? `${value / 1000}k` : value}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                    itemStyle={{ color: '#0f172a' }}
                    formatter={(value: any) => [new Intl.NumberFormat('th-TH').format(value || 0), '']}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={2} opacity={0.5} />
                  <Bar 
                    dataKey="value" 
                    radius={[6, 6, 0, 0]} 
                    barSize={32}
                    onClick={(data) => { if (data?.name) handleNavigateToTransactions(data.name); }}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      formatter={(val: any) => new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(Number(val) || 0)}
                      style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bento Grid Stats */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            {/* Sales */}
            <div 
              onClick={() => handleNavigateToTransactions('sales')}
              className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white flex flex-col justify-between h-28 cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 mb-1">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-500 font-medium text-xs">ยอดขาย</p>
                <p className="text-xl font-black text-sky-600 tracking-tight">{formatMoney(data.sales)}</p>
              </div>
            </div>

            {/* Profit */}
            <div 
              onClick={() => handleNavigateToTransactions('all')}
              className="bg-gradient-to-br from-emerald-400 to-teal-500 p-3.5 rounded-2xl shadow-[0_4px_20px_rgb(16,185,129,0.2)] border border-emerald-300 flex flex-col justify-between h-28 text-white relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform"
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white mb-1 backdrop-blur-sm border border-white/20">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="relative z-10">
                <p className="text-emerald-50 font-medium text-xs">กำไรสุทธิ</p>
                <p className="text-xl font-black tracking-tight">{formatMoney(data.profit)}</p>
              </div>
            </div>

            {/* Purchases */}
            <div 
              onClick={() => handleNavigateToTransactions('purchases')}
              className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white flex flex-col justify-center cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <p className="text-slate-500 font-medium text-xs">ซื้อเข้า</p>
              </div>
              <p className="text-lg font-bold text-amber-500">{formatMoney(data.purchases)}</p>
            </div>

            {/* Expenses */}
            <div 
              onClick={() => handleNavigateToTransactions('expenses')}
              className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white flex flex-col justify-center cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <p className="text-slate-500 font-medium text-xs">ค่าใช้จ่าย</p>
              </div>
              <p className="text-lg font-bold text-rose-500">{formatMoney(data.expenses)}</p>
            </div>
          </div>

        </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
