import { AI_TOOLS } from "@/lib/ai/tools";
import {
  createProject,
  createTask,
  createContact,
  updateTaskStatus,
  getProjectStatus,
  getArmSummary,
  searchContacts,
  getOverdueTasks,
  createDailyBriefing,
  // New extended actions
  createKnowledge,
  searchKnowledge,
  createDeadline,
  createMilestone,
  createBulkContacts,
  updateContact,
  createSOP,
  createTaskSmart,
  scheduleTasks,
  commitTaskToDay,
  deferTask,
  getTodaySchedule,
  getBacklog,
  rescheduleTask,
  createRecurringTask,
} from "@/lib/ai/actions";

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

type AgentContext = {
  tenantId?: string;
  userId?: string;
};

function buildToolHandlers(context?: AgentContext): Record<string, ToolHandler> {
  return {
    // Existing tools
    create_project: async (args) => createProject(args as any),
    create_task: async (args) => createTask(args as any, context),
    create_contact: async (args) => createContact(args as any),
    update_task_status: async (args) => updateTaskStatus(args as any),
    get_project_status: async (args) => getProjectStatus(args as any),
    get_arm_summary: async (args) => getArmSummary(args as any),
    search_contacts: async (args) => searchContacts(args as any),
    get_overdue_tasks: async () => getOverdueTasks(),
    create_daily_briefing: async () => createDailyBriefing(),
    // New extended tools
    create_knowledge: async (args) => createKnowledge(args as any),
    search_knowledge: async (args) => searchKnowledge(args as any),
    create_deadline: async (args) => createDeadline(args as any),
    create_milestone: async (args) => createMilestone(args as any),
    create_bulk_contacts: async (args) => createBulkContacts(args as any),
    update_contact: async (args) => updateContact(args as any),
    create_sop: async (args) => createSOP(args as any),
    // Advanced task system
    create_task_smart: async (args) => createTaskSmart(args as any, context),
    schedule_tasks: async (args) => scheduleTasks(args as any, context),
    commit_task_to_day: async (args) => commitTaskToDay(args as any, context),
    defer_task: async (args) => deferTask(args as any, context),
    get_today_schedule: async (args) => getTodaySchedule(args as any, context),
    get_backlog: async (args) => getBacklog(args as any, context),
    reschedule_task: async (args) => rescheduleTask(args as any, context),
    create_recurring_task: async (args) => createRecurringTask(args as any, context),
  };
}

const SYSTEM_PROMPT = `
You are the COO (Chief Operating Officer) for House Al Nur, a multi-arm empire building organization.

Your personality:
- Direct and decisive. No fluff.
- You prioritize ruthlessly based on the House Al Nur vision and priority hierarchy
- You hold the founder accountable - if something is slipping, you call it out
- You execute. When asked to do something, you do it through tools.

You manage operations across the arms:
- Nova (Technology)
- Janna (Real Estate)
- Silk (E-Commerce)
- ATW (Media)
- OBX Music (Culture)
- House (Holding)
- Maison (Family Office)

Be concise. Execute actions through tools. Challenge when priorities seem misaligned with the vision.
`;

interface AgentInput {
  message: string;
  apiKey?: string;
  provider?: "openai" | "anthropic" | "gemini";
  context?: AgentContext;
}

export async function runAgent({ message, apiKey, provider, context }: AgentInput) {
  // Determine provider (explicit > env > default to anthropic)
  const selectedProvider = provider || process.env.AI_PROVIDER || "anthropic";

  if (selectedProvider === "gemini") {
    return runGemini(message, apiKey);
  }

  if (selectedProvider === "anthropic") {
    return runAnthropic(message, apiKey, context);
  }

  return runOpenAI(message, apiKey, context);
}

