/**
 * COO (Chief Operating Officer) Module
 * Priority engine powered by Opus + Gemini with Guru knowledge
 */

// Types
export * from './types';

// Knowledge
export {
  loadCOOKnowledge,
  formatKnowledgeForPrompt,
  getKnowledgeSummary,
  stripHtml,
  type COOKnowledge,
} from './knowledge';

// Models
export {
  callOpus,
  callGemini,
  callCOOModel,
  callWithFallback,
  parseJsonResponse,
  routeToModel,
  type COOTaskType,
  type COOModelResponse,
} from './models';

// Engine
export {
  generatePriorities,
  generateMorningBriefing,
  generateAccountabilityCheckin,
  generateEODSummary,
  fetchClickUpTasks,
  buildCOOContext,
} from './engine';

// Prompts (for testing/debugging)
export {
  buildPrioritySystemPrompt,
  buildPriorityUserPrompt,
  buildAccountabilitySystemPrompt,
  buildAccountabilityUserPrompt,
  buildEODSystemPrompt,
  buildEODUserPrompt,
  getMorningGreeting,
} from './prompts';
