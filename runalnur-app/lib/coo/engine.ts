/**
 * COO Core Engine
 * Orchestrates priority generation, accountability, and briefings
 */

import { getClickUpClientForUser } from '@/lib/clickup/client';
import { PRIORITY_FROM_CLICKUP, type ClickUpTask } from '@/lib/integrations/clickup';
import { loadCOOKnowledge, formatKnowledgeForPrompt, type COOKnowledge } from './knowledge';
import { callOpus, callWithFallback, parseJsonResponse } from './models';
import {
  buildPrioritySystemPrompt,
  buildPriorityUserPrompt,
  buildAccountabilitySystemPrompt,
  buildAccountabilityUserPrompt,
  buildEODSystemPrompt,
  buildEODUserPrompt,
  getMorningGreeting,
} from './prompts';
import type {
  COOPriorityItem,
  COOBriefing,
  COODaySummary,
  COOCheckin,
  COOTaskInput,
  COOContext,
} from './types';

/**
 * Convert ClickUp task to COO task input
 */
function clickUpTaskToCOOTask(task: ClickUpTask): COOTaskInput {
  const today = new Date();
  const dueDate = task.due_date ? new Date(parseInt(task.due_date)) : null;
  
  let daysUntilDue: number | undefined;
  let isOverdue = false;
  
  if (dueDate) {
    const diffTime = dueDate.getTime() - today.getTime();
    daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isOverdue = daysUntilDue < 0;
  }

  // Map ClickUp priority to our format
  const priorityNum = task.priority?.priority ? parseInt(task.priority.priority) : undefined;
  const priority = priorityNum ? PRIORITY_FROM_CLICKUP[priorityNum as keyof typeof PRIORITY_FROM_CLICKUP] : undefined;

  return {
    id: task.id,
    source: 'clickup',
    name: task.name,
    description: task.description || undefined,
    dueDate: dueDate ? dueDate.toISOString().split('T')[0] : undefined,
    priority: priority as 'critical' | 'high' | 'medium' | 'low' | undefined,
    status: task.status?.status,
    project: task.list?.name,
    armId: mapListToArm(task.list?.name, task.space?.name),
    isOverdue,
    daysUntilDue,
  };
}

/**
 * Map ClickUp list/space to House Al Nur arm
 */
function mapListToArm(listName?: string, spaceName?: string): string | undefined {
  const text = `${listName || ''} ${spaceName || ''}`.toLowerCase();
  
  if (text.includes('nova')) return 'nova';
  if (text.includes('janna')) return 'janna';
  if (text.includes('silk')) return 'silk';
  if (text.includes('atw')) return 'atw';
  if (text.includes('obx') || text.includes('music')) return 'obx';
  if (text.includes('house') || text.includes('operations')) return 'house';
  if (text.includes('maison')) return 'maison';
  
  return undefined;
}

/**
 * Fetch all tasks from ClickUp for a user
 */
export async function fetchClickUpTasks(tenantId: string, userId: string): Promise<COOTaskInput[]> {
  const result = await getClickUpClientForUser(tenantId, userId);
  
  if (!result) {
    console.warn('[COO Engine] No ClickUp client available');
    return [];
  }

  const { client } = result;

  try {
    // Get workspaces
    const { teams } = await client.getWorkspaces();
    
    if (!teams.length) {
      console.warn('[COO Engine] No ClickUp workspaces found');
      return [];
    }

    const allTasks: COOTaskInput[] = [];
    
    // For each workspace, get spaces, then folders, then lists, then tasks
    for (const team of teams) {
      const { spaces } = await client.getSpaces(team.id);
      
      for (const space of spaces) {
        // Get folder lists
        const { folders } = await client.getFolders(space.id);
        
        for (const folder of folders) {
          for (const list of folder.lists || []) {
            try {
              const { tasks } = await client.getTasks(list.id, { include_closed: false });
              
              for (const task of tasks) {
                allTasks.push(clickUpTaskToCOOTask(task));
              }
            } catch (err) {
              console.warn(`[COO Engine] Failed to fetch tasks from list ${list.id}:`, err);
            }
          }
        }
        
        // Get folderless lists
        try {
          const { lists } = await client.getFolderlessLists(space.id);
          
          for (const list of lists) {
            const { tasks } = await client.getTasks(list.id, { include_closed: false });
            
            for (const task of tasks) {
              allTasks.push(clickUpTaskToCOOTask(task));
            }
          }
        } catch (err) {
          console.warn(`[COO Engine] Failed to fetch folderless lists for space ${space.id}:`, err);
        }
      }
    }

    console.log(`[COO Engine] Fetched ${allTasks.length} tasks from ClickUp`);
    return allTasks;
  } catch (error) {
    console.error('[COO Engine] Error fetching ClickUp tasks:', error);
    return [];
  }
}

