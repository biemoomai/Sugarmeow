import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as line from '@line/bot-sdk';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const client = new line.Client(config);

export async function GET(req: NextRequest) {
  try {
    // Basic security to ensure it's called by an authorized cron service
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const purchases = await prisma.purchase.aggregate({
      _sum: { totalAmount: true },
      where: { date: { gte: today } }
    });

    const sales = await prisma.sale.aggregate({
      _sum: { totalAmount: true },
      where: { date: { gte: today } }
    });

    const expenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: today } }
    });

    // Check pending payments
    const pendingSales = await prisma.sale.findMany({
      where: { paymentStatus: 'PENDING' },
      include: { customer: true }
    });

    const totalPurchases = purchases._sum.totalAmount || 0;
    const totalSales = sales._sum.totalAmount || 0;
    const totalExpenses = expenses._sum.amount || 0;
    const estProfit = totalSales - totalPurchases - totalExpenses;

    const formatMoney = (amount: number) => {
      return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
    };

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

    // Broadcast to the owner (assuming owner user ID is configured)
    const ownerLineId = process.env.OWNER_LINE_USER_ID;
    if (ownerLineId) {
      await client.pushMessage(ownerLineId, { type: 'text', text: report });
    } else {
      console.log("OWNER_LINE_USER_ID is not set. Would have sent:", report);
    }

    return NextResponse.json({ success: true, message: 'Daily report sent' }, { status: 200 });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
