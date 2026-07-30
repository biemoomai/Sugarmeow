import { NextRequest, NextResponse } from 'next/server';
import { extractTransactionData } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { processTransaction } from '@/lib/transactions';
import * as line from '@line/bot-sdk';

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

// Use the generic client or specific messaging API client depending on SDK version
// Using legacy client for simpler reply syntax which is widely supported
const client = new line.Client(config);

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-line-signature');

    // Validate LINE signature if secret is present
    if (config.channelSecret && signature) {
      if (!line.validateSignature(bodyText, config.channelSecret, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(bodyText);

    for (const event of body.events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text;
        const userId = event.source.userId;
        const replyToken = event.replyToken;

        if (!userId) continue;

        // 1. Check if user has a pending draft
        const draft = await prisma.transactionDraft.findUnique({
          where: { lineUserId: userId },
        });

        // 2. Process text with Gemini
        const parsed = await extractTransactionData(text);

        if (!parsed) {
           await client.replyMessage(replyToken, { 
             type: 'text', 
             text: 'ขออภัยครับ ระบบไม่เข้าใจข้อความ กรุณาลองพิมพ์ใหม่อีกครั้งครับ' 
           });
           continue;
        }

        // 3. Handle Confirmation
        if (parsed.intent === 'confirm' && draft) {
           const payload = JSON.parse(draft.payload);
           
           await processTransaction(payload);
           
           // Clear draft
           await prisma.transactionDraft.delete({ where: { lineUserId: userId } });
           
           await client.replyMessage(replyToken, { 
             type: 'text', 
             text: '✅ บันทึกข้อมูลลงระบบเรียบร้อยครับ!' 
           });
           continue;
        }

        // 4. Handle Cancellation
        if (parsed.intent === 'cancel' && draft) {
           await prisma.transactionDraft.delete({ where: { lineUserId: userId } });
           await client.replyMessage(replyToken, { 
             type: 'text', 
             text: '❌ ยกเลิกรายการเรียบร้อยครับ' 
           });
           continue;
        }

        // 5. Handle New Transaction (Buy/Sell/Expense)
        if (['buy', 'sell', 'expense'].includes(parsed.intent)) {
          // Save to draft wait for confirm
          await prisma.transactionDraft.upsert({
            where: { lineUserId: userId },
            update: { payload: JSON.stringify(parsed) },
            create: { lineUserId: userId, payload: JSON.stringify(parsed) }
          });

          // Reply with confirmation request
          await client.replyMessage(replyToken, { 
            type: 'text', 
            text: parsed.reply_message || 'ต้องการบันทึกข้อมูลนี้ใช่หรือไม่?' 
          });
          continue;
        }
        
        // If query intent or unknown
        await client.replyMessage(replyToken, { 
          type: 'text', 
          text: 'รับทราบครับ แต่ฟังก์ชันดูรายงานหรือประมวลผลอื่นๆ กำลังอยู่ระหว่างการพัฒนาครับ 🚧' 
        });
      }
    }

    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
