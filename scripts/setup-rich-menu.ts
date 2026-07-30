import { messagingApi } from '@line/bot-sdk';
import * as fs from 'fs';
import * as path from 'path';

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

if (!channelAccessToken) {
  console.error("Please set LINE_CHANNEL_ACCESS_TOKEN environment variable.");
  process.exit(1);
}

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: channelAccessToken,
});

const blobClient = new messagingApi.MessagingApiBlobClient({
  channelAccessToken: channelAccessToken,
});

async function main() {
  try {
    const richMenuToCreate: messagingApi.RichMenuRequest = {
      size: { width: 1200, height: 810 },
      selected: true,
      name: "Main Menu",
      chatBarText: "Menu",
      areas: [
        {
          bounds: { x: 0, y: 0, width: 1200, height: 810 },
          action: {
            type: "uri",
            uri: "https://sugarmeow.vercel.app",
          },
        },
      ],
    };

    console.log("Creating rich menu...");
    const richMenuId = (await client.createRichMenu(richMenuToCreate)).richMenuId;
    console.log(`Created rich menu ID: ${richMenuId}`);

    const imagePath = path.join(__dirname, 'richmenu-placeholder.jpg');
    if (!fs.existsSync(imagePath)) {
      console.warn(`\n--- IMPORTANT ---`);
      console.warn(`Placeholder image not found at ${imagePath}`);
      console.warn(`Please create a 1200x810 image and save it as 'richmenu-placeholder.jpg' in the scripts folder.`);
      console.warn(`Then run this script again to upload the image and set the default rich menu.`);
      console.warn(`-----------------\n`);
      return;
    }

    console.log("Uploading rich menu image...");
    const imageBuffer = fs.readFileSync(imagePath);
    // Use Blob if available, otherwise just pass the buffer if the SDK allows it.
    // LINE SDK v11 requires a Blob for node 18+ environments
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    await blobClient.setRichMenuImage(richMenuId, blob);
    console.log("Image uploaded successfully.");

    console.log("Setting as default rich menu...");
    await client.setDefaultRichMenu(richMenuId);
    console.log("Default rich menu set successfully!");
  } catch (err: any) {
    console.error("Error setting up rich menu:");
    if (err.originalError && err.originalError.response) {
      console.error(err.originalError.response.data);
    } else {
      console.error(err);
    }
  }
}

main();
