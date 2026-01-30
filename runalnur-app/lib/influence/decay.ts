// Relationship Decay Engine
// Calculates relationship strength based on contact frequency and strategic importance

export interface ContactWithStrength {
  id: string;
  name: string;
  strategicTier: "inner_circle" | "strategic" | "general";
  lastContactedAt: string | null;
  idealContactFrequency: number; // days
  baseStrength: number; // original strength when set
  currentStrength?: number; // calculated strength
}

export interface DecayConfig {
  // Minimum strength (even completely neglected relationships don't go to 0)
  minStrength: number;
  // Days after ideal frequency when decay starts being aggressive
  gracePeriodDays: number;
  // Multipliers for tier importance (affects how much we care about decay)
  tierMultipliers: {
    inner_circle: number;
    strategic: number;
    general: number;
  };
}

const DEFAULT_CONFIG: DecayConfig = {
  minStrength: 10,
  gracePeriodDays: 7, // 7 days grace after ideal frequency
  tierMultipliers: {
    inner_circle: 1.5, // More aggressive decay for inner circle
    strategic: 1.2,
    general: 1.0,
  },
};

/**
 * Calculate current relationship strength based on time since last contact
 * 
 * Formula:
 * - At or before ideal frequency: strength stays at base
 * - After ideal frequency: strength decays exponentially
 * - At 2x ideal frequency: ~50% of base strength
 * - Never goes below minStrength
 */
export function calculateCurrentStrength(
  contact: ContactWithStrength,
  config: DecayConfig = DEFAULT_CONFIG
): number {
  if (!contact.lastContactedAt) {
    // Never contacted - use a conservative default
    return Math.max(config.minStrength, contact.baseStrength * 0.5);
  }

  const now = new Date();
  const lastContact = new Date(contact.lastContactedAt);
  const daysSinceContact = Math.floor(
    (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)
  );

  const { idealContactFrequency, baseStrength, strategicTier } = contact;
  const { minStrength, gracePeriodDays, tierMultipliers } = config;

  // No decay within ideal frequency + grace period
  if (daysSinceContact <= idealContactFrequency + gracePeriodDays) {
    return baseStrength;
  }

  // Calculate days of decay
  const daysOfDecay = daysSinceContact - idealContactFrequency - gracePeriodDays;
  
  // Decay factor: exponential decay
  // At 2x ideal frequency, we want ~50% decay
  // decay_half_life = ideal_frequency
  const halfLife = idealContactFrequency;
  const decayFactor = Math.pow(0.5, daysOfDecay / halfLife);

  // Apply tier multiplier (higher tiers decay "faster" in terms of urgency)
  const tierMultiplier = tierMultipliers[strategicTier];
  const adjustedDecay = Math.pow(decayFactor, tierMultiplier);

  // Calculate new strength
  let newStrength = baseStrength * adjustedDecay;
  
  // Clamp to minimum
  newStrength = Math.max(minStrength, newStrength);
  
  // Clamp to maximum (shouldn't exceed base)
  newStrength = Math.min(baseStrength, newStrength);

  return Math.round(newStrength);
}

/**
 * Get contacts that need attention based on current strength threshold
 */
export function getContactsNeedingAttention(
  contacts: ContactWithStrength[],
  threshold: number = 70,
  config: DecayConfig = DEFAULT_CONFIG
): ContactWithStrength[] {
  return contacts
    .map((contact) => ({
      ...contact,
      currentStrength: calculateCurrentStrength(contact, config),
    }))
    .filter((contact) => contact.currentStrength! < threshold)
    .sort((a, b) => {
      // Sort by tier first (inner_circle most urgent)
      const tierOrder = { inner_circle: 0, strategic: 1, general: 2 };
      const tierDiff = tierOrder[a.strategicTier] - tierOrder[b.strategicTier];
      if (tierDiff !== 0) return tierDiff;
      
      // Then by strength (lowest first)
      return (a.currentStrength || 0) - (b.currentStrength || 0);
    });
}

/**
 * Calculate aggregate relationship health score
 */
