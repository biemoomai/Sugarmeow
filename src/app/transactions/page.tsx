import { prisma } from '@/lib/prisma';
import { format, addDays, addMonths, addYears, startOfDay, startOfMonth, startOfYear, startOfWeek, addWeeks } from 'date-fns';
import { th } from 'date-fns/locale';
import TransactionsClient from '@/components/TransactionsClient';

export default async function TransactionsPage(props: { searchParams: Promise<{ period?: string; offset?: string; type?: string }> }) {
  const searchParams = await props.searchParams;
  const period = searchParams.period || 'daily';
  const offset = parseInt(searchParams.offset || '0');
  const typeFilter = searchParams.type || 'all';
  
  const now = new Date();
  let targetDate = now;
  let dateFilter;
  let dateStr = '';
  
  if (period === 'monthly') {
    targetDate = addMonths(now, offset);
    dateFilter = { gte: startOfMonth(targetDate), lte: addMonths(startOfMonth(targetDate), 1) };
    dateStr = format(targetDate, 'MMM yyyy', { locale: th });
  } else if (period === 'weekly') {
    targetDate = addWeeks(now, offset);
    const start = startOfWeek(targetDate, { weekStartsOn: 1 });
    dateFilter = { gte: start, lte: addWeeks(start, 1) };
    dateStr = `${format(start, 'd MMM', { locale: th })} - ${format(addDays(start, 6), 'd MMM yy', { locale: th })}`;
  } else if (period === 'yearly') {
    targetDate = addYears(now, offset);
    dateFilter = { gte: startOfYear(targetDate), lte: addYears(startOfYear(targetDate), 1) };
    dateStr = `ปี ${parseInt(format(targetDate, 'yyyy', { locale: th })) + 543}`;
  } else {
    targetDate = addDays(now, offset);
    dateFilter = { gte: startOfDay(targetDate), lte: addDays(startOfDay(targetDate), 1) };
    dateStr = format(targetDate, 'd MMM yyyy', { locale: th });
  }

  // Fetch transactions based on filter
  const rawSales = (typeFilter === 'all' || typeFilter === 'sales') ? await prisma.sale.findMany({
    where: { date: dateFilter },
    include: { customer: true, product: true },
    orderBy: { date: 'desc' },
    take: 100
  }) : [];
  
  const rawPurchases = (typeFilter === 'all' || typeFilter === 'purchases') ? await prisma.purchase.findMany({
    where: { date: dateFilter },
    include: { supplier: true, product: true },
    orderBy: { date: 'desc' },
    take: 100
  }) : [];

  const rawExpenses = (typeFilter === 'all' || typeFilter === 'expenses') ? await prisma.expense.findMany({
    where: { date: dateFilter },
    orderBy: { date: 'desc' },
    take: 100
  }) : [];

  const transactions = [
    ...rawSales.map(s => ({
      id: `S-${s.id}`,
      date: s.date.toISOString(),
      type: 'ขายสินค้า',
      detail: `${s.customer.name} (${s.product.name})`,
      amount: s.totalAmount,
      status: s.paymentStatus
    })),
    ...rawPurchases.map(p => ({
      id: `P-${p.id}`,
      date: p.date.toISOString(),
      type: 'ซื้อเข้า',
      detail: `${p.supplier.name} (${p.product.name})`,
      amount: p.totalAmount,
      status: 'PAID'
    })),
    ...rawExpenses.map(e => ({
      id: `E-${e.id}`,
      date: e.date.toISOString(),
      type: 'ค่าใช้จ่าย',
      detail: e.description || e.category,
      amount: e.amount,
      status: 'PAID'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 200);

  return <TransactionsClient transactions={transactions} dateStr={dateStr} period={period} offset={offset} filterType={typeFilter} />;
}