async function runOpenAI(message: string, userApiKey?: string, context?: AgentContext) {
  const apiKey = userApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key is not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      tools: AI_TOOLS,
      tool_choice: "auto",
    }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || "OpenAI error");
  }

  const assistantMessage = json.choices?.[0]?.message;
  const toolCalls = assistantMessage?.tool_calls || [];

  if (!toolCalls.length) {
    return { content: assistantMessage?.content || "No response", toolResults: [] };
  }

  const toolResults = [];
  const toolHandlers = buildToolHandlers(context);
  for (const call of toolCalls) {
    const toolName = call.function.name;
    const args = JSON.parse(call.function.arguments || "{}");
    const handler = toolHandlers[toolName];
    if (!handler) {
      toolResults.push({ tool: toolName, error: "Tool not found" });
      continue;
    }
    try {
      const result = await handler(args);
      toolResults.push({ tool: toolName, result });
    } catch (error) {
      toolResults.push({
        tool: toolName,
        error: error instanceof Error ? error.message : "Tool failed",
      });
    }
  }

  return {
    content: assistantMessage?.content || "Action executed.",
    toolResults,
  };
}

async function runAnthropic(message: string, userApiKey?: string, context?: AgentContext) {
  const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic API key is not configured");

  // Convert tools to Anthropic format
  const anthropicTools = AI_TOOLS.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: tool.function.parameters,
  }));

  // Initial message
  const messages: Array<{ role: string; content: any }> = [
    { role: "user", content: message }
  ];

  // Make the initial request
  let response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-opus-4-20250514",
      max_tokens: 2048,
      messages,
      system: SYSTEM_PROMPT,
      tools: anthropicTools,
    }),
  });

  let json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || "Anthropic error");
  }

  const toolResults: Array<{ tool: string; result?: unknown; error?: string }> = [];
  const toolHandlers = buildToolHandlers(context);
  
  // Loop to handle tool use (Claude may want to use multiple tools)
  let iterations = 0;
  const maxIterations = 5; // Prevent infinite loops

  while (json.stop_reason === "tool_use" && iterations < maxIterations) {
    iterations++;

    // Find all tool_use blocks in the response
    const toolUseBlocks = json.content?.filter((c: any) => c.type === "tool_use") || [];
    
    if (toolUseBlocks.length === 0) break;

    // Execute each tool
    const toolResultsForClaude: Array<{
      type: "tool_result";
      tool_use_id: string;
      content: string;
    }> = [];

    for (const toolBlock of toolUseBlocks) {
      const toolName = toolBlock.name;
      const toolId = toolBlock.id;
      const args = toolBlock.input || {};

      const handler = toolHandlers[toolName];
      if (!handler) {
        toolResults.push({ tool: toolName, error: "Tool not found" });
        toolResultsForClaude.push({
          type: "tool_result",
          tool_use_id: toolId,
          content: JSON.stringify({ error: "Tool not found" }),
        });
        continue;
      }

      try {
        const result = await handler(args);
        toolResults.push({ tool: toolName, result });
        toolResultsForClaude.push({
          type: "tool_result",
          tool_use_id: toolId,
          content: JSON.stringify(result),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Tool execution failed";
        toolResults.push({ tool: toolName, error: errorMessage });
        toolResultsForClaude.push({
          type: "tool_result",
          tool_use_id: toolId,
          content: JSON.stringify({ error: errorMessage }),
        });
      }
    }

    // Add assistant's response (with tool_use) and tool results to messages
    messages.push({ role: "assistant", content: json.content });
    messages.push({ role: "user", content: toolResultsForClaude });

    // Make another request with the tool results
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-opus-4-20250514",
        max_tokens: 2048,
        messages,
        system: SYSTEM_PROMPT,
        tools: anthropicTools,
      }),
    });

    json = await response.json();
    if (!response.ok) {
      throw new Error(json?.error?.message || "Anthropic error");
    }
  }

  // Extract final text response
  const textContent = json?.content?.find((c: any) => c.type === "text")?.text || 
    (toolResults.length > 0 ? "Actions completed." : "No response");

  return { content: textContent, toolResults };
}

async function runGemini(message: string, userApiKey?: string) {
  const apiKey = userApiKey || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("Google AI API key is not configured");

  const model = process.env.GEMINI_MODEL || "gemini-3-pro-preview";

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
            role: "user",
            parts: [{ text: `${SYSTEM_PROMPT}\n\n---\n\nUser: ${message}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    }
  );

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message || "Gemini error");
  }

  const content = json?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  return { content, toolResults: [] };
}
