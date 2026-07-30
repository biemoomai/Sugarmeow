import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lineClient } from '@/lib/line';

export async function GET(req: NextRequest) {
  try {
    // Basic security to ensure it's called by an authorized cron service
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all users who have registered/have drafts or transactions. 
    // We can get unique lineUserId from TransactionDraft as it stores their state.
    const users = await prisma.transactionDraft.findMany({
      select: { lineUserId: true }
    });

    const formatMoney = (amount: number) => {
      return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
    };

    for (const user of users) {
      const lineUserId = user.lineUserId;
      if (!lineUserId) continue;

      const [purchases, sales, expenses, pendingSales] = await Promise.all([
        prisma.purchase.aggregate({
          _sum: { totalAmount: true },
          where: { date: { gte: today }, lineUserId }
        }),
        prisma.sale.aggregate({
          _sum: { totalAmount: true },
          where: { date: { gte: today }, lineUserId }
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
          where: { date: { gte: today }, lineUserId }
        }),
        prisma.sale.findMany({
          where: { paymentStatus: 'PENDING', lineUserId },
          include: { customer: true }
        })
      ]);

      const totalPurchases = purchases._sum.totalAmount || 0;
      const totalSales = sales._sum.totalAmount || 0;
      const totalExpenses = expenses._sum.amount || 0;
      const estProfit = totalSales - totalPurchases - totalExpenses;

      // Only send if there's any activity today
      if (totalPurchases === 0 && totalSales === 0 && totalExpenses === 0) {
        continue;
      }

      let report = `📊 สรุปยอดประจำวัน\n\n`;
      report += `🟢 ยอดขาย: ${formatMoney(totalSales)}\n`;
      report += `🔴 ยอดซื้อ: ${formatMoney(totalPurchases)}\n`;
      report += `🔴 ค่าใช้จ่าย: ${formatMoney(totalExpenses)}\n`;
      report += `✨ กำไรโดยประมาณ: ${formatMoney(estProfit)}\n\n`;

      if (pendingSales.length > 0) {
        report += `⚠️ รายการค้างชำระ:\n`;
        pendingSales.forEach(sale => {
          report += `- ${sale.customer.name}: ${formatMoney(sale.totalAmount)}\n`;
        });
      } else {
        report += `✅ ไม่มีรายการค้างชำระ`;
      }

      try {
        await lineClient.pushMessage({ to: lineUserId, messages: [{ type: 'text', text: report }] });
      } catch (e) {
        console.error(`Failed to send message to ${lineUserId}:`, e);
      }
    }

    return NextResponse.json({ success: true, message: 'Daily reports sent' }, { status: 200 });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
