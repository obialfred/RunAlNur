// House Al Nur Empire - Arms/Companies
export const ARMS = [
  {
    id: 'nova',
    name: 'Nova',
    slug: 'nova',
    description: 'Technology & Hardware',
    head: 'Nurullah',
    color: 'sapphire',
    colorClass: 'bg-blue-500',
    textColorClass: 'text-blue-500',
    borderColorClass: 'border-blue-500',
    icon: 'Cpu',
  },
  {
    id: 'janna',
    name: 'Janna',
    slug: 'janna',
    description: 'Real Estate & Development',
    head: 'Nurullah',
    color: 'emerald',
    colorClass: 'bg-emerald-500',
    textColorClass: 'text-emerald-500',
    borderColorClass: 'border-emerald-500',
    icon: 'Building2',
  },
  {
    id: 'silk',
    name: 'Silk',
    slug: 'silk',
    description: 'Luxury E-Commerce',
    head: 'Nurullah',
    color: 'gold',
    colorClass: 'bg-amber-500',
    textColorClass: 'text-amber-500',
    borderColorClass: 'border-amber-500',
    icon: 'ShoppingBag',
  },
  {
    id: 'atw',
    name: 'ATW',
    slug: 'atw',
    description: 'Media & Content',
    head: 'Nurullah',
    color: 'ruby',
    colorClass: 'bg-rose-500',
    textColorClass: 'text-rose-500',
    borderColorClass: 'border-rose-500',
    icon: 'Play',
  },
  {
    id: 'obx',
    name: 'OBX Music',
    slug: 'obx',
    description: 'Music & Audio',
    head: 'Nurullah',
    color: 'violet',
    colorClass: 'bg-violet-500',
    textColorClass: 'text-violet-500',
    borderColorClass: 'border-violet-500',
    icon: 'Music',
  },
  {
    id: 'house',
    name: 'House',
    slug: 'house',
    description: 'Holding & Operations',
    head: 'Nurullah',
    color: 'gold',
    colorClass: 'bg-yellow-600',
    textColorClass: 'text-yellow-600',
    borderColorClass: 'border-yellow-600',
    icon: 'Crown',
  },
  {
    id: 'maison',
    name: 'Maison',
    slug: 'maison',
    description: 'Family Office',
    head: 'Nurullah',
    color: 'slate',
    colorClass: 'bg-slate-500',
    textColorClass: 'text-slate-500',
    borderColorClass: 'border-slate-500',
    icon: 'Home',
  },
] as const;

export type ArmId = typeof ARMS[number]['id'];

// ClickUp Space name mapping (Arm ID -> ClickUp Space name)
export const CLICKUP_SPACE_MAP: Record<ArmId, string> = {
  nova: "Nova",
  janna: "Janna",
  silk: "", // Not in ClickUp yet
  atw: "Arabia & The World",
  obx: "OBX / Obi Alfred",
  house: "House Al Nur - Corporate",
  maison: "", // Not in ClickUp yet
};

// Project statuses
export const PROJECT_STATUSES = [
  { id: 'planning', name: 'Planning', color: 'bg-slate-500' },
  { id: 'in_progress', name: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', name: 'Under Review', color: 'bg-amber-500' },
  { id: 'completed', name: 'Completed', color: 'bg-emerald-500' },
  { id: 'on_hold', name: 'On Hold', color: 'bg-rose-500' },
] as const;

export type ProjectStatus = typeof PROJECT_STATUSES[number]['id'];

// Priority levels
export const PRIORITIES = [
  { id: 'critical', name: 'Critical', color: 'bg-red-500' },
  { id: 'high', name: 'High', color: 'bg-orange-500' },
  { id: 'medium', name: 'Medium', color: 'bg-yellow-500' },
  { id: 'low', name: 'Low', color: 'bg-green-500' },
] as const;

export type Priority = typeof PRIORITIES[number]['id'];

// Activity types
export const ACTIVITY_TYPES = [
  'project_created',
  'project_updated',
  'task_created',
  'task_completed',
  'contact_added',
  'sop_started',
  'sop_completed',
  'note_added',
  'status_changed',
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];

// Intelligence regions
export const INTEL_REGIONS = [
  { 
    id: 'gulf', 
    name: 'Gulf', 
    description: 'UAE, Saudi, Qatar, Kuwait, Bahrain, Oman',
    color: 'bg-amber-500',
    textColor: 'text-amber-500',
  },
  { 
    id: 'mena', 
    name: 'MENA', 
    description: 'Middle East & North Africa',
    color: 'bg-orange-500',
    textColor: 'text-orange-500',
  },
  { 
    id: 'america', 
    name: 'America', 
    description: 'United States & Americas',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
  },
  { 
    id: 'global', 
    name: 'Global', 
    description: 'Worldwide news',
    color: 'bg-slate-500',
    textColor: 'text-slate-500',
  },
  { 
    id: 'china', 
    name: 'China', 
    description: 'China & East Asia',
    color: 'bg-red-500',
    textColor: 'text-red-500',
  },
  { 
    id: 'russia', 
    name: 'Russia', 
    description: 'Russia & Eastern Europe',
    color: 'bg-purple-500',
    textColor: 'text-purple-500',
  },
] as const;

export type IntelRegionId = typeof INTEL_REGIONS[number]['id'];

// Intelligence sources configuration
export const INTEL_SOURCES = {
  // X (Twitter) accounts to monitor per region
  x_accounts: {
    gulf: ['UAE_BARQ', 'AlArabiya_Brk', 'GulfNews', 'AloloufyMohd'],
    mena: ['AJABreaking', 'MiddleEastEye', 'TheNationalUAE'],
    america: ['AP', 'Reuters', 'WSJ', 'business'],
    global: ['BBCBreaking', 'AFP', 'ReutersWorld'],
    china: ['SCMPNews', 'XHNews', 'ChinaDaily'],
    russia: ['taborsky_', 'RTcom', 'MoscowTimes'],
  },
  // News API search terms per region
  news_keywords: {
    gulf: ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Dubai', 'Abu Dhabi', 'GCC'],
    mena: ['Middle East', 'Arab', 'Egypt', 'Jordan', 'Lebanon', 'Morocco'],
    america: ['US economy', 'Federal Reserve', 'Wall Street', 'White House'],
    global: ['global economy', 'world news', 'international'],
    china: ['China', 'Beijing', 'Xi Jinping', 'Chinese economy', 'Hong Kong'],
    russia: ['Russia', 'Putin', 'Moscow', 'Ukraine', 'Kremlin'],
  },
  // RSS feeds per region
  rss_feeds: {
    gulf: [
      'https://www.arabianbusiness.com/rss/industry/gcc',
    ],
    mena: [
      'https://www.aljazeera.com/xml/rss/all.xml',
      'https://www.middleeasteye.net/rss',
    ],
    america: [
      'https://feeds.reuters.com/reuters/businessNews',
    ],
    global: [
      'https://feeds.bbci.co.uk/news/world/rss.xml',
    ],
    china: [
      'https://www.scmp.com/rss/91/feed',
    ],
    russia: [
      'https://www.themoscowtimes.com/rss/news',
    ],
  },
} as const;
