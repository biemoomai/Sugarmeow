import { NextResponse } from 'next/server';
import { lineClient } from '@/lib/line';
import { extractTransaction } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);

    if (!body.events || body.events.length === 0) {
      return NextResponse.json({ ok: true });
    }

    for (const event of body.events) {
      const userId = event.source.userId;
      if (!userId) continue;

      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();

        // Show loading animation for 5 seconds
        try {
          await lineClient.showLoadingAnimation({ chatId: userId, loadingSeconds: 5 });
        } catch (e) {
          console.error("Failed to show loading animation:", e);
        }

        // Check if user requests help/guide
        if (/^(วิธีใช้|วิธีใช้่|คู่มือ|คู่มทือ|วิธีใช้งาน|help|ช่วยด้วย|ช่วยด้วยครับ|ช่วยด้วยค่ะ|ตัวอย่าง|ตัวอย่างการพิมพ์|สอนหน่อย|เออลองพิมพ์|พิมพ์ไง|ใช้อย่างไร)$/i.test(text)) {
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'flex',
                altText: 'คู่มือการพิมพ์ชูก้าร์แมวมึน',
                contents: {
                  type: 'carousel',
                  contents: [
                    // --- Page 1: Recording & Editing ---
                    {
                      type: 'bubble',
                      header: {
                        type: 'box', layout: 'vertical', backgroundColor: '#0F172A',
                        contents: [
                          { type: 'text', text: '📝 1. จดบิล & แก้บิล', weight: 'bold', color: '#F8FAFC', size: 'md' },
                          { type: 'text', text: 'พิมพ์ภาษาคนได้เลย ระบุวันได้', size: 'xs', color: '#94A3B8', margin: 'xs' }
                        ]
                      },
                      body: {
                        type: 'box', layout: 'vertical', spacing: 'sm',
                        contents: [
                          {
                            type: 'box', layout: 'vertical', spacing: 'xs',
                            contents: [
                              { type: 'text', text: '📦 ซื้อเข้า / 💵 ขายออก / 💸 รายจ่าย', weight: 'bold', size: 'sm', color: '#10B981' },
                              { type: 'text', text: '• ซื้อกล้วย 30 โล โลละ 10 บาท\n• ขายทุเรียนพี่พร 5 โล โลละ 120 จ่ายแล้ว พรุ่งนี้\n• ค่าน้ำมัน 500', size: 'xs', color: '#475569', wrap: true }
                            ]
                          },
                          { type: 'separator' },
                          {
                            type: 'box', layout: 'vertical', spacing: 'xs',
                            contents: [
                              { type: 'text', text: '✏️ สั่งแก้ไขบิลของวันนี้', weight: 'bold', size: 'sm', color: '#F59E0B' },
                              { type: 'text', text: '• แก้ยอดขายพี่พรเป็น 500\n• แก้บิลคุณสมหญิง เปลี่ยนเป็นจ่ายแล้ว', size: 'xs', color: '#475569', wrap: true }
                            ]
                          }
                        ]
                      },
                      footer: {
                        type: 'box', layout: 'vertical',
                        contents: [
                          { type: 'button', style: 'secondary', height: 'sm', action: { type: 'message', label: 'ลองพิมพ์: ขายแตงโม 10 โล 200', text: 'ขายแตงโม 10 โล 200 ให้พี่พร' } }
                        ]
                      }
                    },
                    // --- Page 2: Reports & Dashboard ---
                    {
                      type: 'bubble',
                      header: {
                        type: 'box', layout: 'vertical', backgroundColor: '#064E3B',
                        contents: [
                          { type: 'text', text: '📊 2. ดูสรุปยอด & ลูกหนี้', weight: 'bold', color: '#F8FAFC', size: 'md' },
                          { type: 'text', text: 'เช็คยอดง่ายๆ ในแชท หรือดูเว็บ', size: 'xs', color: '#6EE7B7', margin: 'xs' }
                        ]
                      },
                      body: {
                        type: 'box', layout: 'vertical', spacing: 'sm',
                        contents: [
                          {
                            type: 'box', layout: 'vertical', spacing: 'xs',
                            contents: [
                              { type: 'text', text: '🔍 คำสั่งเช็คยอดในไลน์', weight: 'bold', size: 'sm', color: '#10B981' },
                              { type: 'text', text: '• สรุปยอด (ดูยอดทั้งหมดของวันนี้)\n• ยอดขายสัปดาห์นี้\n• เจ๊ศรีซื้อกล้วยไปเท่าไหร่', size: 'xs', color: '#475569', wrap: true }
                            ]
                          },
                          { type: 'separator' },
                          {
                            type: 'box', layout: 'vertical', spacing: 'xs',
                            contents: [
                              { type: 'text', text: '💸 ทวงหนี้ / เช็คคนค้างชำระ', weight: 'bold', size: 'sm', color: '#EF4444' },
                              { type: 'text', text: '• ใครค้างเงินบ้าง\n• สรุปยอดลูกหนี้', size: 'xs', color: '#475569', wrap: true }
                            ]
                          }
                        ]
                      },
                      footer: {
                        type: 'box', layout: 'vertical', spacing: 'sm',
                        contents: [
                          { type: 'button', style: 'primary', color: '#10B981', height: 'sm', action: { type: 'uri', label: 'เปิดดู Dashboard', uri: 'https://sugarmeow.vercel.app/' } },
                          { type: 'button', style: 'secondary', height: 'sm', action: { type: 'message', label: 'ลองพิมพ์: ใครค้างเงินบ้าง', text: 'ใครค้างเงินบ้าง' } }
                        ]
                      }
                    },
                    // --- Page 3: Smart Bot Behaviors ---
                    {
                      type: 'bubble',
                      header: {
                        type: 'box', layout: 'vertical', backgroundColor: '#1E1B4B',
                        contents: [
                          { type: 'text', text: '🧠 3. ความฉลาดของบอท', weight: 'bold', color: '#F8FAFC', size: 'md' },
                          { type: 'text', text: 'คุยเล่นได้ สั่งลบได้ ถามเก่ง', size: 'xs', color: '#A5B4FC', margin: 'xs' }
                        ]
                      },
                      body: {
                        type: 'box', layout: 'vertical', spacing: 'sm',
                        contents: [
                          {
                            type: 'box', layout: 'vertical', spacing: 'xs',
                            contents: [
                              { type: 'text', text: '💬 พิมพ์มาไม่ครบ / คุยเล่น', weight: 'bold', size: 'sm', color: '#6366F1' },
                              { type: 'text', text: 'ถ้าบอกข้อมูลขาด บอทจะถามกลับเอง หรือถ้าแค่ทักมา "สวัสดี" บอทก็ตอบได้ (แต่มันกวนตีนนะบอกก่อน)', size: 'xs', color: '#475569', wrap: true }
                            ]
                          },
                          { type: 'separator' },
                          {
                            type: 'box', layout: 'vertical', spacing: 'xs',
                            contents: [
                              { type: 'text', text: '↩️ พิมพ์ผิด ทำไงดี?', weight: 'bold', size: 'sm', color: '#EF4444' },
                              { type: 'text', text: 'แค่พิมพ์ว่า "ยกเลิก" หรือ "ลบบิลล่าสุด" บอทจะลบรายการที่เพิ่งบันทึกไปเมื่อกี้ให้ทันที', size: 'xs', color: '#475569', wrap: true }
                            ]
                          }
                        ]
                      },
                      footer: {
                        type: 'box', layout: 'vertical',
                        contents: [
                          { type: 'button', style: 'secondary', height: 'sm', action: { type: 'message', label: 'ลองพิมพ์: ยกเลิก', text: 'ยกเลิก' } }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          });
          continue;
        }

        // Check if user requests report/dashboard/stats
        if (/^(รายงาน|แดชบอร์ด|dashboard|report|เมนู|สรุปยอด|สรุป|เช็คยอด|ยอดวันนี้|สถานะ|stats|summary)$/i.test(text)) {
          const dashboardUrl = `https://sugarmeow.vercel.app/`;

          // Calculate today's date range (ICT UTC+7)
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          const [sales, purchases, expenses] = await Promise.all([
            prisma.sale.findMany({
              where: { lineUserId: userId, createdAt: { gte: todayStart } }
            }),
            prisma.purchase.findMany({
              where: { lineUserId: userId, createdAt: { gte: todayStart } }
            }),
            prisma.expense.findMany({
              where: { lineUserId: userId, createdAt: { gte: todayStart } }
            })
          ]);

          const totalSales = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
          const totalPurchases = purchases.reduce((acc, curr) => acc + curr.totalAmount, 0);
          const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
          const profit = totalSales - totalPurchases - totalExpenses;

          const fmt = (num: number) => new Intl.NumberFormat('th-TH').format(num);

          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'flex',
                altText: '📊 สรุปยอดวันนี้ - ชูก้าร์แมวมึน',
                contents: {
                  type: 'bubble',
                  header: {
                    type: 'box',
                    layout: 'vertical',
                    backgroundColor: '#0F172A',
                    contents: [
                      {
                        type: 'text',
                        text: '📊 สรุปยอดประจำวันนี้',
                        weight: 'bold',
                        color: '#F8FAFC',
                        size: 'md'
                      },
                      {
                        type: 'text',
                        text: `${now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`,
                        size: 'xs',
                        color: '#94A3B8',
                        margin: 'xs'
                      }
                    ]
                  },
                  body: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                          { type: 'text', text: '💵 ยอดขาย:', size: 'sm', color: '#64748B', flex: 1 },
                          { type: 'text', text: `฿${fmt(totalSales)}`, size: 'sm', weight: 'bold', color: '#0EA5E9', align: 'end' }
                        ]
                      },
                      {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                          { type: 'text', text: '📦 ซื้อเข้า:', size: 'sm', color: '#64748B', flex: 1 },
                          { type: 'text', text: `฿${fmt(totalPurchases)}`, size: 'sm', weight: 'bold', color: '#F59E0B', align: 'end' }
                        ]
                      },
                      {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                          { type: 'text', text: '💸 ค่าใช้จ่าย:', size: 'sm', color: '#64748B', flex: 1 },
                          { type: 'text', text: `฿${fmt(totalExpenses)}`, size: 'sm', weight: 'bold', color: '#FB7185', align: 'end' }
                        ]
                      },
                      { type: 'separator', margin: 'md' },
                      {
                        type: 'box',
                        layout: 'horizontal',
                        margin: 'md',
                        contents: [
                          { type: 'text', text: '💰 กำไรสุทธิ:', size: 'md', weight: 'bold', color: '#334155', flex: 1 },
                          { type: 'text', text: `฿${fmt(profit)}`, size: 'md', weight: 'bold', color: profit >= 0 ? '#10B981' : '#EF4444', align: 'end' }
                        ]
                      }
                    ]
                  },
                  footer: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'button',
                        style: 'primary',
                        color: '#475569',
                        height: 'sm',
                        action: {
                          type: 'uri',
                          label: '📲 เปิดดูแดชบอร์ดเต็มรูปแบบ',
                          uri: dashboardUrl
                        }
                      }
                    ]
                  }
                }
              }
            ]
          });
          continue;
        }

        try {
          // Check for existing draft to provide context
          const existingDraft = await prisma.transactionDraft.findUnique({
            where: { lineUserId: userId }
          });
          const previousContext = existingDraft ? existingDraft.payload : undefined;

          const data = await extractTransaction(text, previousContext);
          
          // Validate strict requirements to prevent database errors and enforce complete forms
          if (data.intent === 'SALE' || data.intent === 'PURCHASE') {
            if (!data.product || !data.quantity || data.quantity <= 0 || !data.totalAmount || data.totalAmount <= 0) {
              data.intent = 'INCOMPLETE';
              data.replyMessage = 'ข้อมูลไม่ครบโว้ย! จะซื้อขายอะไร จำนวนกี่กิโล ยอดรวมเท่าไหร่ บอกมาให้ชัดๆ ดิ๊ พิมพ์ตกๆ หล่นๆ อยู่ได้!';
            }
          } else if (data.intent === 'EXPENSE') {
            if (!data.totalAmount || data.totalAmount <= 0) {
              data.intent = 'INCOMPLETE';
              data.replyMessage = 'จ่ายค่าอะไร ยอดเท่าไหร่ บอกมาให้ครบสิวะ! กูไม่ได้มีตาทิพย์นะ!';
            }
          } else if (data.intent === 'EDIT') {
            if (!data.editTargetName || !data.totalAmount || data.totalAmount <= 0) {
              data.intent = 'INCOMPLETE';
              data.replyMessage = 'จะแก้บิลของใคร ยอดใหม่เป็นเท่าไหร่ พิมพ์มาให้ครบๆ ดิ๊ จะแก้ให้ถูกได้ไงวะ!';
            }
          }

          // Save to draft
          await prisma.transactionDraft.upsert({
            where: { lineUserId: userId },
            update: { payload: JSON.stringify(data) },
            create: { lineUserId: userId, payload: JSON.stringify(data) }
          });

          if (data.intent === 'INCOMPLETE' || data.intent === 'CHAT') {
            await lineClient.replyMessage({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: data.replyMessage || 'พิมพ์อะไรมาวะ กูงง รีบๆ พิมพ์มาให้ครบๆ ดิ๊!' }]
            });
            continue;
          }

          if (data.intent === 'UNKNOWN') {
            await lineClient.replyMessage({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: 'พิมพ์อะไรมาเนี่ย งงไปหมดละ พิมพ์มาให้ชัดๆ หน่อยสิ' }]
            });
            continue;
          }

          if (data.intent === 'UNDO') {
            // Find the most recent transaction across Sale, Purchase, Expense
            const [lastSale, lastPurchase, lastExpense] = await Promise.all([
              prisma.sale.findFirst({ where: { lineUserId: userId }, orderBy: { createdAt: 'desc' } }),
              prisma.purchase.findFirst({ where: { lineUserId: userId }, orderBy: { createdAt: 'desc' } }),
              prisma.expense.findFirst({ where: { lineUserId: userId }, orderBy: { createdAt: 'desc' } })
            ]);

            // Find the absolute latest
            const latest = [
              { type: 'SALE', record: lastSale },
              { type: 'PURCHASE', record: lastPurchase },
              { type: 'EXPENSE', record: lastExpense }
            ].filter(item => item.record !== null).sort((a, b) => b.record!.createdAt.getTime() - a.record!.createdAt.getTime())[0];

            if (!latest) {
              await lineClient.replyMessage({
                replyToken: event.replyToken,
                messages: [{ type: 'text', text: 'จะให้ลบอะไรวะ ยังไม่เคยบันทึกอะไรเลยสักอย่าง!' }]
              });
            } else {
              if (latest.type === 'SALE') await prisma.sale.delete({ where: { id: latest.record!.id } });
              else if (latest.type === 'PURCHASE') await prisma.purchase.delete({ where: { id: latest.record!.id } });
              else if (latest.type === 'EXPENSE') await prisma.expense.delete({ where: { id: latest.record!.id } });

              await lineClient.replyMessage({
                replyToken: event.replyToken,
                messages: [{ type: 'text', text: 'เออ ลบรายการล่าสุดทิ้งให้ละ มือลั่นล่ะสิทีหลังก็ดูดีๆ' }]
              });
            }
            continue;
          }
          
          if (data.intent === 'REPORT') {
            const now = new Date();
            let dateFilter = {};
            let periodLabel = 'ทั้งหมด';

            if (data.reportPeriod === 'TODAY') {
              dateFilter = { gte: startOfDay(now), lte: endOfDay(now) };
              periodLabel = 'วันนี้';
            } else if (data.reportPeriod === 'WEEK') {
              dateFilter = { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) };
              periodLabel = 'สัปดาห์นี้';
            } else if (data.reportPeriod === 'MONTH') {
              dateFilter = { gte: startOfMonth(now), lte: endOfMonth(now) };
              periodLabel = 'เดือนนี้';
            } else if (data.reportPeriod === 'YEAR') {
              dateFilter = { gte: startOfYear(now), lte: endOfYear(now) };
              periodLabel = 'ปีนี้';
            }

            const whereSale: any = { lineUserId: userId };
            const wherePurchase: any = { lineUserId: userId };
            const whereExpense: any = { lineUserId: userId };

            if (Object.keys(dateFilter).length > 0) {
              whereSale.date = dateFilter;
              wherePurchase.date = dateFilter;
              whereExpense.date = dateFilter;
            }

            if (data.reportEntity) {
              whereSale.customer = { name: { contains: data.reportEntity } };
              wherePurchase.supplier = { name: { contains: data.reportEntity } };
            }

            if (data.reportProduct) {
              whereSale.product = { name: { contains: data.reportProduct } };
              wherePurchase.product = { name: { contains: data.reportProduct } };
            }

            let totalSales = 0;
            let totalPurchases = 0;
            let totalExpenses = 0;

            const type = data.reportType || 'ALL';

            if (type === 'PENDING') {
              const pendingSales = await prisma.sale.findMany({ 
                where: { ...whereSale, paymentStatus: 'PENDING' },
                include: { customer: true }
              });
              const pendingPurchases = await prisma.purchase.findMany({ 
                where: { ...wherePurchase, paymentStatus: 'PENDING' },
                include: { supplier: true }
              });

              let totalPendingSales = 0;
              let totalPendingPurchases = 0;
              const pendingSalesByCustomer: Record<string, number> = {};
              const pendingPurchasesBySupplier: Record<string, number> = {};

              for (const s of pendingSales) {
                totalPendingSales += s.totalAmount;
                pendingSalesByCustomer[s.customer.name] = (pendingSalesByCustomer[s.customer.name] || 0) + s.totalAmount;
              }
              for (const p of pendingPurchases) {
                totalPendingPurchases += p.totalAmount;
                pendingPurchasesBySupplier[p.supplier.name] = (pendingPurchasesBySupplier[p.supplier.name] || 0) + p.totalAmount;
              }

              const contents: any[] = [];
              if (totalPendingSales > 0) {
                contents.push({ type: 'text', text: `⚠️ ลูกหนี้ค้างจ่ายเรา (รวม ฿${new Intl.NumberFormat('th-TH').format(totalPendingSales)})`, weight: 'bold', color: '#EF4444', size: 'sm' });
                for (const [name, amount] of Object.entries(pendingSalesByCustomer)) {
                  contents.push({
                    type: 'box', layout: 'horizontal',
                    contents: [
                      { type: 'text', text: `- ${name}`, size: 'sm', color: '#64748B', flex: 1 },
                      { type: 'text', text: `฿${new Intl.NumberFormat('th-TH').format(amount)}`, size: 'sm', weight: 'bold', color: '#EF4444', align: 'end' }
                    ]
                  });
                }
              }
              if (totalPendingPurchases > 0) {
                if (contents.length > 0) contents.push({ type: 'separator', margin: 'md' });
                contents.push({ type: 'text', text: `💸 เราค้างจ่ายเขา (รวม ฿${new Intl.NumberFormat('th-TH').format(totalPendingPurchases)})`, weight: 'bold', color: '#F59E0B', size: 'sm', margin: contents.length > 0 ? 'md' : 'none' });
                for (const [name, amount] of Object.entries(pendingPurchasesBySupplier)) {
                  contents.push({
                    type: 'box', layout: 'horizontal',
                    contents: [
                      { type: 'text', text: `- ${name}`, size: 'sm', color: '#64748B', flex: 1 },
                      { type: 'text', text: `฿${new Intl.NumberFormat('th-TH').format(amount)}`, size: 'sm', weight: 'bold', color: '#F59E0B', align: 'end' }
                    ]
                  });
                }
              }

              if (contents.length === 0) {
                contents.push({ type: 'text', text: '🎉 ยินดีด้วย! ไม่มีใครค้างเงินเลย เยี่ยมยอด', size: 'sm', color: '#10B981' });
              }

              await lineClient.replyMessage({
                replyToken: event.replyToken,
                messages: [
                  {
                    type: 'flex', altText: 'สรุปยอดค้างชำระ',
                    contents: {
                      type: 'bubble',
                      header: {
                        type: 'box', layout: 'vertical', backgroundColor: '#0F172A',
                        contents: [
                          { type: 'text', text: '🚨 สรุปยอดค้างชำระ', weight: 'bold', color: '#F8FAFC', size: 'md' }
                        ]
                      },
                      body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: contents },
                      footer: {
                        type: 'box', layout: 'vertical',
                        contents: [{ type: 'button', style: 'primary', color: '#475569', height: 'sm', action: { type: 'uri', label: '📲 ดูรายละเอียดที่เว็บ', uri: `https://sugarmeow.vercel.app/` } }]
                      }
                    }
                  }
                ]
              });
              continue;
            }

            if (type === 'ALL' || type === 'SALES') {
              const sales = await prisma.sale.findMany({ where: whereSale });
              totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
            }
            if (type === 'ALL' || type === 'PURCHASES') {
              const purchases = await prisma.purchase.findMany({ where: wherePurchase });
              totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
            }
            if (type === 'ALL' || type === 'EXPENSES') {
              const expenses = await prisma.expense.findMany({ where: whereExpense });
              totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
            }

            const profit = totalSales - totalPurchases - totalExpenses;
            const fmt = (num: number) => new Intl.NumberFormat('th-TH').format(num);

            let headerTitle = '📊 สรุปยอด';
            if (type === 'SALES') headerTitle = '📊 สรุปยอดขาย';
            else if (type === 'PURCHASES') headerTitle = '📊 สรุปยอดซื้อเข้า';
            else if (type === 'EXPENSES') headerTitle = '📊 สรุปค่าใช้จ่าย';

            if (data.reportProduct) headerTitle += ` (${data.reportProduct})`;
            if (data.reportEntity) headerTitle += ` [${data.reportEntity}]`;

            const contents: any[] = [];
            
            if (type === 'ALL' || type === 'SALES') {
              contents.push({
                type: 'box', layout: 'horizontal',
                contents: [
                  { type: 'text', text: '💵 ยอดขาย:', size: 'sm', color: '#64748B', flex: 1 },
                  { type: 'text', text: `฿${fmt(totalSales)}`, size: 'sm', weight: 'bold', color: '#0EA5E9', align: 'end' }
                ]
              });
            }
            if (type === 'ALL' || type === 'PURCHASES') {
              contents.push({
                type: 'box', layout: 'horizontal',
                contents: [
                  { type: 'text', text: '📦 ซื้อเข้า:', size: 'sm', color: '#64748B', flex: 1 },
                  { type: 'text', text: `฿${fmt(totalPurchases)}`, size: 'sm', weight: 'bold', color: '#F59E0B', align: 'end' }
                ]
              });
            }
            if (type === 'ALL' || type === 'EXPENSES') {
              contents.push({
                type: 'box', layout: 'horizontal',
                contents: [
                  { type: 'text', text: '💸 ค่าใช้จ่าย:', size: 'sm', color: '#64748B', flex: 1 },
                  { type: 'text', text: `฿${fmt(totalExpenses)}`, size: 'sm', weight: 'bold', color: '#FB7185', align: 'end' }
                ]
              });
            }
            if (type === 'ALL') {
              contents.push(
                { type: 'separator', margin: 'md' },
                {
                  type: 'box', layout: 'horizontal', margin: 'md',
                  contents: [
                    { type: 'text', text: '💰 กำไรสุทธิ:', size: 'md', weight: 'bold', color: '#334155', flex: 1 },
                    { type: 'text', text: `฿${fmt(profit)}`, size: 'md', weight: 'bold', color: profit >= 0 ? '#10B981' : '#EF4444', align: 'end' }
                  ]
                }
              );
            }

            await lineClient.replyMessage({
              replyToken: event.replyToken,
              messages: [
                {
                  type: 'flex',
                  altText: 'สรุปยอดของคุณ',
                  contents: {
                    type: 'bubble',
                    header: {
                      type: 'box', layout: 'vertical', backgroundColor: '#0F172A',
                      contents: [
                        { type: 'text', text: headerTitle, weight: 'bold', color: '#F8FAFC', size: 'md' },
                        { type: 'text', text: `ช่วงเวลา: ${periodLabel}`, size: 'xs', color: '#94A3B8', margin: 'xs' }
                      ]
                    },
                    body: {
                      type: 'box', layout: 'vertical', spacing: 'sm',
                      contents: contents
                    },
                    footer: {
                      type: 'box', layout: 'vertical',
                      contents: [
                        {
                          type: 'button', style: 'primary', color: '#475569', height: 'sm',
                          action: { type: 'uri', label: '📲 ดูข้อมูลเต็มๆ ในแดชบอร์ด', uri: `https://sugarmeow.vercel.app/` }
                        }
                      ]
                    }
                  }
                }
              ]
            });
            continue;
          }
          if (data.intent === 'EDIT') {
            let target = null;
            let targetType = '';
            let targetName = data.editTargetName || 'ไม่ระบุชื่อ';

            if (data.editTargetId) {
              const targetStr = String(data.editTargetId).toUpperCase().trim();
              const match = targetStr.match(/^([SPE])-?(\d+)$/);
              
              if (match) {
                const prefix = match[1];
                const id = parseInt(match[2]);
                if (prefix === 'S') {
                  target = await prisma.sale.findUnique({ where: { id }, include: { customer: true } });
                  targetType = 'SALE';
                  if (target) targetName = target.customer.name;
                } else if (prefix === 'P') {
                  target = await prisma.purchase.findUnique({ where: { id }, include: { supplier: true } });
                  targetType = 'PURCHASE';
                  if (target) targetName = target.supplier.name;
                } else if (prefix === 'E') {
                  target = await prisma.expense.findUnique({ where: { id } });
                  targetType = 'EXPENSE';
                  if (target) targetName = target.category;
                }
              } else {
                 const id = parseInt(targetStr.replace(/\D/g, ''));
                 if (!isNaN(id)) {
                   const [s, p, e] = await Promise.all([
                     prisma.sale.findUnique({ where: { id }, include: { customer: true } }),
                     prisma.purchase.findUnique({ where: { id }, include: { supplier: true } }),
                     prisma.expense.findUnique({ where: { id } })
                   ]);
                   if (s) { target = s; targetType = 'SALE'; targetName = s.customer.name; }
                   else if (p) { target = p; targetType = 'PURCHASE'; targetName = p.supplier.name; }
                   else if (e) { target = e; targetType = 'EXPENSE'; targetName = e.category; }
                 }
              }
            }

            if (!target && data.editTargetName) {
              const todayStart = startOfDay(new Date());
              const [sales, purchases] = await Promise.all([
                prisma.sale.findMany({
                  where: { lineUserId: userId, customer: { name: { contains: data.editTargetName } }, createdAt: { gte: todayStart } },
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }),
                prisma.purchase.findMany({
                  where: { lineUserId: userId, supplier: { name: { contains: data.editTargetName } }, createdAt: { gte: todayStart } },
                  orderBy: { createdAt: 'desc' },
                  take: 1
                })
              ]);
              
              const targetSale = sales[0];
              const targetPurchase = purchases[0];
              
              if (targetSale && targetPurchase) {
                if (targetSale.createdAt > targetPurchase.createdAt) {
                  target = targetSale;
                  targetType = 'SALE';
                  targetName = targetSale.customer?.name || data.editTargetName;
                } else {
                  target = targetPurchase;
                  targetType = 'PURCHASE';
                  targetName = targetPurchase.supplier?.name || data.editTargetName;
                }
              } else if (targetSale) {
                target = targetSale;
                targetType = 'SALE';
                targetName = targetSale.customer?.name || data.editTargetName;
              } else if (targetPurchase) {
                target = targetPurchase;
                targetType = 'PURCHASE';
                targetName = targetPurchase.supplier?.name || data.editTargetName;
              }
            }

            if (!target) {
              await lineClient.replyMessage({
                replyToken: event.replyToken,
                messages: [{ type: 'text', text: `หาบิลที่จะแก้ไม่เจอเลยครับ 🥲 อาจจะเพราะชื่อหรือ ID ไม่ตรงกัน แนะนำให้เข้าไปกดแก้ในเว็บจะชัวร์สุดครับ` }]
              });
              continue;
            }

            // Augment draft with target info
            data.editTargetId = target.id;
            data.editTargetType = targetType;
            
            await prisma.transactionDraft.update({
              where: { lineUserId: userId },
              data: { payload: JSON.stringify(data) }
            });

            // Prepare summary text for confirmation
            const targetIdLabel = targetType.charAt(0) + '-' + target.id;
            let summaryText = `บิล ID: ${targetIdLabel}\nรายการ: ${targetType === 'SALE' ? 'ขายให้' : targetType === 'PURCHASE' ? 'ซื้อจาก' : 'รายจ่ายของ'} ${targetName}\n`;
            if (data.totalAmount) summaryText += `👉 แก้ไขยอดเป็น: ฿${data.totalAmount}\n`;
            if (data.status) summaryText += `👉 แก้สถานะเป็น: ${data.status === 'PAID' ? 'จ่ายแล้ว' : 'ค้างชำระ'}\n`;
            if (data.quantity) summaryText += `👉 แก้จำนวนเป็น: ${data.quantity}\n`;
            if (data.unitPrice) summaryText += `👉 แก้ราคา/หน่วยเป็น: ฿${data.unitPrice}\n`;
            if (data.product || data.editTargetProduct) summaryText += `👉 แก้ชื่อสินค้าเป็น: ${data.product || data.editTargetProduct}\n`;

            await lineClient.replyMessage({
              replyToken: event.replyToken,
              messages: [
                {
                  type: 'flex',
                  altText: 'ยืนยันการแก้ไขบิล',
                  contents: {
                    type: 'bubble',
                    body: {
                      type: 'box', layout: 'vertical',
                      contents: [
                        { type: 'text', text: '✏️ ต้องการแก้ไขบิลนี้ใช่ไหม?', weight: 'bold', color: '#A855F7', size: 'sm' },
                        { type: 'text', text: summaryText, wrap: true, margin: 'md', size: 'sm' }
                      ]
                    },
                    footer: {
                      type: 'box', layout: 'horizontal', spacing: 'sm',
                      contents: [
                        { type: 'button', style: 'primary', color: '#A855F7', height: 'sm', action: { type: 'postback', label: 'ยืนยันแก้บิล', data: 'action=confirm' } },
                        { type: 'button', style: 'secondary', height: 'sm', action: { type: 'postback', label: 'ยกเลิก', data: 'action=cancel' } }
                      ]
                    }
                  }
                }
              ]
            });
            continue;
          }

          let summaryText = '';
          if (data.intent === 'SALE') {
             summaryText = `ขายให้: ${data.name}\nของ: ${data.product}\nจำนวน: ${data.quantity} ${data.unit || 'ชิ้น'}\nราคา: ${data.unitPrice} ฿/${data.unit || 'ชิ้น'}\nยอดรวม: ${data.totalAmount} ฿\nสถานะ: ${data.status === 'PAID' ? 'จ่ายแล้ว' : 'ค้างชำระ (ไปทวงด้วยนะ)'}`;
          } else if (data.intent === 'PURCHASE') {
             summaryText = `ซื้อจาก: ${data.name}\nของ: ${data.product}\nจำนวน: ${data.quantity} ${data.unit || 'ชิ้น'}\nราคา: ${data.unitPrice} ฿/${data.unit || 'ชิ้น'}\nยอดรวม: ${data.totalAmount} ฿\nสถานะ: ${data.status === 'PAID' ? 'จ่ายแล้ว' : 'ติดหนี้เขาอยู่'}`;
          } else {
             summaryText = `หมวด: ${data.expenseCategory || 'ทั่วไป'}\nรายละเอียด: ${data.expenseDescription || '-'}\nยอด: ${data.totalAmount} ฿`;
          }

          const intentLabel = data.intent === 'SALE' ? '💵 รับเงิน' : data.intent === 'PURCHASE' ? '💸 จ่ายเงินซื้อของ' : '🔥 เสียเงินอีกแล้ว';

          // Send Flex Message
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'flex',
                altText: 'ตรวจสอบรายการด้วย',
                contents: {
                  type: 'bubble',
                  body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: intentLabel,
                        weight: 'bold',
                        color: data.intent === 'SALE' ? '#1DB446' : '#EF4444',
                        size: 'sm'
                      },
                      {
                        type: 'text',
                        text: summaryText,
                        wrap: true,
                        margin: 'md',
                        size: 'sm'
                      }
                    ]
                  },
                  footer: {
                    type: 'box',
                    layout: 'horizontal',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'button',
                        style: 'primary',
                        color: '#475569',
                        height: 'sm',
                        action: {
                          type: 'postback',
                          label: 'เออ บันทึกเลย',
                          data: 'action=confirm'
                        }
                      },
                      {
                        type: 'button',
                        style: 'secondary',
                        height: 'sm',
                        action: {
                          type: 'postback',
                          label: 'ไม่เอา พิมพ์ผิด',
                          data: 'action=cancel'
                        }
                      }
                    ]
                  }
                }
              }
            ]
          });
        } catch (e: any) {
          console.error("Webhook Error:", e);
          const dashboardUrl = `https://sugarmeow.vercel.app/`;
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [
              { type: 'text', text: `ขออภัยครับ ตอนนี้สมองผมเบลอ (ระบบขัดข้อง) รบกวนพิมพ์ใหม่อีกทีนะครับ` },
              {
                type: 'flex',
                altText: 'ทางลัดเข้าเว็บ',
                contents: {
                  type: 'bubble',
                  body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: 'หรือถ้าขี้เกียจพิมพ์ จะดูรายงานก็กดปุ่มเอา',
                        size: 'sm',
                        color: '#64748B',
                        wrap: true
                      }
                    ]
                  },
                  footer: {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                      {
                        type: 'button',
                        style: 'primary',
                        color: '#475569',
                        height: 'sm',
                        action: {
                          type: 'uri',
                          label: 'ไปดูแดชบอร์ด',
                          uri: dashboardUrl
                        }
                      }
                    ]
                  }
                }
              }
            ]
          });
        }
      } else if (event.type === 'postback') {
        try {
          await lineClient.showLoadingAnimation({ chatId: userId, loadingSeconds: 5 });
        } catch (e) {
          console.error("Failed to show loading animation:", e);
        }
        
        const data = event.postback.data;
        if (data === 'action=cancel') {
           try {
             await prisma.transactionDraft.deleteMany({ where: { lineUserId: userId } });
             await lineClient.replyMessage({
               replyToken: event.replyToken,
               messages: [{ type: 'text', text: 'เออ ยกเลิกให้ละ พิมพ์ใหม่ดีๆ ล่ะ' }]
             });
           } catch (e) {
             console.error("Cancel postback error:", e);
           }
        } else if (data === 'action=confirm') {
           const draft = await prisma.transactionDraft.findUnique({ where: { lineUserId: userId } });
           if (!draft) {
             await lineClient.replyMessage({
               replyToken: event.replyToken,
               messages: [{ type: 'text', text: 'หาไม่เจอ หรือกดซ้ำไปแล้วมั้ง ช่างเถอะ' }]
             });
             continue;
           }

           const payload = JSON.parse(draft.payload);
           
           try {
             let createdIdLabel = '';
             // UPSERT LOGIC WITH lineUserId
             if (payload.intent === 'SALE') {
                let customer = await prisma.customer.findFirst({ where: { name: payload.name } });
                if (!customer) customer = await prisma.customer.create({ data: { name: payload.name } });

                let product = await prisma.product.findFirst({ where: { name: payload.product } });
                if (!product) product = await prisma.product.create({ data: { name: payload.product } });

                const s = await prisma.sale.create({
                  data: {
                    date: payload.date ? new Date(payload.date) : new Date(),
                    customerId: customer.id,
                    productId: product.id,
                    quantity: payload.quantity,
                    unit: payload.unit || 'ชิ้น',
                    unitPrice: payload.unitPrice,
                    totalAmount: payload.totalAmount,
                    paymentStatus: payload.status,
                    paymentDate: payload.status === 'PAID' ? new Date() : null,
                    lineUserId: userId,
                  }
                });
                createdIdLabel = `S-${s.id}`;
             } else if (payload.intent === 'PURCHASE') {
                let supplier = await prisma.supplier.findFirst({ where: { name: payload.name } });
                if (!supplier) supplier = await prisma.supplier.create({ data: { name: payload.name } });

                let product = await prisma.product.findFirst({ where: { name: payload.product } });
                if (!product) product = await prisma.product.create({ data: { name: payload.product } });

                const p = await prisma.purchase.create({
                  data: {
                    date: payload.date ? new Date(payload.date) : new Date(),
                    supplierId: supplier.id,
                    productId: product.id,
                    quantity: payload.quantity,
                    unit: payload.unit || 'ชิ้น',
                    unitPrice: payload.unitPrice,
                    totalAmount: payload.totalAmount,
                    lineUserId: userId,
                  }
                });
                createdIdLabel = `P-${p.id}`;
             } else if (payload.intent === 'EXPENSE') {
                const e = await prisma.expense.create({
                  data: {
                    date: payload.date ? new Date(payload.date) : new Date(),
                    category: payload.expenseCategory || 'ทั่วไป',
                    amount: payload.totalAmount,
                    description: payload.expenseDescription || '',
                    lineUserId: userId,
                  }
                });
                createdIdLabel = `E-${e.id}`;
             } else if (payload.intent === 'EDIT') {
                 const targetId = payload.editTargetId;
                 const targetType = payload.editTargetType;
                 
                 const updateData: any = {};
                 if (payload.totalAmount) updateData.totalAmount = payload.totalAmount;
                 if (payload.status) updateData.paymentStatus = payload.status;
                 if (payload.quantity !== undefined) updateData.quantity = payload.quantity;
                 if (payload.unit !== undefined) updateData.unit = payload.unit;
                 if (payload.unitPrice !== undefined) updateData.unitPrice = payload.unitPrice;
                 
                 if (payload.product || payload.editTargetProduct) {
                   const productName = payload.product || payload.editTargetProduct;
                   if (productName) {
                     let product = await prisma.product.findFirst({ where: { name: productName } });
                     if (!product) {
                       product = await prisma.product.create({ data: { name: productName } });
                     }
                     updateData.productId = product.id;
                   }
                 }

                 if (targetType === 'SALE') {
                   await prisma.sale.update({ where: { id: targetId }, data: updateData });
                 } else if (targetType === 'PURCHASE') {
                   await prisma.purchase.update({ where: { id: targetId }, data: updateData });
                 }
             }

             // clean up draft
             await prisma.transactionDraft.delete({ where: { lineUserId: userId } });

             const dashboardUrl = `https://sugarmeow.vercel.app/`;
             const replyConfirmMsg = payload.intent === 'EDIT' ? 'เออ แก้ไขให้ละ' : `เออ บันทึกลงระบบให้ละ (บิล ID: ${createdIdLabel})`;
             await lineClient.replyMessage({
               replyToken: event.replyToken,
               messages: [
                 { type: 'text', text: replyConfirmMsg },
                 {
                   type: 'flex',
                   altText: 'เปิดแดชบอร์ดซะ',
                   contents: {
                     type: 'bubble',
                     body: {
                       type: 'box',
                       layout: 'vertical',
                       contents: [
                         {
                           type: 'text',
                           text: 'อุตส่าห์ทำปุ่มมาให้ละ กดเข้าไปดูยอดซะนะ 👇',
                           size: 'sm',
                           color: '#64748B',
                           wrap: true
                         }
                       ]
                     },
                     footer: {
                       type: 'box',
                       layout: 'vertical',
                       spacing: 'sm',
                       contents: [
                         {
                           type: 'button',
                           style: 'primary',
                           color: '#475569',
                           height: 'sm',
                           action: {
                             type: 'uri',
                             label: 'ไปดูแดชบอร์ด',
                             uri: dashboardUrl
                           }
                         }
                       ]
                     }
                   }
                 }
               ]
             });
           } catch (dbError) {
             console.error(dbError);
             await lineClient.replyMessage({
               replyToken: event.replyToken,
               messages: [{ type: 'text', text: '❌ เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล' }]
             });
           }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
