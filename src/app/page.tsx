import { prisma } from '@/lib/prisma';
import { format, addDays, addMonths, addYears, startOfDay, startOfMonth, startOfYear, startOfWeek, addWeeks } from 'date-fns';
import { th } from 'date-fns/locale';
import DashboardClient from '@/components/DashboardClient';

async function getStats(dateFilter: { gte: Date; lte?: Date }) {
  const purchases = await prisma.purchase.aggregate({
    _sum: { totalAmount: true },
    where: { date: dateFilter }
  });

  const sales = await prisma.sale.aggregate({
    _sum: { totalAmount: true },
    where: { date: dateFilter }
  });

  const expenses = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { date: dateFilter }
  });

  const salesTotal = sales._sum.totalAmount || 0;
  const purchasesTotal = purchases._sum.totalAmount || 0;
  const expensesTotal = expenses._sum.amount || 0;
  const profit = salesTotal - purchasesTotal - expensesTotal;

  return {
    sales: salesTotal,
    purchases: purchasesTotal,
    expenses: expensesTotal,
    profit: profit
  };
}

export default async function Page(props: { searchParams: Promise<{ period?: string; offset?: string }> }) {
  const searchParams = await props.searchParams;
  const period = searchParams.period || 'daily';
  const offset = parseInt(searchParams.offset || '0');
  
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

  // Adjust getStats to use strict lte boundary to not bleed into next period
  const stats = await getStats(dateFilter);

  return <DashboardClient data={stats} dateStr={dateStr} period={period} offset={offset} />;
}
