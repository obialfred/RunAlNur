import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/ai/agent";
import { processMultimodalInput, type ProcessedContent } from "@/lib/ai/multimodal";
import { 
  getAuthContext, 
  unauthorizedResponse, 
  checkRateLimit, 
  rateLimitExceededResponse 
} from "@/lib/api/auth";
import { getApiKey } from "@/lib/integrations/user-credentials";

interface AttachedFile {
  name: string;
  type: string;
  base64?: string;
}

interface ChatRequest {
  message: string;
  provider?: "openai" | "anthropic" | "gemini";
  files?: AttachedFile[];
}

// Rate limit: 20 requests per minute per user
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Demo-mode AI responses
function getDemoResponse(message: string): string {
  const lowercaseMsg = message.toLowerCase();
  
  if (lowercaseMsg.includes("status") || lowercaseMsg.includes("briefing")) {
    return `**Empire Status Briefing**

Here's your current status across all arms:

**Janna (Real Estate)**
- 3 active properties in pipeline
- 2 deals in negotiation
- 1 renovation project ongoing

**Nova (Technology)**
- 5 active projects
- 12 tasks due this week
- All systems operational

**Silk (Consulting)**
- 8 active client engagements
- 3 proposals pending review

*This is a demo response. Connect your AI API key in Settings for full functionality.*`;
  }
  
  if (lowercaseMsg.includes("task") || lowercaseMsg.includes("create")) {
    return `I can help you create tasks! In the full version, I would:

1. Ask which project to add the task to
2. Collect task details (name, priority, due date)
3. Create it directly in ClickUp

*This is a demo response. Connect your AI API key in Settings for full functionality.*`;
  }
  
  if (lowercaseMsg.includes("summarize") || lowercaseMsg.includes("summary")) {
    return `**Weekly Summary**

This week across House Al Nur:
- **15** tasks completed
- **3** new projects started
- **$1.2M** in deals progressing
- **24** contacts engaged

Top priorities for next week:
1. Close Downtown Duplex acquisition
2. Complete Q1 marketing campaign review
3. Schedule tenant onboarding for Oak Street

*This is a demo response. Connect your AI API key in Settings for full functionality.*`;
  }
  
  return `Hello! I'm the Empire OS AI assistant. I can help you with:

- **Status updates** - Get briefings on your arms and projects
- **Task management** - Create and track tasks across projects
- **Summaries** - Get weekly/monthly summaries of activity

Try asking: "What's my status?" or "Summarize this week"

*This is a demo response. Connect your AI API key (OpenAI or Claude) in Settings for full functionality.*`;
}

