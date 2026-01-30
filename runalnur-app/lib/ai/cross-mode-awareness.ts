// AI Cross-Mode Awareness System
// Enables the AI advisor to understand context across all modes

import type { Mode } from "@/lib/mode/context";
import { calculateRelationshipHealth } from "@/lib/influence/decay";
import type { ContactWithStrength } from "@/lib/influence/decay";

export interface CrossModeContext {
  currentMode: Mode;
  command: {
    overdueTasksCount: number;
    pendingApprovalsCount: number;
    activeProjectsCount: number;
  };
  capital: {
    totalNav: number;
    liquidityLevel: number;
    upcomingCapitalCalls: {
      fundName: string;
      amount: number;
      dueDate: string;
    }[];
  };
  influence: {
    relationshipHealth: {
      overall: number;
      needsAttention: number;
    };
    upcomingMeetings: {
      contactName: string;
      datetime: string;
    }[];
    contactsNeedingAttention: {
      name: string;
      daysSince: number;
      strength: number;
    }[];
  };
}

export interface AIPromptContext {
  systemContext: string;
  userContext: string;
  suggestions: string[];
}

/**
 * Generate cross-mode context for AI prompts
 */
export function generateCrossModeContext(
  context: CrossModeContext
): AIPromptContext {
  const { currentMode, command, capital, influence } = context;

  // Build system context based on current state
  const systemContext = `You are the AI advisor for House Al Nur's Dynasty Operating System. 
The user is currently in ${currentMode.toUpperCase()} mode.

Current State Summary:
- Command: ${command.overdueTasksCount} overdue tasks, ${command.pendingApprovalsCount} pending approvals, ${command.activeProjectsCount} active projects
- Capital: NAV $${capital.totalNav.toLocaleString()}, Liquidity $${capital.liquidityLevel.toLocaleString()}, ${capital.upcomingCapitalCalls.length} upcoming capital calls
- Influence: Relationship health ${influence.relationshipHealth.overall}/100, ${influence.relationshipHealth.needsAttention} contacts need attention`;

  // Build user context with mode-specific focus
  let userContext = "";
  const suggestions: string[] = [];

  switch (currentMode) {
    case "command":
      userContext = buildCommandContext(command, capital, influence);
      suggestions.push(...generateCommandSuggestions(command, capital, influence));
      break;
    case "capital":
      userContext = buildCapitalContext(capital, command, influence);
      suggestions.push(...generateCapitalSuggestions(capital, influence));
      break;
    case "influence":
      userContext = buildInfluenceContext(influence, command);
      suggestions.push(...generateInfluenceSuggestions(influence));
      break;
  }

  return { systemContext, userContext, suggestions };
}

function buildCommandContext(
  command: CrossModeContext["command"],
  capital: CrossModeContext["capital"],
  influence: CrossModeContext["influence"]
): string {
  const parts: string[] = [];

  if (command.overdueTasksCount > 0) {
    parts.push(`You have ${command.overdueTasksCount} overdue tasks requiring attention.`);
  }
  if (command.pendingApprovalsCount > 0) {
    parts.push(`${command.pendingApprovalsCount} items in your inbox need approval.`);
  }
  if (capital.upcomingCapitalCalls.length > 0) {
    parts.push(`Reminder: ${capital.upcomingCapitalCalls.length} capital calls due soon.`);
  }
  if (influence.relationshipHealth.needsAttention > 0) {
    parts.push(`${influence.relationshipHealth.needsAttention} relationships need nurturing.`);
  }

  return parts.join(" ");
}

function buildCapitalContext(
  capital: CrossModeContext["capital"],
  command: CrossModeContext["command"],
  influence: CrossModeContext["influence"]
): string {
  const parts: string[] = [];

  parts.push(`Current NAV: $${capital.totalNav.toLocaleString()}`);
  parts.push(`Available liquidity: $${capital.liquidityLevel.toLocaleString()}`);

  if (capital.upcomingCapitalCalls.length > 0) {
    const totalDue = capital.upcomingCapitalCalls.reduce((sum, c) => sum + c.amount, 0);
    parts.push(`Capital calls due: $${totalDue.toLocaleString()}`);
  }

  return parts.join(". ");
}

