import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const geminiApiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiApiKey);
const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: { responseMimeType: "application/json" }
});

const groqApiKey = process.env.GROQ_API_KEY || '';
const groq = new Groq({ apiKey: groqApiKey });

const cerebrasApiKey = process.env.CEREBRAS_API_KEY || '';

export type ExtractedTransaction = {
  intent: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'UNKNOWN' | 'UNDO' | 'INCOMPLETE';
  replyMessage?: string;
  name: string;
  product: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING';
  expenseCategory: string;
  expenseDescription: string;
};

export async function extractTransaction(text: string, previousContext?: string): Promise<ExtractedTransaction> {
  const prompt = `
You are an AI assistant helping users extract transaction data (wholesale, retail, online shopping like Shopee/Lazada, or personal expenses) from Thai natural language.
The user will send messages like: "ซื้อกล้วย 500 โล โลละ 15 บาท", "สั่งเสื้อยืดจาก Shopee 250 บาท", "ขายส้มให้เจ๊ศรี 200 โล โลละ 35 บาท", or "จ่ายค่าไฟ 500"

IMPORTANT RULES:
1. ALWAYS output valid JSON ONLY.
2. If critical information is missing (e.g. you don't know if it's a purchase or sale, or missing quantity/price for a product), set intent to "INCOMPLETE" and write a natural Thai response in "replyMessage" asking the user for the specific missing info. Example: "ตกลงอันนี้ซื้อเข้ามาหรือขายออกไปครับ?" or "มะละกอนี่กี่โล โลละเท่าไหร่นะครับ?"
3. If they don't specify a person's name, use "ลูกค้าทั่วไป" (for SALE) or "ผู้ขายทั่วไป" (for PURCHASE).
4. If quantity and unitPrice are given but no totalAmount, calculate it (quantity * unitPrice). If a total amount for a single product/item is given without quantity (e.g. "สั่งเสื้อยืดจาก Shopee 250 บาท"), set quantity to 1, unitPrice to 250, and totalAmount to 250.
5. If the user explicitly asks to cancel, delete, or undo the previous/latest transaction, set intent to "UNDO".
6. If the message contains typos, try to handle them gracefully. If the message is complete nonsense, gibberish, or you cannot understand it at all, set intent to "INCOMPLETE" and write a polite confused message in "replyMessage" asking them to retype it clearly.

CONVERSATIONAL CONTEXT:
The user might be correcting a PREVIOUS transaction or answering your question from a previous INCOMPLETE state.
If PREVIOUS_TRANSACTION is provided:
- Determine if the NEW TEXT is answering a question or correcting the PREVIOUS_TRANSACTION. 
- If YES, merge the new info into the previous data to complete the missing fields. (For example, if previous was missing "intent" and new text says "ซื้อ", merge them and set intent to "PURCHASE").
- If the NEW TEXT is a completely unrelated transaction (e.g., previous was buying apples, new text is "จ่ายค่าไฟ"), IGNORE the previous transaction and extract the new one.

Expected JSON Structure:
{
  "intent": "SALE" | "PURCHASE" | "EXPENSE" | "UNKNOWN" | "UNDO" | "INCOMPLETE",
  "replyMessage": "string",
  "name": "string",
  "product": "string",
  "quantity": number,
  "unitPrice": number,
  "totalAmount": number,
  "status": "PAID" | "PENDING",
  "expenseCategory": "string",
  "expenseDescription": "string"
}

PREVIOUS_TRANSACTION:
${previousContext || "None"}

NEW TEXT: "${text}"
`;

  // Tier 1: Try Google Gemini
  if (geminiApiKey) {
    try {
      console.log("Attempting AI extraction with Google Gemini...");
      const result = await geminiModel.generateContent(prompt);
      const cleaned = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as ExtractedTransaction;
    } catch (error: any) {
      console.warn("Gemini AI failed, preparing to fallback to Groq...", error.message || error);
    }
  }

  // Tier 2: Try Groq (Llama 3.3)
  if (groqApiKey) {
    try {
      console.log("Attempting AI extraction with Groq (Llama 3.3)...");
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
      });
      const cleaned = (chatCompletion.choices[0]?.message?.content || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as ExtractedTransaction;
    } catch (error: any) {
      console.warn("Groq AI failed...", error.message || error);
    }
  }

  // Tier 3: Try Cerebras (Llama 3.1)
  if (cerebrasApiKey) {
    try {
      console.log("Attempting AI extraction with Cerebras (Llama 3.1)...");
      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cerebrasApiKey}`
        },
        body: JSON.stringify({
          model: "llama3.1-70b",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`Cerebras API error: ${response.statusText}`);
      }

      const data = await response.json();
      const cleaned = (data.choices?.[0]?.message?.content || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned) as ExtractedTransaction;
    } catch (error: any) {
      console.warn("Cerebras AI failed...", error.message || error);
    }
  }

  throw new Error("All AI providers (Gemini, Groq, Cerebras) failed or no API keys are configured.");
}