export async function POST(request: NextRequest) {
  // Check authentication
  const { context, error } = await getAuthContext(request);
  if (!context) return unauthorizedResponse(error || "Authentication required");
  const { user, tenantId } = context;

  // Check rate limit
  const rateLimitResult = checkRateLimit(
    `ai_chat:${user.id}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW
  );

  if (!rateLimitResult.allowed) {
    return rateLimitExceededResponse(rateLimitResult.resetIn);
  }

  // Parse body early so we can use it in catch block for fallback
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { message, provider: preferredProvider, files } = body;

  if (!message && (!files || files.length === 0)) {
    return NextResponse.json(
      { success: false, error: "Message or files required" },
      { status: 400 }
    );
  }

  try {

    // Validate message length to prevent abuse
    if (message && message.length > 10000) {
      return NextResponse.json(
        { success: false, error: "Message too long (max 10,000 characters)" },
        { status: 400 }
      );
    }

    // Try to get API key based on preferred provider
    let aiApiKey: string | null = null;
    let aiProvider: "openai" | "anthropic" | "gemini" | null = null;

    // If Gemini is specifically requested
    if (preferredProvider === "gemini") {
      const geminiKey = await getApiKey(tenantId, user.id, "gemini");
      if (geminiKey) {
        aiApiKey = geminiKey;
        aiProvider = "gemini";
      } else if (process.env.GOOGLE_AI_API_KEY) {
        aiApiKey = process.env.GOOGLE_AI_API_KEY;
        aiProvider = "gemini";
      }
    }

    // If Anthropic is requested or default
    if (!aiApiKey && (preferredProvider === "anthropic" || !preferredProvider)) {
      const anthropicKey = await getApiKey(tenantId, user.id, "anthropic");
      if (anthropicKey) {
        aiApiKey = anthropicKey;
        aiProvider = "anthropic";
      } else if (process.env.ANTHROPIC_API_KEY) {
        aiApiKey = process.env.ANTHROPIC_API_KEY;
        aiProvider = "anthropic";
      }
    }
    
    // Fallback to OpenAI
    if (!aiApiKey && (preferredProvider === "openai" || !preferredProvider)) {
      const openaiKey = await getApiKey(tenantId, user.id, "openai");
      if (openaiKey) {
        aiApiKey = openaiKey;
        aiProvider = "openai";
      } else if (process.env.OPENAI_API_KEY) {
        aiApiKey = process.env.OPENAI_API_KEY;
        aiProvider = "openai";
      }
    }
    
    if (!aiApiKey || !aiProvider) {
      // Demo-mode fallback: return contextual mock response
      return NextResponse.json({
        success: true,
        message: getDemoResponse(message || ""),
        toolResults: [],
        isDemo: true,
      });
    }

    // Process files if attached (using Gemini Vision)
    const processedFiles: ProcessedContent[] = [];
    let enhancedMessage = message || "";
    const pendingActions: Array<{
      id: string;
      type: string;
      description: string;
      data: unknown;
    }> = [];

    if (files && files.length > 0) {
      // We need Gemini for vision processing
      const geminiKey =
        (await getApiKey(tenantId, user.id, "gemini")) || process.env.GOOGLE_AI_API_KEY;
      
      if (geminiKey) {
        // Process each file
        for (const file of files) {
          if (file.base64 && file.type.startsWith("image/")) {
            try {
              const processed = await processMultimodalInput(
                file.base64,
                file.type,
                message
              );
              processedFiles.push(processed);

              // If action requires confirmation, add to pending actions
              if (processed.requiresConfirmation) {
                pendingActions.push({
                  id: `action-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  type: processed.type,
                  description: processed.suggestedAction,
                  data: processed.data,
                });
              }
            } catch (err) {
              console.error("File processing error:", err);
            }
          }
        }

        // Enhance the message with extracted content
        if (processedFiles.length > 0) {
          const fileContext = processedFiles.map((pf, i) => {
            let context = `\n\n[Analyzed File ${i + 1}]\n`;
            context += `Type: ${pf.type}\n`;
            
            if (pf.type === "contacts" && pf.data.contacts) {
              const contacts = pf.data.contacts as Array<{ name: string; email?: string; phone?: string; company?: string }>;
              context += `Found ${contacts.length} contact(s):\n`;
              contacts.forEach((c) => {
                context += `- ${c.name}`;
                if (c.email) context += ` (${c.email})`;
                if (c.company) context += ` at ${c.company}`;
                context += "\n";
              });
            } else if (pf.type === "document" && pf.data.summary) {
              context += `Summary: ${pf.data.summary}\n`;
              if (pf.data.keyPoints) {
                context += `Key Points:\n`;
                (pf.data.keyPoints as string[]).forEach((kp) => {
                  context += `- ${kp}\n`;
                });
              }
            } else if (pf.data.description) {
              context += `Description: ${pf.data.description}\n`;
            }
            
            if (pf.data.detectedText) {
              context += `Detected Text: ${String(pf.data.detectedText).slice(0, 500)}${String(pf.data.detectedText).length > 500 ? "..." : ""}\n`;
            }

            return context;
          }).join("\n");

          enhancedMessage = `${message || "Please analyze these files."}\n${fileContext}`;
        }
      }
    }

    // Run the agent with the determined API key and enhanced message
    const result = await runAgent({ 
      message: enhancedMessage,
      apiKey: aiApiKey,
      provider: aiProvider,
      context: { tenantId, userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: result.content,
      toolResults: result.toolResults,
      provider: aiProvider,
      processedFiles: processedFiles.length > 0 ? processedFiles : undefined,
      pendingActions: pendingActions.length > 0 ? pendingActions : undefined,
    });
  } catch (err) {
    console.error("Chat API Error:", err);
    
    // If agent fails, fall back to demo mode
    return NextResponse.json({
      success: true,
      message: getDemoResponse(message || ""),
      toolResults: [],
      isDemo: true,
      note: "AI service unavailable, showing demo response",
    });
  }
}