export function calculateRelationshipHealth(
  contacts: ContactWithStrength[],
  config: DecayConfig = DEFAULT_CONFIG
): {
  overall: number;
  byTier: {
    inner_circle: { score: number; count: number };
    strategic: { score: number; count: number };
    general: { score: number; count: number };
  };
  needsAttention: number;
} {
  const withStrength = contacts.map((contact) => ({
    ...contact,
    currentStrength: calculateCurrentStrength(contact, config),
  }));

  const tiers = ["inner_circle", "strategic", "general"] as const;
  const byTier = {} as {
    inner_circle: { score: number; count: number };
    strategic: { score: number; count: number };
    general: { score: number; count: number };
  };

  for (const tier of tiers) {
    const tierContacts = withStrength.filter((c) => c.strategicTier === tier);
    const count = tierContacts.length;
    const totalStrength = tierContacts.reduce(
      (sum, c) => sum + (c.currentStrength || 0),
      0
    );
    byTier[tier] = {
      score: count > 0 ? Math.round(totalStrength / count) : 100,
      count,
    };
  }

  // Weight overall score by tier importance
  const weights = { inner_circle: 0.4, strategic: 0.35, general: 0.25 };
  let weightedSum = 0;
  let totalWeight = 0;

  for (const tier of tiers) {
    if (byTier[tier].count > 0) {
      weightedSum += byTier[tier].score * weights[tier];
      totalWeight += weights[tier];
    }
  }

  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 100;
  const needsAttention = withStrength.filter((c) => (c.currentStrength || 0) < 70).length;

  return { overall, byTier, needsAttention };
}

/**
 * Get days until a contact needs attention (crosses threshold)
 */
export function getDaysUntilAttentionNeeded(
  contact: ContactWithStrength,
  threshold: number = 70,
  config: DecayConfig = DEFAULT_CONFIG
): number | null {
  if (!contact.lastContactedAt) return 0;

  const currentStrength = calculateCurrentStrength(contact, config);
  if (currentStrength < threshold) return 0;

  // Binary search for when strength crosses threshold
  const now = new Date();
  const lastContact = new Date(contact.lastContactedAt);
  
  let low = 0;
  let high = 365; // Max 1 year lookahead
  
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const futureDate = new Date(now.getTime() + mid * 24 * 60 * 60 * 1000);
    const futureContact = {
      ...contact,
      lastContactedAt: contact.lastContactedAt,
    };
    
    // Temporarily adjust the "now" for calculation
    const daysSince = Math.floor(
      (futureDate.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Recalculate with simulated time
    const simulatedStrength = calculateStrengthAtDays(contact, daysSince, config);
    
    if (simulatedStrength >= threshold) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low > 0 ? low : null;
}

function calculateStrengthAtDays(
  contact: ContactWithStrength,
  daysSinceContact: number,
  config: DecayConfig
): number {
  const { idealContactFrequency, baseStrength, strategicTier } = contact;
  const { minStrength, gracePeriodDays, tierMultipliers } = config;

  if (daysSinceContact <= idealContactFrequency + gracePeriodDays) {
    return baseStrength;
  }

  const daysOfDecay = daysSinceContact - idealContactFrequency - gracePeriodDays;
  const halfLife = idealContactFrequency;
  const decayFactor = Math.pow(0.5, daysOfDecay / halfLife);
  const tierMultiplier = tierMultipliers[strategicTier];
  const adjustedDecay = Math.pow(decayFactor, tierMultiplier);

  let newStrength = baseStrength * adjustedDecay;
  newStrength = Math.max(minStrength, newStrength);
  newStrength = Math.min(baseStrength, newStrength);

  return Math.round(newStrength);
}

/**
 * Suggest optimal contact frequency based on tier and relationship importance
 */
export function suggestContactFrequency(
  tier: "inner_circle" | "strategic" | "general"
): number {
  const frequencies = {
    inner_circle: 14, // Every 2 weeks
    strategic: 30, // Monthly
    general: 60, // Every 2 months
  };
  return frequencies[tier];
}

/**
 * Get engagement suggestion based on contact and situation
 */
export function getEngagementSuggestion(
  contact: ContactWithStrength & { notes?: string; company?: string }
): string {
  const daysSince = contact.lastContactedAt
    ? Math.floor(
        (new Date().getTime() - new Date(contact.lastContactedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 999;

  if (daysSince > 90) {
    return "Re-establish contact - it's been a while";
  }

  if (contact.strategicTier === "inner_circle") {
    if (daysSince > 14) return "Schedule a catch-up call or coffee";
    return "Quick check-in message";
  }

  if (contact.strategicTier === "strategic") {
    if (daysSince > 30) return "Share a relevant article or update";
    return "Brief check-in or congratulate recent news";
  }

  return "Casual touchpoint - comment on social media or send brief note";
}
