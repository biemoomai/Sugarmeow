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

        // Show loading animation for 5 seconds
        try {
          await lineClient.showLoadingAnimation({ chatId: userId, loadingSeconds: 5 });
        } catch (e) {
          console.error("Failed to show loading animation:", e);
        }

        // Check if user requests report/dashboard
        // Check if user requests report/dashboard
        if (/^(รายงาน|แดชบอร์ด|dashboard|report|เมนู|สรุปยอด|เข้าเว็บ)$/i.test(text)) {
          const dashboardUrl = `https://sugarmeow.vercel.app/`;
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [
              {
                type: 'flex',
                altText: 'แดชบอร์ดชูก้าร์แมวมึน',
                contents: {
                  type: 'bubble',
                  body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: '📊 แดชบอร์ด (จะดูไหม?)',
                        weight: 'bold',
                        size: 'md',
                        color: '#334155'
                      },
                      {
                        type: 'text',
                        text: 'เอ้า กดเข้าไปดูสิ รออะไรอยู่ หน้าเว็บส่วนตัวน่ะ',
                        size: 'sm',
                        color: '#64748B',
                        wrap: true,
                        margin: 'md'
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
                          label: 'จิ้มเข้าเว็บสิ',
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
          
          // Save to draft
          await prisma.transactionDraft.upsert({
            where: { lineUserId: userId },
            update: { payload: JSON.stringify(data) },
            create: { lineUserId: userId, payload: JSON.stringify(data) }
          });

          if (data.intent === 'INCOMPLETE' && data.replyMessage) {
            await lineClient.replyMessage({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: data.replyMessage }]
            });
            continue;
          }

          if (data.intent === 'UNKNOWN') {
            await lineClient.replyMessage({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: 'พิมพ์อะไรมาเนี่ย งงไปหมดละ พิมพ์มาให้ครบๆ ดิ๊ มึนละเนี่ย' }]
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

          let summaryText = '';
          if (data.intent === 'SALE') {
             summaryText = `ขายให้: ${data.name}\nของ: ${data.product}\nจำนวน: ${data.quantity} kg\nราคา: ${data.unitPrice} ฿/kg\nยอดรวม: ${data.totalAmount} ฿\nสถานะ: ${data.status === 'PAID' ? 'จ่ายแล้ว' : 'ค้างชำระ (ไปทวงด้วยนะ)'}`;
          } else if (data.intent === 'PURCHASE') {
             summaryText = `ซื้อจาก: ${data.name}\nของ: ${data.product}\nจำนวน: ${data.quantity} kg\nราคา: ${data.unitPrice} ฿/kg\nยอดรวม: ${data.totalAmount} ฿\nสถานะ: ${data.status === 'PAID' ? 'จ่ายแล้ว' : 'ติดหนี้เขาอยู่'}`;
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
          const errorMessage = e.message || String(e);
          console.error("Webhook Error:", e);
          const dashboardUrl = `https://sugarmeow.vercel.app/`;
          await lineClient.replyMessage({
            replyToken: event.replyToken,
            messages: [
              { type: 'text', text: `พิมพ์อะไรมาวะเนี่ย อ่านไม่รู้เรื่อง เอาใหม่ดิ๊\n\n(แจ้งแอดมิน: ระบบพังเพราะ "${errorMessage}")` },
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
        const data = event.postback.data;
        if (data === 'action=cancel') {
           await prisma.transactionDraft.deleteMany({ where: { lineUserId: userId } });
           await lineClient.replyMessage({
             replyToken: event.replyToken,
             messages: [{ type: 'text', text: 'เออ ยกเลิกให้ละ พิมพ์ใหม่ดีๆ ล่ะ' }]
           });
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

             const dashboardUrl = `https://sugarmeow.vercel.app/`;
             await lineClient.replyMessage({
               replyToken: event.replyToken,
               messages: [
                 { type: 'text', text: 'เออ บันทึกลงระบบให้ละ จะไปทำอะไรก็ไป' },
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
