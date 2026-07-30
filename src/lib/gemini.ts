import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export type ExtractedTransaction = {
  intent: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'UNKNOWN';
  name: string;
  product: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING';
  expenseCategory: string;
  expenseDescription: string;
};

export async function extractTransaction(text: string): Promise<ExtractedTransaction> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
You are an AI assistant helping a wholesale shop owner extract transaction data from Thai natural language.
The owner will send messages like: "ซื้อกล้วย 500 โล โลละ 15 บาท", "ขายส้มให้เจ๊ศรี 200 โล โลละ 35 บาท", or "จ่ายค่าไฟ 500"

IMPORTANT RULES:
1. ALWAYS output valid JSON ONLY.
2. If the user does not specify if they are buying or selling AND it is ambiguous (e.g., "มะละกอป้านัท 50 โล โลละ 50"), set intent to "UNKNOWN".
3. If they don't specify a person's name, use "ลูกค้าทั่วไป" (for SALE) or "ผู้ขายทั่วไป" (for PURCHASE).
4. If they give quantity and unitPrice but no totalAmount, calculate it (quantity * unitPrice).

Expected JSON Structure:
{
  "intent": "SALE" | "PURCHASE" | "EXPENSE" | "UNKNOWN",
  "name": "string", // Customer name for SALE, Supplier name for PURCHASE. Empty for EXPENSE.
  "product": "string", // Product name. Empty for EXPENSE.
  "quantity": number, // Amount in kg. 0 for EXPENSE.
  "unitPrice": number, // Price per kg. 0 for EXPENSE.
  "totalAmount": number, // Total amount. If not provided but qty and unitPrice are, calculate it.
  "status": "PAID" | "PENDING", // If mentioned they paid or not. Default to PAID for expenses, or PENDING if not clear for sales/purchases.
  "expenseCategory": "string", // Only for EXPENSE. (e.g. ค่าไฟ, ค่าน้ำ, ค่าแรง)
  "expenseDescription": "string" // Only for EXPENSE.
}

Analyze this text: "${text}"
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