/**
 * Generate daily priorities
 */
export async function generatePriorities(
  tenantId: string,
  userId: string,
  options?: {
    maxPriorities?: number;
    additionalContext?: {
      completedToday?: string[];
      deferredTasks?: Array<{ title: string; deferCount: number }>;
      focusTimeToday?: number;
      relationshipFollowupsDueCount?: number;
    };
  }
): Promise<{
  priorities: COOPriorityItem[];
  recommendation: string;
  reasoning: string;
  knowledge: COOKnowledge | null;
} | null> {
  // Load knowledge
  const knowledge = await loadCOOKnowledge(tenantId, userId);
  
  if (!knowledge) {
    console.error('[COO Engine] Failed to load knowledge');
    return null;
  }

  // Fetch tasks
  const tasks = await fetchClickUpTasks(tenantId, userId);
  
  if (tasks.length === 0) {
    console.warn('[COO Engine] No tasks to prioritize');
    // Return empty priorities with a recommendation
    return {
      priorities: [],
      recommendation: 'No tasks found in ClickUp. Add tasks to get prioritized.',
      reasoning: 'No tasks available for prioritization.',
      knowledge,
    };
  }

  // Build prompts
  const systemPrompt = buildPrioritySystemPrompt(knowledge);
  const today = new Date().toISOString().split('T')[0];
  const userPrompt = buildPriorityUserPrompt(tasks, today, options?.additionalContext);

  // Call Opus for priority generation
  try {
    const response = await callOpus(systemPrompt, userPrompt, {
      tenantId,
      userId,
      maxTokens: 2000,
      temperature: 0.7,
    });

    const parsed = parseJsonResponse<{
      priorities: COOPriorityItem[];
      recommendation: string;
      reasoning: string;
    }>(response.content);

    if (!parsed) {
      console.error('[COO Engine] Failed to parse LLM response');
      return null;
    }

    // Ensure priorities have proper status
    const priorities = (parsed.priorities || [])
      .slice(0, options?.maxPriorities || 3)
      .map((p, i) => ({
        ...p,
        rank: i + 1,
        status: 'pending' as const,
      }));

    return {
      priorities,
      recommendation: parsed.recommendation || '',
      reasoning: parsed.reasoning || '',
      knowledge,
    };
  } catch (error) {
    console.error('[COO Engine] Error generating priorities:', error);
    return null;
  }
}

/**
 * Generate morning briefing
 */
export async function generateMorningBriefing(
  tenantId: string,
  userId: string,
  options?: {
    maxPriorities?: number;
  }
): Promise<COOBriefing | null> {
  const result = await generatePriorities(tenantId, userId, options);
  
  if (!result) {
    return null;
  }

  const now = new Date();

  return {
    date: now.toISOString().split('T')[0],
    greeting: getMorningGreeting(now),
    priorities: result.priorities,
    onRadar: {
      tasksDueThisWeek: 0, // TODO: Calculate from tasks
      tasksAtRisk: 0,
      relationshipsNeedingAttention: 0,
    },
    recommendation: result.recommendation,
    generatedAt: now.toISOString(),
    modelUsed: 'opus',
  };
}

/**
 * Generate accountability check-in
 */
