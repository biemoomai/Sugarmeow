import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

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
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

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
  "replyMessage": "string", // Only populate this if intent is "INCOMPLETE". Ask the user for the missing details in natural Thai.
  "name": "string", // Customer name for SALE, Supplier name for PURCHASE. Empty for EXPENSE.
  "product": "string", // Product name. Empty for EXPENSE.
  "quantity": number, // Amount in kg. 0 for EXPENSE.
  "unitPrice": number, // Price per kg. 0 for EXPENSE.
  "totalAmount": number, // Total amount. If not provided but qty and unitPrice are, calculate it.
  "status": "PAID" | "PENDING", // If mentioned they paid or not. Default to PAID for expenses, or PENDING if not clear for sales/purchases.
  "expenseCategory": "string", // Only for EXPENSE. (e.g. ค่าไฟ, ค่าน้ำ, ค่าแรง)
  "expenseDescription": "string" // Only for EXPENSE.
}

PREVIOUS_TRANSACTION:
${previousContext || "None"}

NEW TEXT: "${text}"
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Strip markdown if present
    const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as ExtractedTransaction;
  } catch (error: any) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error(error.message || String(error));
  }
}
