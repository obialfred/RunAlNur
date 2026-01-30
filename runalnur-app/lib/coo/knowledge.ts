/**
 * COO Knowledge Loader
 * Fetches and parses House Al Nur knowledge from Guru for use in priority generation
 */

import { GuruClient, getGuruClient, type GuruCard } from '@/lib/integrations/guru';
import { getApiKey } from '@/lib/integrations/user-credentials';

/**
 * Structured knowledge for COO context
 */
export interface COOKnowledge {
  vision: string;
  missionStatement: string;
  principles: string[];
  priorityHierarchy: string[];
  redLines: string[];
  currentPhase: string;
  armContext: Record<string, string>;
  lastUpdated: string;
}

/**
 * Raw card data organized by collection
 */
interface OrganizedCards {
  vision: GuruCard[];
  principles: GuruCard[];
  arms: GuruCard[];
  arabia: GuruCard[];
  currentPhase: GuruCard[];
  other: GuruCard[];
}

/**
 * Strip HTML tags and clean content for LLM consumption
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  return html
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Decode common entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    // Collapse multiple spaces/newlines
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract bullet points from HTML content
 */
export function extractBulletPoints(html: string): string[] {
  if (!html) return [];
  
  const points: string[] = [];
  
  // Match <li> content
  const liMatches = html.match(/<li[^>]*>(.*?)<\/li>/gi);
  if (liMatches) {
    for (const li of liMatches) {
      const text = stripHtml(li);
      if (text) points.push(text);
    }
  }
  
  return points;
}

/**
 * Organize cards by House Al Nur collection
 */
function organizeCards(cards: GuruCard[]): OrganizedCards {
  const organized: OrganizedCards = {
    vision: [],
    principles: [],
    arms: [],
    arabia: [],
    currentPhase: [],
    other: [],
  };

  for (const card of cards) {
    const collectionName = card.collection?.name || '';
    
    if (collectionName.includes('Vision')) {
      organized.vision.push(card);
    } else if (collectionName.includes('Principles')) {
      organized.principles.push(card);
    } else if (collectionName.includes('Arms')) {
      organized.arms.push(card);
    } else if (collectionName.includes('Arabia')) {
      organized.arabia.push(card);
    } else if (collectionName.includes('Current Phase')) {
      organized.currentPhase.push(card);
    } else {
      organized.other.push(card);
    }
  }

  return organized;
}

/**
 * Find a card by title (case-insensitive partial match)
 */
function findCard(cards: GuruCard[], titlePart: string): GuruCard | undefined {
  const lower = titlePart.toLowerCase();
  return cards.find(c => c.preferredPhrase.toLowerCase().includes(lower));
}

/**
 * Build structured knowledge from organized cards
 */
