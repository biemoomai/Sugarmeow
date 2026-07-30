'use client';

import { useState } from 'react';
import { Download, Table as TableIcon, ChevronLeft, ChevronRight, X, List, Trash2, Cat } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { deleteTransaction } from '@/app/actions/deleteTransaction';

type TransactionRecord = {
  id: string;
  date: string;
  type: string;
  detail: string;
  entityName?: string;
  productName?: string;
  amount: number;
  status: string;
};

export default function TransactionsClient({ transactions, dateStr, period, offset, filterType }: { transactions: TransactionRecord[]; dateStr: string; period: string; offset: number; filterType: string }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('แน่ใจนะว่าจะลบรายการนี้? ลบแล้วกู้คืนไม่ได้นะ!')) {
      setIsDeleting(id);
      try {
        const res = await deleteTransaction(id);
        if (!res.success) {
          alert('ลบไม่ได้ว่ะ: ' + res.error);
        }
      } catch (e) {
        alert('เกิดข้อผิดพลาดตอนลบ');
      }
      setIsDeleting(null);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);
  };

  const totalSales = transactions.filter(t => t.type === 'ขายสินค้า').reduce((sum, t) => sum + t.amount, 0);
  const totalPurchases = transactions.filter(t => t.type === 'ซื้อเข้า').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'ค่าใช้จ่าย').reduce((sum, t) => sum + t.amount, 0);

  const handleOffsetChange = (newOffset: number) => {
    router.push(`/transactions?period=${period}&offset=${newOffset}${filterType !== 'all' ? `&type=${filterType}` : ''}`);
  };

  const handleTypeFilterClick = (type: string) => {
    if (filterType !== type) {
      router.push(`/transactions?period=${period}&offset=${offset}&type=${type}`);
    }
  };

  const clearFilter = () => {
    router.push(`/transactions?period=${period}&offset=${offset}`);
  };

  const handleExportExcel = () => {
    const excelData = transactions.map(t => ({
      'วันที่': new Date(t.date).toLocaleDateString('th-TH'),
      'ประเภท': t.type,
      'รายละเอียด': t.detail,
      'จำนวนเงิน (บาท)': t.amount,
      'สถานะ': t.status === 'PAID' ? 'จ่ายแล้ว' : t.status === 'PENDING' ? 'ค้างชำระ' : t.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    
    XLSX.writeFile(workbook, `Transactions_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-800 font-sans pb-24 pt-4 px-4 min-h-[calc(100vh-120px)] relative">
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-md mx-auto relative z-10"
      >
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
              <TableIcon className="w-5 h-5 text-indigo-600" /> รายการ
            </h1>
            <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-200">
              <button onClick={() => handleOffsetChange(offset - 1)} className="p-0.5 hover:bg-white rounded text-slate-500 transition-colors shadow-sm active:scale-95">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-xs font-bold text-indigo-700 w-[70px] text-center">{dateStr}</p>
              <button onClick={() => handleOffsetChange(offset + 1)} className="p-0.5 hover:bg-white rounded text-slate-500 transition-colors shadow-sm active:scale-95" disabled={offset === 0}>
                <ChevronRight className={`w-4 h-4 ${offset === 0 ? 'opacity-30' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex bg-slate-200/50 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('list')} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                <List className="w-3.5 h-3.5" /> แบบการ์ด
              </button>
              <button 
                onClick={() => setViewMode('table')} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                <TableIcon className="w-3.5 h-3.5" /> แบบตาราง
              </button>
            </div>
            
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        {filterType !== 'all' && (
          <div className="mb-3 inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold">
            <span>
              เฉพาะ: {filterType === 'sales' ? 'ยอดขาย' : filterType === 'purchases' ? 'ซื้อเข้า' : 'รายจ่าย'}
            </span>
            <button onClick={clearFilter} className="bg-indigo-200/50 hover:bg-indigo-200 rounded-full p-0.5 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="">
          {viewMode === 'list' ? (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white overflow-hidden">
              <div className="flex flex-col divide-y divide-slate-100">
                {transactions.length > 0 ? transactions.map((t) => (
                  <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-500 text-xs shrink-0">{new Date(t.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          t.type === 'ขายสินค้า' ? 'bg-sky-100 text-sky-700' :
                          t.type === 'ซื้อเข้า' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {t.type}
                        </span>
                      </div>
                      <p className="font-bold text-slate-700 text-sm truncate">{t.entityName}</p>
                      {t.productName && <p className="text-xs text-slate-500 mt-0.5 truncate">{t.productName}</p>}
                    </div>
                    
                    <div className="text-right shrink-0 flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <p className={`font-black text-[15px] ${
                          t.type === 'ขายสินค้า' ? 'text-sky-600' :
                          t.type === 'ซื้อเข้า' ? 'text-amber-600' :
                          'text-rose-600'
                        }`}>
                          {t.type === 'ขายสินค้า' ? '+' : '-'}{formatMoney(t.amount)}
                        </p>
                        <button 
                          onClick={() => handleDelete(t.id)}
                          disabled={isDeleting === t.id}
                          className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-1">
                        {t.status === 'PAID' ? (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">จ่ายแล้ว</span>
                        ) : t.status === 'PENDING' ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-bold">ค้างชำระ</span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">{t.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                    <div className="bg-slate-50 p-3 rounded-full mb-3">
                      <Cat className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold">ยังไม่มีรายการในช่วงเวลานี้</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Sales Table */}
              {(filterType === 'all' || filterType === 'sales') && (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-sky-100 overflow-hidden">
                  <div 
                    onClick={() => handleTypeFilterClick('sales')}
                    className={`px-4 py-2.5 border-b border-sky-100 flex items-center justify-between transition-colors ${filterType !== 'sales' ? 'bg-sky-50/80 hover:bg-sky-100/80 cursor-pointer' : 'bg-sky-50/80'}`}
                  >
                    <span className="font-bold text-sky-800 text-sm flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                      รายรับ (ยอดขาย) 
                      <span className="ml-1.5 text-sky-600 bg-sky-100/50 px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap">รวม +{formatMoney(totalSales)}</span>
                    </span>
                    {filterType !== 'sales' && (
                      <span className="text-sky-600/70 text-xs font-semibold flex items-center whitespace-nowrap ml-2">
                        ดูเฉพาะกลุ่มนี้ <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="">
                    <table className="w-full text-left border-collapse table-fixed">
                      <colgroup>
                        <col className="w-[15%]" />
                        <col className="w-[23%]" />
                        <col className="w-[20%]" />
                        <col className="w-[18%]" />
                        <col className="w-[18%]" />
                        <col className="w-[6%]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-sky-50/30 text-sky-700/60 text-[10px] font-bold uppercase tracking-wider border-b border-sky-100/50">
                          <th className="px-2 py-2 pl-4">วันที่</th>
                          <th className="px-2 py-2">ลูกค้า</th>
                          <th className="px-2 py-2">สินค้า</th>
                          <th className="px-2 py-2 text-right">ยอดเงิน</th>
                          <th className="px-2 py-2 text-center">สถานะ</th>
                          <th className="px-2 py-2 pr-4 text-right">ลบ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs bg-white">
                        {transactions.filter(t => t.type === 'ขายสินค้า').length > 0 ? transactions.filter(t => t.type === 'ขายสินค้า').map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-2 py-3 pl-4 text-slate-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</td>
                            <td className="px-2 py-3 font-bold text-slate-700 truncate">{t.entityName}</td>
                            <td className="px-2 py-3 text-slate-600 text-xs truncate">{t.productName}</td>
                            <td className="px-2 py-3 text-right font-black text-sky-600 whitespace-nowrap">+{formatMoney(t.amount)}</td>
                            <td className="px-2 py-3 text-center whitespace-nowrap">
                              {t.status === 'PAID' ? <span className="text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap">จ่ายแล้ว</span> : <span className="text-rose-600 bg-rose-50 border border-rose-100/50 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap">ค้างชำระ</span>}
                            </td>
                            <td className="px-2 py-3 pr-4 text-right">
                              <button onClick={() => handleDelete(t.id)} disabled={isDeleting === t.id} className="text-slate-300 hover:text-rose-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="p-10 text-center text-slate-400 text-xs">
                              <div className="flex flex-col items-center justify-center">
                                <Cat className="w-8 h-8 mb-2 text-slate-300" />
                                <p className="font-bold">ยังไม่มีรายการในช่วงเวลานี้</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Purchases Table */}
              {(filterType === 'all' || filterType === 'purchases') && (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-amber-100 overflow-hidden">
                  <div 
                    onClick={() => handleTypeFilterClick('purchases')}
                    className={`px-4 py-2.5 border-b border-amber-100 flex items-center justify-between transition-colors ${filterType !== 'purchases' ? 'bg-amber-50/80 hover:bg-amber-100/80 cursor-pointer' : 'bg-amber-50/80'}`}
                  >
                    <span className="font-bold text-amber-800 text-sm flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      รายจ่าย (ซื้อเข้า)
                      <span className="ml-1.5 text-amber-600 bg-amber-100/50 px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap">รวม -{formatMoney(totalPurchases)}</span>
                    </span>
                    {filterType !== 'purchases' && (
                      <span className="text-amber-600/70 text-xs font-semibold flex items-center whitespace-nowrap ml-2">
                        ดูเฉพาะกลุ่มนี้ <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="">
                    <table className="w-full text-left border-collapse table-fixed">
                      <colgroup>
                        <col className="w-[15%]" />
                        <col className="w-[23%]" />
                        <col className="w-[20%]" />
                        <col className="w-[18%]" />
                        <col className="w-[18%]" />
                        <col className="w-[6%]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-amber-50/30 text-amber-700/60 text-[10px] font-bold uppercase tracking-wider border-b border-amber-100/50">
                          <th className="px-2 py-2 pl-4">วันที่</th>
                          <th className="px-2 py-2">ซัพพลายเออร์</th>
                          <th className="px-2 py-2">สินค้า</th>
                          <th className="px-2 py-2 text-right">ยอดเงิน</th>
                          <th className="px-2 py-2 text-center">สถานะ</th>
                          <th className="px-2 py-2 pr-4 text-right">ลบ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs bg-white">
                        {transactions.filter(t => t.type === 'ซื้อเข้า').length > 0 ? transactions.filter(t => t.type === 'ซื้อเข้า').map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-2 py-3 pl-4 text-slate-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</td>
                            <td className="px-2 py-3 font-bold text-slate-700 truncate">{t.entityName}</td>
                            <td className="px-2 py-3 text-slate-600 text-xs truncate">{t.productName}</td>
                            <td className="px-2 py-3 text-right font-black text-amber-600 whitespace-nowrap">-{formatMoney(t.amount)}</td>
                            <td className="px-2 py-3 text-center">
                              {t.status === 'PAID' ? <span className="text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.5 rounded text-[9px] font-bold">จ่ายแล้ว</span> : <span className="text-rose-600 bg-rose-50 border border-rose-100/50 px-1.5 py-0.5 rounded text-[9px] font-bold">ค้างชำระ</span>}
                            </td>
                            <td className="px-2 py-3 pr-4 text-right">
                              <button onClick={() => handleDelete(t.id)} disabled={isDeleting === t.id} className="text-slate-300 hover:text-rose-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="p-10 text-center text-slate-400 text-xs">
                              <div className="flex flex-col items-center justify-center">
                                <Cat className="w-8 h-8 mb-2 text-slate-300" />
                                <p className="font-bold">ยังไม่มีรายการในช่วงเวลานี้</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Expenses Table */}
              {(filterType === 'all' || filterType === 'expenses') && (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-rose-100 overflow-hidden">
                  <div 
                    onClick={() => handleTypeFilterClick('expenses')}
                    className={`px-4 py-2.5 border-b border-rose-100 flex items-center justify-between transition-colors ${filterType !== 'expenses' ? 'bg-rose-50/80 hover:bg-rose-100/80 cursor-pointer' : 'bg-rose-50/80'}`}
                  >
                    <span className="font-bold text-rose-800 text-sm flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      ค่าใช้จ่ายอื่นๆ
                      <span className="ml-1.5 text-rose-600 bg-rose-100/50 px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap">รวม -{formatMoney(totalExpenses)}</span>
                    </span>
                    {filterType !== 'expenses' && (
                      <span className="text-rose-600/70 text-xs font-semibold flex items-center whitespace-nowrap ml-2">
                        ดูเฉพาะกลุ่มนี้ <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="">
                    <table className="w-full text-left border-collapse table-fixed">
                      <colgroup>
                        <col className="w-[15%]" />
                        <col className="w-[25%]" />
                        <col className="w-[34%]" />
                        <col className="w-[20%]" />
                        <col className="w-[6%]" />
                      </colgroup>
                      <thead>
                        <tr className="bg-rose-50/30 text-rose-700/60 text-[10px] font-bold uppercase tracking-wider border-b border-rose-100/50">
                          <th className="px-2 py-2 pl-4">วันที่</th>
                          <th className="px-2 py-2">หมวดหมู่</th>
                          <th className="px-2 py-2">รายละเอียด</th>
                          <th className="px-2 py-2 text-right">ยอดเงิน</th>
                          <th className="px-2 py-2 pr-4 text-right">ลบ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs bg-white">
                        {transactions.filter(t => t.type === 'ค่าใช้จ่าย').length > 0 ? transactions.filter(t => t.type === 'ค่าใช้จ่าย').map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-2 py-3 pl-4 text-slate-500 whitespace-nowrap">{new Date(t.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</td>
                            <td className="px-2 py-3 font-bold text-slate-700 truncate">{t.entityName}</td>
                            <td className="px-2 py-3 text-slate-600 text-xs truncate">{t.productName}</td>
                            <td className="px-2 py-3 text-right font-black text-rose-600 whitespace-nowrap">-{formatMoney(t.amount)}</td>
                            <td className="px-2 py-3 pr-4 text-right">
                              <button onClick={() => handleDelete(t.id)} disabled={isDeleting === t.id} className="text-slate-300 hover:text-rose-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="p-10 text-center text-slate-400 text-xs">
                              <div className="flex flex-col items-center justify-center">
                                <Cat className="w-8 h-8 mb-2 text-slate-300" />
                                <p className="font-bold">ยังไม่มีรายการในช่วงเวลานี้</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
