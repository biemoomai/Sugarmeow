import { NextResponse } from 'next/server';
import { lineClient } from '@/lib/line';
import { extractTransaction } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';

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

        // Check if user requests report/dashboard
        if (/^(รายงาน|แดชบอร์ด|dashboard|report|เมนู|สรุปยอด)$/i.test(text)) {
          const dashboardUrl = `https://sugarmeow.vercel.app/?userId=${userId}`;
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'text',
                text: `📊 กดดูสรุปยอดและรายงานบัญชีของคุณชูก้าร์แมวมึนได้ที่ลิงก์นี้เลยครับ:\n${dashboardUrl}`
              }
            ]
          });
          continue;
        }

        try {
          const data = await extractTransaction(text);
          
          // Save to draft
          await prisma.transactionDraft.upsert({
            where: { lineUserId: userId },
            update: { payload: JSON.stringify(data) },
            create: { lineUserId: userId, payload: JSON.stringify(data) }
          });

          let summaryText = '';
          if (data.intent === 'SALE') {
             summaryText = `ขายสินค้าให้: ${data.name}\nสินค้า: ${data.product}\nจำนวน: ${data.quantity} kg\nราคา: ${data.unitPrice} ฿/kg\nยอดรวม: ${data.totalAmount} ฿\nสถานะ: ${data.status === 'PAID' ? 'จ่ายแล้ว' : 'ค้างชำระ'}`;
          } else if (data.intent === 'PURCHASE') {
             summaryText = `ซื้อสินค้าจาก: ${data.name}\nสินค้า: ${data.product}\nจำนวน: ${data.quantity} kg\nราคา: ${data.unitPrice} ฿/kg\nยอดรวม: ${data.totalAmount} ฿\nสถานะ: ${data.status === 'PAID' ? 'จ่ายแล้ว' : 'ค้างชำระ'}`;
          } else {
             summaryText = `หมวดหมู่: ${data.expenseCategory || 'ทั่วไป'}\nรายละเอียด: ${data.expenseDescription || '-'}\nยอดรวม: ${data.totalAmount} ฿`;
          }

          const intentLabel = data.intent === 'SALE' ? 'รายการขาย' : data.intent === 'PURCHASE' ? 'รายการซื้อเข้า' : 'รายการค่าใช้จ่าย';

          // Send Flex Message
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'flex',
                altText: 'กรุณายืนยันการทำรายการ',
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
                        color: '#1DB446',
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
                        height: 'sm',
                        action: {
                          type: 'postback',
                          label: 'ยืนยัน',
                          data: 'action=confirm'
                        }
                      },
                      {
                        type: 'button',
                        style: 'secondary',
                        height: 'sm',
                        action: {
                          type: 'postback',
                          label: 'ยกเลิก',
                          data: 'action=cancel'
                        }
                      }
                    ]
                  }
                }
              }
            ]
          });
        } catch (e) {
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [{ type: 'text', text: '❌ ขออภัย AI ไม่สามารถทำความเข้าใจข้อความได้ กรุณาลองพิมพ์ใหม่อีกครั้งครับ (เช่น "ขายกล้วยให้เจ๊ศรี 100 โล โลละ 15 บาท")' }]
          });
        }
      } else if (event.type === 'postback') {
        const data = event.postback.data;
        if (data === 'action=cancel') {
           await prisma.transactionDraft.deleteMany({ where: { lineUserId: userId } });
           await lineClient.replyMessage({
             replyToken: event.replyToken,
             messages: [{ type: 'text', text: 'ยกเลิกรายการเรียบร้อยครับ ❌' }]
           });
        } else if (data === 'action=confirm') {
           const draft = await prisma.transactionDraft.findUnique({ where: { lineUserId: userId } });
           if (!draft) {
             await lineClient.replyMessage({
               replyToken: event.replyToken,
               messages: [{ type: 'text', text: '⚠️ ไม่พบรายการที่รอยืนยัน หรือรายการนี้ถูกบันทึกไปแล้วครับ' }]
             });
             continue;
           }

           const payload = JSON.parse(draft.payload);
           
           try {
             // UPSERT LOGIC WITH lineUserId
             if (payload.intent === 'SALE') {
                let customer = await prisma.customer.findFirst({ where: { name: payload.name } });
                if (!customer) customer = await prisma.customer.create({ data: { name: payload.name } });

                let product = await prisma.product.findFirst({ where: { name: payload.product } });
                if (!product) product = await prisma.product.create({ data: { name: payload.product } });

                await prisma.sale.create({
                  data: {
                    customerId: customer.id,
                    productId: product.id,
                    quantityKg: payload.quantity,
                    unitPrice: payload.unitPrice,
                    totalAmount: payload.totalAmount,
                    paymentStatus: payload.status,
                    paymentDate: payload.status === 'PAID' ? new Date() : null,
                    lineUserId: userId,
                  }
                });
             } else if (payload.intent === 'PURCHASE') {
                let supplier = await prisma.supplier.findFirst({ where: { name: payload.name } });
                if (!supplier) supplier = await prisma.supplier.create({ data: { name: payload.name } });

                let product = await prisma.product.findFirst({ where: { name: payload.product } });
                if (!product) product = await prisma.product.create({ data: { name: payload.product } });

                await prisma.purchase.create({
                  data: {
                    supplierId: supplier.id,
                    productId: product.id,
                    quantityKg: payload.quantity,
                    unitPrice: payload.unitPrice,
                    totalAmount: payload.totalAmount,
                    lineUserId: userId,
                  }
                });
             } else if (payload.intent === 'EXPENSE') {
                await prisma.expense.create({
                  data: {
                    category: payload.expenseCategory || 'ทั่วไป',
                    amount: payload.totalAmount,
                    description: payload.expenseDescription || '',
                    lineUserId: userId,
                  }
                });
             }

             // clean up draft
             await prisma.transactionDraft.delete({ where: { lineUserId: userId } });

             await lineClient.replyMessage({
               replyToken: event.replyToken,
               messages: [{ type: 'text', text: '✅ บันทึกรายการลงระบบเรียบร้อยแล้วครับ!' }]
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