function buildInfluenceContext(
  influence: CrossModeContext["influence"],
  command: CrossModeContext["command"]
): string {
  const parts: string[] = [];

  parts.push(`Relationship health score: ${influence.relationshipHealth.overall}/100`);

  if (influence.contactsNeedingAttention.length > 0) {
    const names = influence.contactsNeedingAttention
      .slice(0, 3)
      .map((c) => c.name)
      .join(", ");
    parts.push(`Contacts needing attention: ${names}`);
  }

  if (influence.upcomingMeetings.length > 0) {
    parts.push(`Upcoming meetings: ${influence.upcomingMeetings.length}`);
  }

  return parts.join(". ");
}

function generateCommandSuggestions(
  command: CrossModeContext["command"],
  capital: CrossModeContext["capital"],
  influence: CrossModeContext["influence"]
): string[] {
  const suggestions: string[] = [];

  if (command.overdueTasksCount > 0) {
    suggestions.push(`Review and address ${command.overdueTasksCount} overdue tasks`);
  }
  if (command.pendingApprovalsCount > 0) {
    suggestions.push(`Process ${command.pendingApprovalsCount} pending approvals`);
  }
  if (influence.relationshipHealth.overall < 70) {
    suggestions.push("Check Influence mode - relationship health is declining");
  }
  if (capital.upcomingCapitalCalls.length > 0) {
    suggestions.push("Verify liquidity for upcoming capital calls");
  }

  return suggestions;
}

function generateCapitalSuggestions(
  capital: CrossModeContext["capital"],
  influence: CrossModeContext["influence"]
): string[] {
  const suggestions: string[] = [];

  if (capital.upcomingCapitalCalls.length > 0) {
    const soonest = capital.upcomingCapitalCalls[0];
    suggestions.push(`Prepare for ${soonest.fundName} capital call: $${soonest.amount.toLocaleString()}`);
  }

  if (capital.liquidityLevel < 50000) {
    suggestions.push("Review liquidity position - consider rebalancing");
  }

  return suggestions;
}

function generateInfluenceSuggestions(
  influence: CrossModeContext["influence"]
): string[] {
  const suggestions: string[] = [];

  if (influence.contactsNeedingAttention.length > 0) {
    const urgent = influence.contactsNeedingAttention[0];
    suggestions.push(`Reach out to ${urgent.name} - last contact ${urgent.daysSince} days ago`);
  }

  if (influence.upcomingMeetings.length > 0) {
    const next = influence.upcomingMeetings[0];
    suggestions.push(`Prepare brief for meeting with ${next.contactName}`);
  }

  if (influence.relationshipHealth.overall < 60) {
    suggestions.push("Schedule time for relationship maintenance this week");
  }

  return suggestions;
}

/**
 * Generate relationship-specific nudge
 */
export function generateRelationshipNudge(
  contact: {
    name: string;
    daysSince: number;
    strength: number;
    company?: string;
  },
  currentMode: Mode
): string | null {
  // Only nudge if strength is below threshold
  if (contact.strength >= 70) return null;

  // Vary the message based on current mode
  switch (currentMode) {
    case "command":
      return `💡 Relationship reminder: ${contact.name}${contact.company ? ` (${contact.company})` : ""} hasn't been contacted in ${contact.daysSince} days. Relationship strength: ${contact.strength}/100.`;

    case "capital":
      if (contact.company) {
        return `Note: Your relationship with ${contact.name} at ${contact.company} could use attention (${contact.daysSince} days since last contact).`;
      }
      return null;

    case "influence":
      return `⚠️ ${contact.name} needs attention: ${contact.daysSince} days since last contact, strength at ${contact.strength}/100. Consider reaching out this week.`;

    default:
      return null;
  }
}

/**
 * Generate meeting prep reminder
 */
export function generateMeetingPrepReminder(
  meeting: {
    contactName: string;
    datetime: string;
    contactStrength?: number;
  },
  hoursUntil: number
): string | null {
  if (hoursUntil > 24) return null;

  const strengthWarning =
    meeting.contactStrength && meeting.contactStrength < 70
      ? ` Note: Relationship strength is at ${meeting.contactStrength}/100.`
      : "";

  if (hoursUntil <= 1) {
    return `🔔 Meeting with ${meeting.contactName} starts in less than an hour.${strengthWarning} Open meeting brief?`;
  }

  if (hoursUntil <= 4) {
    return `📋 Meeting with ${meeting.contactName} in ${Math.round(hoursUntil)} hours.${strengthWarning} Review talking points?`;
  }

  return `⏰ Upcoming: ${meeting.contactName} meeting in ${Math.round(hoursUntil)} hours.${strengthWarning}`;
}