export async function generateAccountabilityCheckin(
  userId: string,
  priorities: COOPriorityItem[],
  status: {
    completedCount: number;
    prioritiesTotal: number;
    currentFocus: string | null;
    focusTimeToday: number;
    hoursIntoDay: number;
    relationshipsNeedingAttention?: number;
  }
): Promise<COOCheckin | null> {
  const systemPrompt = buildAccountabilitySystemPrompt();
  const userPrompt = buildAccountabilityUserPrompt(priorities, status);

  try {
    // Use Gemini for accountability (with Opus fallback)
    const response = await callWithFallback('accountability', systemPrompt, userPrompt, {
      userId,
      maxTokens: 500,
      temperature: 0.8,
    });

    const parsed = parseJsonResponse<{
      message: string;
      tone: 'encouraging' | 'pushing' | 'direct' | 'concerned';
      nudge?: string;
    }>(response.content);

    if (!parsed) {
      // Fallback to raw message
      return {
        message: response.content,
        tone: 'direct',
        currentStatus: status,
        generatedAt: new Date().toISOString(),
      };
    }

    return {
      message: parsed.message,
      tone: parsed.tone,
      nudge: parsed.nudge,
      currentStatus: status,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[COO Engine] Error generating accountability check-in:', error);
    return null;
  }
}

/**
 * Generate end-of-day summary
 */
export async function generateEODSummary(
  userId: string,
  priorities: COOPriorityItem[],
  sessions: Array<{ title: string; duration: number; outcome: string }>,
  stats: {
    completedCount: number;
    deferredCount: number;
    totalFocusMinutes: number;
  }
): Promise<COODaySummary | null> {
  const systemPrompt = buildEODSystemPrompt();
  const userPrompt = buildEODUserPrompt(priorities, sessions, stats);

  try {
    // Use Gemini for EOD summary (with Opus fallback)
    const response = await callWithFallback('summary', systemPrompt, userPrompt, {
      userId,
      maxTokens: 800,
      temperature: 0.7,
    });

    const parsed = parseJsonResponse<{
      assessment: string;
      wins: string[];
      misses: string[];
      tomorrowFocus: string;
      pattern?: string;
    }>(response.content);

    if (!parsed) {
      return null;
    }

    const now = new Date();

    return {
      date: now.toISOString().split('T')[0],
      scorecard: {
        prioritiesCompleted: stats.completedCount,
        prioritiesTotal: priorities.length,
        completionRate: priorities.length > 0 ? Math.round((stats.completedCount / priorities.length) * 100) : 0,
        focusTimeMinutes: stats.totalFocusMinutes,
        deferredTasks: priorities.filter(p => p.status === 'deferred').map(p => p.title),
      },
      assessment: parsed.assessment,
      tomorrowPreview: [parsed.tomorrowFocus, ...(parsed.misses || []).slice(0, 2)],
      generatedAt: now.toISOString(),
    };
  } catch (error) {
    console.error('[COO Engine] Error generating EOD summary:', error);
    return null;
  }
}

/**
 * Build full COO context (for debugging/logging)
 */
export async function buildCOOContext(tenantId: string, userId: string): Promise<COOContext | null> {
  const knowledge = await loadCOOKnowledge(tenantId, userId);
  // NOTE: Callers must provide a tenantId when using ClickUp in multi-tenant mode.
  return knowledge
    ? {
        date: new Date().toISOString().split('T')[0],
        tasks: [],
        knowledge: {
          vision: knowledge.vision,
          principles: knowledge.principles,
          priorityHierarchy: knowledge.priorityHierarchy,
          currentPhase: knowledge.currentPhase,
          armContext: knowledge.armContext,
        },
        calendar: [], // TODO: Integrate calendar
        history: {
          completedToday: [],
          deferredTasks: [],
          focusTimeToday: 0,
          recentCompletionRate: 0,
        },
        preferences: {
          maxPriorities: 3,
          pushIntensity: 'medium',
        },
      }
    : null;
  
}