function buildKnowledge(organized: OrganizedCards): COOKnowledge {
  // Extract vision
  const metaGoalCard = findCard(organized.vision, 'Meta-Goal');
  const missionCard = findCard(organized.vision, 'Mission Statement');
  const dynastyCard = findCard(organized.vision, 'Dynasty');
  
  // Extract principles
  const worldviewCard = findCard(organized.principles, 'Core Worldview');
  const priorityCard = findCard(organized.principles, 'Priority Hierarchy');
  
  // Extract current phase
  const whereWeAreCard = findCard(organized.currentPhase, 'Where We Are Now');
  const beingBuiltCard = findCard(organized.currentPhase, 'What Is Being Built');
  
  // Build arm context
  const armContext: Record<string, string> = {};
  const armNames = ['Nova', 'Janna', 'Silk', 'ATW', 'OBX', 'Maison', 'Nurullah'];
  
  for (const armName of armNames) {
    const armCard = organized.arms.find(c => 
      c.preferredPhrase.toLowerCase().includes(armName.toLowerCase())
    );
    if (armCard) {
      armContext[armName.toLowerCase()] = stripHtml(armCard.content).slice(0, 500);
    }
  }

  // Extract priority hierarchy as bullet points
  let priorityHierarchy: string[] = [];
  let redLines: string[] = [];
  
  if (priorityCard) {
    const content = priorityCard.content;
    
    // Try to extract Priority Order section
    const priorityMatch = content.match(/<h3>Priority Order<\/h3>([\s\S]*?)<h3>/i);
    if (priorityMatch) {
      priorityHierarchy = extractBulletPoints(priorityMatch[1]);
    }
    
    // Try to extract Red Lines section
    const redLinesMatch = content.match(/<h3>Red Lines<\/h3>([\s\S]*?)(<h3>|$)/i);
    if (redLinesMatch) {
      redLines = extractBulletPoints(redLinesMatch[1]);
    }
  }

  // Extract principles from worldview
  let principles: string[] = [];
  if (worldviewCard) {
    principles = extractBulletPoints(worldviewCard.content);
    if (principles.length === 0) {
      // Fallback: use first 500 chars of stripped content
      principles = [stripHtml(worldviewCard.content).slice(0, 500)];
    }
  }

  return {
    vision: metaGoalCard ? stripHtml(metaGoalCard.content) : '',
    missionStatement: missionCard ? stripHtml(missionCard.content) : '',
    principles,
    priorityHierarchy,
    redLines,
    currentPhase: whereWeAreCard ? stripHtml(whereWeAreCard.content) : '',
    armContext,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get a Guru client for a specific user
 */
async function getClientForUser(tenantId: string, userId: string): Promise<GuruClient | null> {
  // Try user's stored credentials first
  const credentials = await getApiKey(tenantId, userId, 'guru');
  if (credentials) {
    return new GuruClient(credentials);
  }
  
  // Env fallback is DEMO_MODE only (never in production).
  return process.env.DEMO_MODE === "true" ? getGuruClient() : null;
}

/**
 * Load all House Al Nur knowledge for COO context
 */
export async function loadCOOKnowledge(tenantId: string, userId: string): Promise<COOKnowledge | null> {
  const client = await getClientForUser(tenantId, userId);
  if (!client) {
    console.warn('[COO Knowledge] No Guru client available');
    return null;
  }

  try {
    // Fetch all cards
    const allCards = await client.getAllCards();
    
    // Filter to House Al Nur cards only
    const houseAlNurCards = allCards.filter(card => 
      card.collection?.name?.includes('House Al Nur')
    );

    if (houseAlNurCards.length === 0) {
      console.warn('[COO Knowledge] No House Al Nur cards found in Guru');
      return null;
    }

    console.log(`[COO Knowledge] Loaded ${houseAlNurCards.length} House Al Nur cards`);

    // Organize and build knowledge
    const organized = organizeCards(houseAlNurCards);
    const knowledge = buildKnowledge(organized);

    return knowledge;
  } catch (error) {
    console.error('[COO Knowledge] Error loading knowledge:', error);
    return null;
  }
}

/**
 * Get a summary of knowledge for logging/debugging
 */
export function getKnowledgeSummary(knowledge: COOKnowledge): string {
  return `
Vision: ${knowledge.vision.slice(0, 100)}...
Mission: ${knowledge.missionStatement.slice(0, 100)}...
Principles: ${knowledge.principles.length} items
Priority Hierarchy: ${knowledge.priorityHierarchy.length} items
Red Lines: ${knowledge.redLines.length} items
Current Phase: ${knowledge.currentPhase.slice(0, 100)}...
Arms: ${Object.keys(knowledge.armContext).join(', ')}
  `.trim();
}

/**
 * Format knowledge for LLM prompt injection
 */
export function formatKnowledgeForPrompt(knowledge: COOKnowledge): string {
  const sections: string[] = [];

  if (knowledge.vision) {
    sections.push(`## VISION\n${knowledge.vision}`);
  }

  if (knowledge.missionStatement) {
    sections.push(`## MISSION\n${knowledge.missionStatement}`);
  }

  if (knowledge.priorityHierarchy.length > 0) {
    sections.push(`## PRIORITY HIERARCHY\n${knowledge.priorityHierarchy.map((p, i) => `${i + 1}. ${p}`).join('\n')}`);
  }

  if (knowledge.principles.length > 0) {
    sections.push(`## CORE PRINCIPLES\n${knowledge.principles.map(p => `- ${p}`).join('\n')}`);
  }

  if (knowledge.redLines.length > 0) {
    sections.push(`## RED LINES (Never Compromise)\n${knowledge.redLines.map(r => `- ${r}`).join('\n')}`);
  }

  if (knowledge.currentPhase) {
    sections.push(`## CURRENT PHASE\n${knowledge.currentPhase}`);
  }

  if (Object.keys(knowledge.armContext).length > 0) {
    const armTexts = Object.entries(knowledge.armContext)
      .map(([arm, context]) => `### ${arm.toUpperCase()}\n${context}`)
      .join('\n\n');
    sections.push(`## ARMS CONTEXT\n${armTexts}`);
  }

  return sections.join('\n\n---\n\n');
}
