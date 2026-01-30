/**
 * COO Model Clients
 * Opus 4.5 for strategic reasoning, Gemini for accountability/push messaging
 */

import { getApiKey } from '@/lib/integrations/user-credentials';

// Response types
export interface COOModelResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface COOPriorityResponse {
  priorities: Array<{
    rank: number;
    taskId: string | null;
    title: string;
    reasoning: string;
    effort: string;
    guruContext: string[];
  }>;
  recommendation: string;
  reasoning: string;
}

export interface COOAccountabilityResponse {
  message: string;
  tone: 'encouraging' | 'pushing' | 'direct' | 'concerned';
  nudge?: string;
}

// Model configuration
const OPUS_MODEL = 'claude-sonnet-4-20250514'; // Opus 4.5
const GEMINI_MODEL = 'gemini-3-pro-preview'; // Gemini 3 Pro

/**
 * Call Anthropic Claude (Opus) for strategic reasoning
 */
export async function callOpus(
  systemPrompt: string,
  userMessage: string,
  options?: {
    tenantId?: string;
    userId?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<COOModelResponse> {
  // Get API key - user's key or env var
  let apiKey: string | null = null;
  
  if (options?.tenantId && options?.userId) {
    apiKey = await getApiKey(options.tenantId, options.userId, 'anthropic');
  }
  
  if (!apiKey) {
    apiKey = process.env.ANTHROPIC_API_KEY || null;
  }
  
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: OPUS_MODEL,
      max_tokens: options?.maxTokens || 2000,
      temperature: options?.temperature ?? 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ],
    }),
  });

  const json = await response.json();
  
  if (!response.ok) {
    const error = json?.error?.message || `Anthropic API error: ${response.status}`;
    console.error('[Opus] API Error:', error);
    throw new Error(error);
  }

  const content = json?.content?.[0]?.text || '';
  
  return {
    content,
    model: OPUS_MODEL,
    usage: {
      inputTokens: json?.usage?.input_tokens || 0,
      outputTokens: json?.usage?.output_tokens || 0,
    },
  };
}

/**
 * Call Google Gemini for accountability/push messaging
 */
export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  options?: {
    tenantId?: string;
    userId?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<COOModelResponse> {
  // Get API key - user's key or env var
  let apiKey: string | null = null;
  
  if (options?.tenantId && options?.userId) {
    // Try to get user's Google AI key
    apiKey = await getApiKey(options.tenantId, options.userId, 'gemini');
  }
  
  if (!apiKey) {
    apiKey = process.env.GOOGLE_AI_API_KEY || null;
  }
  
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  // Gemini API endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\n${userMessage}` }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: options?.maxTokens || 1000,
        temperature: options?.temperature ?? 0.8,
      },
    }),
  });

  const json = await response.json();
  
  if (!response.ok) {
    const error = json?.error?.message || `Gemini API error: ${response.status}`;
    console.error('[Gemini] API Error:', error);
    throw new Error(error);
  }

  const content = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  return {
    content,
    model: GEMINI_MODEL,
    usage: {
      inputTokens: json?.usageMetadata?.promptTokenCount || 0,
      outputTokens: json?.usageMetadata?.candidatesTokenCount || 0,
    },
  };
}

/**
 * Parse JSON from model response (handles markdown code blocks)
 */
export function parseJsonResponse<T>(content: string): T | null {
  try {
    // Try direct parse first
    return JSON.parse(content) as T;
  } catch {
    // Try to extract from markdown code block
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim()) as T;
      } catch {
        // Continue to next attempt
      }
    }
    
    // Try to find JSON object in content
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]) as T;
      } catch {
        // Continue to next attempt
      }
    }
    
    console.error('[Model] Failed to parse JSON from response:', content.slice(0, 200));
    return null;
  }
}

/**
 * Route to appropriate model based on task type
 */
export type COOTaskType = 'prioritize' | 'briefing' | 'accountability' | 'checkin' | 'summary';

export function routeToModel(taskType: COOTaskType): 'opus' | 'gemini' {
  switch (taskType) {
    case 'prioritize':
    case 'briefing':
      return 'opus'; // Strategic, needs deep reasoning
    case 'accountability':
    case 'checkin':
    case 'summary':
      return 'gemini'; // Direct, pushing, evaluative
    default:
      return 'opus';
  }
}

/**
 * Call the appropriate model based on task type
 */
export async function callCOOModel(
  taskType: COOTaskType,
  systemPrompt: string,
  userMessage: string,
  options?: {
    tenantId?: string;
    userId?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<COOModelResponse> {
  const model = routeToModel(taskType);
  
  if (model === 'gemini') {
    return callGemini(systemPrompt, userMessage, options);
  }
  
  return callOpus(systemPrompt, userMessage, options);
}

/**
 * Fallback: If Gemini fails, fall back to Opus
 */
export async function callWithFallback(
  taskType: COOTaskType,
  systemPrompt: string,
  userMessage: string,
  options?: {
    tenantId?: string;
    userId?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<COOModelResponse> {
  const primaryModel = routeToModel(taskType);
  
  try {
    if (primaryModel === 'gemini') {
      return await callGemini(systemPrompt, userMessage, options);
    }
    return await callOpus(systemPrompt, userMessage, options);
  } catch (error) {
    console.warn(`[COO] ${primaryModel} failed, falling back to opus:`, error);
    
    // Always fall back to Opus
    if (primaryModel === 'gemini') {
      return await callOpus(systemPrompt, userMessage, options);
    }
    
    // If Opus also failed, throw
    throw error;
  }
}
