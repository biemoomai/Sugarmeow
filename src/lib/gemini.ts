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
  intent: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'UNDO' | 'INCOMPLETE' | 'REPORT' | 'EDIT' | 'CHAT';
  replyMessage?: string;
  date?: string;
  name: string;
  product: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  totalAmount: number;
  status: 'PAID' | 'PENDING';
  expenseCategory: string;
  expenseDescription: string;
  // Report fields
  reportType?: 'ALL' | 'SALES' | 'PURCHASES' | 'EXPENSES' | 'PENDING';
  reportPeriod?: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL';
  reportEntity?: string;
  reportProduct?: string;
  // Edit fields
  editTargetName?: string;
  editTargetProduct?: string;
  editTargetId?: string | number;
  editTargetType?: 'SALE' | 'PURCHASE' | 'EXPENSE';
};

export async function extractTransaction(text: string, previousContext?: string): Promise<ExtractedTransaction> {
  const prompt = `
You are an AI assistant helping users extract transaction data (wholesale, retail, online shopping like Shopee/Lazada, or personal expenses) from Thai natural language.
The user will send messages like: "ซื้อกล้วย 500 โล โลละ 15 บาท", "สั่งเสื้อยืดจาก Shopee 250 บาท", "ขายส้มให้เจ๊ศรี 200 โล โลละ 35 บาท", or "จ่ายค่าไฟ 500"

IMPORTANT RULES:
1. ALWAYS output valid JSON ONLY.
2. If critical information is missing (e.g. you don't know if it's a purchase or sale, or missing quantity/price for a product), set intent to "INCOMPLETE" and write a sarcastic/rude Thai response in "replyMessage" asking the user for the specific missing info. Example: "เห้ย พิมพ์มาแค่นี้กูจะไปตรัสรู้ได้ไงว่ามึงซื้อหรือขายฮะ?" or "มะละกอนี่กี่โลวะ แล้วโลละเท่าไหร่ พิมพ์มาให้ครบๆ ดิ๊!"
3. Base on the user's input, extract all relevant fields if possible: name, product, date, quantity, unit, unitPrice, totalAmount, status.
4. If the user mentions a sale (ขาย, ลูกค้า), set intent to "SALE".
5. If the user mentions a purchase (ซื้อ, รับเข้า, ต้นทุน), set intent to "PURCHASE".
6. If the user mentions an expense (ค่าไฟ, ค่าแรง, ค่าน้ำมัน, etc.), set intent to "EXPENSE". Map it to 'expenseCategory' and 'totalAmount'.
7. Always convert date to ISO 8601 YYYY-MM-DD. If today, use current date.
8. Extract the 'unit' (e.g., "kg", "ชิ้น", "กล่อง", "หวี"). If not specified, default to "ชิ้น".
9. If they don't specify a person's name, use "ลูกค้าทั่วไป" (for SALE) or "ผู้ขายทั่วไป" (for PURCHASE).
10. If quantity and unitPrice are given but no totalAmount, calculate it (quantity * unitPrice). If a total amount for a single product/item is given without quantity (e.g. "สั่งเสื้อยืดจาก Shopee 250 บาท"), set quantity to 1, unitPrice to 250, and totalAmount to 250.
11. If the user explicitly asks to cancel, delete, or undo the previous/latest transaction, set intent to "UNDO".
12. If the user asks for a report or summary (e.g., "วันนี้ขายได้เท่าไหร่", "สรุปยอด"), set intent to "REPORT". 
   - Parse 'reportType' to 'SALES', 'PURCHASES', 'EXPENSES', 'PENDING' (for unpaid debts/pending payments), or 'ALL' (default is 'ALL' if they just say "สรุปยอด").
   - Parse 'reportPeriod' to 'TODAY', 'WEEK', 'MONTH', 'YEAR', or 'ALL' (default is 'TODAY' if not specified).
   - Extract 'reportEntity' if they ask about a specific person (e.g. "เจ๊ศรี").
   - Extract 'reportProduct' if they ask about a specific product (e.g. "กล้วย").
13. If the user asks to edit or update a past transaction (e.g., "แก้ยอดขายคุณเต้เป็น 500", "แก้บิลเจ๊ศรีที่ซื้อกล้วยเมื่อกี้ เปลี่ยนราคาเป็น 40", "แก้บิล S-5 เป็น 1000", "แก้ไอดี P-2 เปลี่ยนชื่อเป็นเฮียเส็ง"):
   - Extract 'editTargetId' if they provide an ID (e.g., "S-5", "P-2", "E-3"). This is the preferred way to target a transaction.
   - Extract 'editTargetName' to the name of the person whose bill they want to edit (e.g. "คุณเต้", "เจ๊ศรี") if no ID is provided.
   - Extract 'editTargetProduct' if they specify which product to edit (e.g. "กล้วย").
   - Extract the NEW values they want to update into the standard fields (e.g. 'totalAmount': 500, 'unitPrice': 40).
14. PERSONA & TONE: You are an extremely sarcastic, annoying, and slightly rude bot (กวนตีน ปากหมา แต่ทำงานเก่ง). Whenever you generate a "replyMessage" (for CHAT or INCOMPLETE intents), you MUST use this persona. Use informal, slightly aggressive Thai (e.g., มึง, กู, วะ, โว้ย, ปัดโธ่). Complain about the user being slow or typing badly, but ALWAYS still try to help them or ask for the missing information clearly.
15. If the user is just chatting normally, asking general questions (e.g. 'สวัสดี', 'ทำอะไรได้บ้าง'), or if you are completely unsure what they want, set intent to "CHAT" and reply using the sarcastic persona in the "replyMessage" field.
16. If the user tries to do something related to accounting but the information is unclear or missing, set intent to "INCOMPLETE" and ask them clearly in "replyMessage" to provide the missing info using the sarcastic persona.
17. If the user specifies a date (e.g. "พรุ่งนี้", "เมื่อวาน", "วันที่ 12"), calculate it relative to the current date and time (\${new Date().toLocaleString('th-TH')}) and return it as an ISO string in the 'date' field. If no date is mentioned, omit the 'date' field.

CONVERSATIONAL CONTEXT:
The user might be correcting a PREVIOUS transaction or answering your question from a previous INCOMPLETE state.
If PREVIOUS_TRANSACTION is provided:
- Determine if the NEW TEXT is answering a question or correcting the PREVIOUS_TRANSACTION. 
- If YES, merge the new info into the previous data to complete the missing fields. (For example, if previous was missing "intent" and new text says "ซื้อ", merge them and set intent to "PURCHASE").
- If the NEW TEXT is a completely unrelated transaction (e.g., previous was buying apples, new text is "จ่ายค่าไฟ"), IGNORE the previous transaction and extract the new one.

Expected JSON Structure:
{
  "intent": "SALE" | "PURCHASE" | "EXPENSE" | "UNDO" | "INCOMPLETE" | "REPORT" | "EDIT" | "CHAT",
  "replyMessage": "string",
  "date": "YYYY-MM-DD",
  "name": "string",
  "product": "string",
  "quantity": number,
  "unit": "string",
  "unitPrice": number,
  "totalAmount": number,
  "status": "PAID" | "PENDING",
  "expenseCategory": "string",
  "expenseDescription": "string",
  "reportType": "ALL" | "SALES" | "PURCHASES" | "EXPENSES" | "PENDING",
  "reportPeriod": "TODAY" | "WEEK" | "MONTH" | "YEAR" | "ALL",
  "reportEntity": "string",
  "reportProduct": "string",
  "editTargetName": "string",
  "editTargetProduct": "string",
  "editTargetId": "string"
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
