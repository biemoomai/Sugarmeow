import { NextResponse } from 'next/server';
import { Client } from '@line/bot-sdk';

export async function GET() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing LINE_CHANNEL_ACCESS_TOKEN' }, { status: 500 });
  }

  const client = new Client({
    channelAccessToken: token
  });

  try {
    // 1. Create rich menu
    const richMenuId = await client.createRichMenu({
      size: { width: 1200, height: 810 },
      selected: true,
      name: 'Dashboard Menu',
      chatBarText: 'เปิดเมนู',
      areas: [
        {
          bounds: { x: 0, y: 0, width: 1200, height: 810 },
          action: {
            type: 'uri',
            uri: 'https://sugarmeow.vercel.app'
          }
        }
      ]
    });

    // 2. Fetch image from our own public directory via URL
    const imageUrl = 'https://sugarmeow.vercel.app/richmenu.jpg';
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Upload image
    await client.setRichMenuImage(richMenuId, buffer);

    // 4. Set as default
    await client.setDefaultRichMenu(richMenuId);

    return NextResponse.json({ success: true, richMenuId });
  } catch (error: any) {
    console.error('Rich menu setup error:', error.originalError?.response?.data || error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
