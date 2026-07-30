import { NextResponse } from 'next/server';


export async function GET() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Missing LINE_CHANNEL_ACCESS_TOKEN' }, { status: 500 });
  }


  try {
    // 1. Create rich menu
    const createRes = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        size: { width: 2500, height: 1686 },
        selected: true,
        name: 'Dashboard Menu',
        chatBarText: 'เปิดเมนู',
        areas: [
          {
            bounds: { x: 0, y: 0, width: 1250, height: 1686 },
            action: { type: 'uri', uri: 'https://sugarmeow.vercel.app' }
          },
          {
            bounds: { x: 1250, y: 0, width: 1250, height: 1686 },
            action: { type: 'message', text: 'วิธีใช้งาน' }
          }
        ]
      })
    });
    
    if (!createRes.ok) throw new Error(`Create failed: ${await createRes.text()}`);
    const { richMenuId } = await createRes.json();

    // 2. Fetch image
    const imageUrl = 'https://sugarmeow.vercel.app/richmenu.jpg';
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();

    // 3. Upload image
    const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'image/jpeg'
      },
      body: arrayBuffer
    });
    if (!uploadRes.ok) throw new Error(`Upload failed: ${await uploadRes.text()}`);

    // 4. Set as default
    const defaultRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!defaultRes.ok) throw new Error(`Set default failed: ${await defaultRes.text()}`);

    return NextResponse.json({ success: true, richMenuId });
  } catch (error: any) {
    console.error('Rich menu setup error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
