/**
 * Multimodal AI Processing using Gemini Vision
 * 
 * Handles image analysis, document OCR, and structured data extraction
 * for the COO AI system.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedContact {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  confidence: number;
}

export interface ImageAnalysis {
  description: string;
  detectedText?: string;
  contacts?: ExtractedContact[];
  dates?: Array<{ text: string; parsed?: string }>;
  amounts?: Array<{ text: string; value?: number; currency?: string }>;
  category: "business_card" | "document" | "receipt" | "screenshot" | "photo" | "other";
  suggestedActions?: string[];
}

export interface DocumentAnalysis {
  title?: string;
  content: string;
  summary: string;
  keyPoints: string[];
  entities: {
    people: string[];
    organizations: string[];
    dates: string[];
    amounts: string[];
  };
  category: string;
  suggestedTags: string[];
}

// ============================================================================
// GEMINI VISION API
// ============================================================================

async function callGeminiVision(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("Google AI API key is not configured");

  const model = process.env.GEMINI_VISION_MODEL || "gemini-2.0-flash";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2, // Low temperature for accuracy
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || "Gemini Vision error");
  }

  return json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ============================================================================
// IMAGE ANALYSIS
// ============================================================================

export async function analyzeImage(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ImageAnalysis> {
  const prompt = `Analyze this image for a business/professional context.

Provide a JSON response with the following structure:
{
  "description": "Brief description of what's in the image",
  "detectedText": "Any text visible in the image (OCR)",
  "contacts": [
    {
      "name": "Person's name",
      "email": "email if visible",
      "phone": "phone if visible",
      "company": "company if visible",
      "role": "job title if visible",
      "confidence": 0.0-1.0
    }
  ],
  "dates": [
    {"text": "original text", "parsed": "YYYY-MM-DD if parseable"}
  ],
  "amounts": [
    {"text": "original text", "value": numeric_value, "currency": "USD/AED/etc"}
  ],
  "category": "business_card" | "document" | "receipt" | "screenshot" | "photo" | "other",
  "suggestedActions": ["array of suggested actions based on the content"]
}

Rules:
- Extract ALL visible text
- Identify contact information with high accuracy
- Parse dates into YYYY-MM-DD format when possible
- Parse monetary amounts into numeric values
- Be conservative with confidence scores
- Suggest actionable next steps based on content

Respond with valid JSON only, no markdown formatting.`;

  const result = await callGeminiVision(imageBase64, mimeType, prompt);
  
  try {
    // Clean up the response (remove markdown code blocks if present)
    let cleanResult = result.trim();
    if (cleanResult.startsWith("```json")) {
      cleanResult = cleanResult.slice(7);
    }
    if (cleanResult.startsWith("```")) {
      cleanResult = cleanResult.slice(3);
    }
    if (cleanResult.endsWith("```")) {
      cleanResult = cleanResult.slice(0, -3);
    }
    
    return JSON.parse(cleanResult);
  } catch {
    // If JSON parsing fails, return a basic analysis
    return {
      description: result.slice(0, 500),
      category: "other",
      suggestedActions: ["Review the extracted content manually"],
    };
  }
}

// ============================================================================
// DOCUMENT ANALYSIS
// ============================================================================

export async function analyzeDocument(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<DocumentAnalysis> {
  const prompt = `Analyze this document image for business/professional use.

Extract and structure the content. Provide a JSON response:
{
  "title": "Document title if identifiable",
  "content": "Full text content extracted from the document",
  "summary": "2-3 sentence summary of the document",
  "keyPoints": ["Array of key points/takeaways"],
  "entities": {
    "people": ["Names mentioned"],
    "organizations": ["Companies/orgs mentioned"],
    "dates": ["Dates mentioned (YYYY-MM-DD format)"],
    "amounts": ["Monetary amounts mentioned"]
  },
  "category": "contract" | "invoice" | "report" | "memo" | "form" | "other",
  "suggestedTags": ["array", "of", "relevant", "tags"]
}

Rules:
- Extract ALL text accurately
- Preserve important formatting context
- Identify the document type/category
- Extract all named entities
- Suggest relevant tags for organization

Respond with valid JSON only, no markdown formatting.`;

  const result = await callGeminiVision(imageBase64, mimeType, prompt);
  
  try {
    let cleanResult = result.trim();
    if (cleanResult.startsWith("```json")) {
      cleanResult = cleanResult.slice(7);
    }
    if (cleanResult.startsWith("```")) {
      cleanResult = cleanResult.slice(3);
    }
    if (cleanResult.endsWith("```")) {
      cleanResult = cleanResult.slice(0, -3);
    }
    
    return JSON.parse(cleanResult);
  } catch {
    return {
      content: result,
      summary: "Unable to parse document structure",
      keyPoints: [],
      entities: { people: [], organizations: [], dates: [], amounts: [] },
      category: "other",
      suggestedTags: [],
    };
  }
}

// ============================================================================
// BUSINESS CARD EXTRACTION
// ============================================================================

export async function extractBusinessCard(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ExtractedContact[]> {
  const prompt = `This is an image of one or more business cards. Extract contact information.

Provide a JSON array of contacts:
[
  {
    "name": "Full name",
    "email": "email@example.com",
    "phone": "+1-234-567-8900",
    "company": "Company Name",
    "role": "Job Title",
    "confidence": 0.95
  }
]

Rules:
- Extract ALL visible contact information
- Format phone numbers consistently
- Include confidence score (0.0-1.0) based on readability
- If multiple cards, return multiple objects
- Only include fields that are clearly visible

Respond with valid JSON array only, no markdown formatting.`;

  const result = await callGeminiVision(imageBase64, mimeType, prompt);
  
  try {
    let cleanResult = result.trim();
    if (cleanResult.startsWith("```json")) {
      cleanResult = cleanResult.slice(7);
    }
    if (cleanResult.startsWith("```")) {
      cleanResult = cleanResult.slice(3);
    }
    if (cleanResult.endsWith("```")) {
      cleanResult = cleanResult.slice(0, -3);
    }
    
    const parsed = JSON.parse(cleanResult);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

// ============================================================================
// RECEIPT/EXPENSE EXTRACTION
// ============================================================================

export interface ExtractedExpense {
  vendor: string;
  date?: string;
  total: number;
  currency: string;
  items?: Array<{ description: string; amount: number }>;
  category?: string;
  paymentMethod?: string;
}

export async function extractReceipt(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ExtractedExpense | null> {
  const prompt = `This is an image of a receipt or invoice. Extract expense information.

Provide a JSON response:
{
  "vendor": "Store/Company name",
  "date": "YYYY-MM-DD",
  "total": 123.45,
  "currency": "USD",
  "items": [
    {"description": "Item name", "amount": 10.00}
  ],
  "category": "meals" | "travel" | "supplies" | "services" | "other",
  "paymentMethod": "credit_card" | "cash" | "debit" | "unknown"
}

Rules:
- Extract the total amount accurately
- Parse the date into YYYY-MM-DD format
- Identify the currency from symbols or context
- Categorize the expense type
- Include line items if visible

Respond with valid JSON only, no markdown formatting.`;

  const result = await callGeminiVision(imageBase64, mimeType, prompt);
  
  try {
    let cleanResult = result.trim();
    if (cleanResult.startsWith("```json")) {
      cleanResult = cleanResult.slice(7);
    }
    if (cleanResult.startsWith("```")) {
      cleanResult = cleanResult.slice(3);
    }
    if (cleanResult.endsWith("```")) {
      cleanResult = cleanResult.slice(0, -3);
    }
    
    return JSON.parse(cleanResult);
  } catch {
    return null;
  }
}

// ============================================================================
// GENERAL PURPOSE TEXT EXTRACTION
// ============================================================================

export async function extractText(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  const prompt = `Extract ALL text from this image. 
Preserve the layout and structure as much as possible.
Just return the extracted text, nothing else.`;

  return await callGeminiVision(imageBase64, mimeType, prompt);
}

// ============================================================================
// INTELLIGENT ROUTING
// ============================================================================

export interface ProcessedContent {
  type: "contacts" | "knowledge" | "deadline" | "expense" | "document" | "general";
  data: any;
  suggestedAction: string;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
}

export async function processMultimodalInput(
  imageBase64: string,
  mimeType: string = "image/jpeg",
  userContext?: string
): Promise<ProcessedContent> {
  // First, analyze the image to determine its type
  const analysis = await analyzeImage(imageBase64, mimeType);
  
  // Route based on detected content type
  switch (analysis.category) {
    case "business_card":
      const contacts = await extractBusinessCard(imageBase64, mimeType);
      return {
        type: "contacts",
        data: { contacts, source: "business_card" },
        suggestedAction: contacts.length > 1 
          ? `Add ${contacts.length} contacts to the system`
          : `Add contact: ${contacts[0]?.name || "Unknown"}`,
        requiresConfirmation: contacts.length >= 1,
        confirmationMessage: contacts.length > 1
          ? `Found ${contacts.length} contacts. Ready to add them all?`
          : `Found contact: ${contacts[0]?.name}. Add to contacts?`,
      };

    case "receipt":
      const expense = await extractReceipt(imageBase64, mimeType);
      return {
        type: "expense",
        data: expense,
        suggestedAction: expense 
          ? `Log expense: ${expense.total} ${expense.currency} at ${expense.vendor}`
          : "Unable to extract expense details",
        requiresConfirmation: true,
        confirmationMessage: expense
          ? `Expense: ${expense.total} ${expense.currency} at ${expense.vendor} on ${expense.date}. Save this?`
          : undefined,
      };

    case "document":
      const docAnalysis = await analyzeDocument(imageBase64, mimeType);
      return {
        type: "document",
        data: docAnalysis,
        suggestedAction: `Save document: ${docAnalysis.title || "Untitled"}`,
        requiresConfirmation: true,
        confirmationMessage: `Document analyzed: ${docAnalysis.summary.slice(0, 100)}... Save to knowledge base?`,
      };

    case "screenshot":
    case "photo":
    case "other":
    default:
      // Check if it contains deadline/date information
      if (analysis.dates && analysis.dates.length > 0) {
        const hasDeadlineKeywords = analysis.description?.toLowerCase().includes("deadline") ||
          analysis.description?.toLowerCase().includes("due") ||
          analysis.description?.toLowerCase().includes("by");
        
        if (hasDeadlineKeywords) {
          return {
            type: "deadline",
            data: {
              description: analysis.description,
              dates: analysis.dates,
              detectedText: analysis.detectedText,
            },
            suggestedAction: `Create deadline from image`,
            requiresConfirmation: true,
            confirmationMessage: `Found date(s): ${analysis.dates.map(d => d.text).join(", ")}. Create deadline?`,
          };
        }
      }

      // Default: store as knowledge/note
      return {
        type: "general",
        data: {
          description: analysis.description,
          detectedText: analysis.detectedText,
          category: analysis.category,
        },
        suggestedAction: analysis.detectedText 
          ? "Save extracted text to knowledge base"
          : "Store image analysis",
        requiresConfirmation: false,
      };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert a file/blob to base64
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

/**
 * Get MIME type from file
 */
export function getMimeType(file: File): string {
  return file.type || "application/octet-stream";
}

/**
 * Check if a file is an image
 */
export function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * Check if a file is a document (PDF, etc.)
 */
export function isDocument(file: File): boolean {
  const docTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  return docTypes.includes(file.type);
}
