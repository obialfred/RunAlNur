/**
 * House Al Nur - Complete ClickUp Structure Specification
 * 
 * This file contains the entire folder/list/task structure for the
 * House Al Nur ClickUp workspace, ready for automated setup.
 */

export interface TaskSpec {
  name: string;
  description?: string;
  priority?: 1 | 2 | 3 | 4; // 1=Urgent, 2=High, 3=Normal, 4=Low
}

export interface ListSpec {
  name: string;
  tasks: TaskSpec[];
}

export interface FolderSpec {
  name: string;
  lists: ListSpec[];
}

export interface SpaceSpec {
  name: string;
  folders: FolderSpec[];
}

// =============================================================================
// HOUSE AL NŪR – CORPORATE (HQ OS)
// =============================================================================
const corporateSpace: SpaceSpec = {
  name: "House Al Nur - Corporate",
  folders: [
    {
      name: "00 Command Center",
      lists: [
        {
          name: "House Roadmap",
          tasks: [
            { name: "House OS v1: ClickUp + Process Street + Guru" },
            { name: "HubSpot CRM setup: pipelines + properties" },
            { name: "Router page plan (bio → all arms)" },
            { name: "Weekly operating rhythm (Sunday planning + KPI review)" },
            { name: "Casablanca 24-unit program master plan" },
          ],
        },
        {
          name: "KPI Scoreboard",
          tasks: [
            { name: "House — Saves/week" },
            { name: "House — Shares/week" },
            { name: "House — Inbound/week" },
            { name: "House — Hires/month" },
            { name: "House — LOIs signed/month" },
            { name: "House — Presales/month" },
            { name: "Nurullah — Saves/week" },
            { name: "Nurullah — Shares/week" },
            { name: "Nurullah — Email/SMS growth/week" },
            { name: "Nurullah — Profile visits/week" },
          ],
        },
        {
          name: "Weekly Exec Briefs",
          tasks: [],
        },
      ],
    },
    {
      name: "01 Finance",
      lists: [
        {
          name: "Monthly Close (All Entities)",
          tasks: [
            { name: "Monthly Close — House" },
            { name: "Monthly Close — Nova" },
            { name: "Monthly Close — Janna" },
            { name: "Monthly Close — ATW" },
            { name: "Monthly Close — OBX" },
          ],
        },
        {
          name: "AP / Bill Pay",
          tasks: [],
        },
        {
          name: "Treasury / Cash & Banking",
          tasks: [],
        },
      ],
    },
    {
      name: "02 Legal & Governance",
      lists: [
        {
          name: "Contracts",
          tasks: [
            { name: "Contract intake → review → signature workflow v1" },
            { name: "Standard vendor contract template (Morocco)" },
            { name: "Standard investor LOI template (Janna)" },
          ],
        },
        {
          name: "Entity / SPV Management",
          tasks: [],
        },
        {
          name: "Board / Decisions Log",
          tasks: [],
        },
      ],
    },
    {
      name: "03 People Ops",
      lists: [
        {
          name: "Hiring Pipeline",
          tasks: [
            { name: "Ops assistant (generalist) — JD" },
            { name: "Janna owner's rep / CM — JD" },
            { name: "Nova engineering lead — JD" },
          ],
        },
        {
          name: "Onboarding / Offboarding",
          tasks: [],
        },
      ],
    },
    {
      name: "04 Security & IT",
      lists: [
        {
          name: "Access & Permissions",
          tasks: [
            { name: "MFA on all core accounts" },
            { name: "Password manager rollout" },
            { name: "Access rules: Nova vs Janna vs OBX" },
          ],
        },
        {
          name: "Devices / Backups / Risk",
          tasks: [],
        },
      ],
    },
    {
      name: "05 Reporting & Proof",
      lists: [
        {
          name: "Monthly Impact Capsule",
          tasks: [],
        },
        {
          name: "Quarterly Letter",
          tasks: [
            { name: "Quarterly Letter — Template" },
            { name: 'Quarterly "by the numbers" — Template' },
          ],
        },
        {
          name: "Annual State of House",
          tasks: [],
        },
      ],
    },
    {
      name: "06 Partnerships / Press",
      lists: [
        {
          name: "Partnerships & Capital",
          tasks: [],
        },
        {
          name: "Press & Speaking",
          tasks: [],
        },
      ],
    },
  ],
};

// =============================================================================
// NOVA SPACE
// =============================================================================
const novaSpace: SpaceSpec = {
  name: "Nova",
  folders: [
    {
      name: "Product & Engineering",
      lists: [
        {
          name: "Nova – Current Projects",
          tasks: [
            { name: "Nova OS priorities Q1 2026" },
            { name: "Nova website/store structure finalize" },
            { name: "Nova icon pack system plan" },
          ],
        },
        {
          name: "Nova OS",
          tasks: [
            { name: "Language/locale strategy" },
            { name: "COSMIC shell polish (roundness + animations)" },
            { name: "Swift + Rust app conventions doc" },
            { name: "Android container performance baseline" },
          ],
        },
        {
          name: "Developer Program",
          tasks: [],
        },
      ],
    },
    {
      name: "Launches",
      lists: [
        {
          name: "Studio Pro Gen1 Launch",
          tasks: [
            { name: "Studio Pro SKUs + pricing doc" },
            { name: "Configurator spec" },
            { name: "Landing page v1" },
            { name: "Launch timeline (T-21/T-14/T-7/etc.)" },
            { name: "Support FAQ for launch day" },
          ],
        },
        {
          name: "Website & Store",
          tasks: [],
        },
      ],
    },
    {
      name: "GTM",
      lists: [
        {
          name: "Nova Marketing & Funnels",
          tasks: [
            { name: "Waitlist form plan" },
            { name: "Welcome sequence (3 emails)" },
            { name: "Launch sequence (5 emails)" },
            { name: '"Nova Notes" monthly newsletter plan' },
          ],
        },
        {
          name: "Enterprise / Gov Pipeline",
          tasks: [],
        },
      ],
    },
    {
      name: "Support",
      lists: [
        {
          name: "Support & FAQ",
          tasks: [],
        },
      ],
    },
  ],
};

// =============================================================================
// JANNA SPACE
// =============================================================================
const jannaSpace: SpaceSpec = {
  name: "Janna",
  folders: [
    {
      name: "Deal Flow",
      lists: [
        {
          name: "Deals & Diligence",
          tasks: [
            { name: "C24 — 24-unit value-add — initial underwriting" },
            { name: "Rent comps research — target tenant & pricing" },
            { name: "Seller/broker outreach pipeline" },
          ],
        },
        {
          name: "Investor / Partner Pipeline",
          tasks: [],
        },
      ],
    },
    {
      name: "Projects",
      lists: [
        {
          name: "Casablanca Projects",
          tasks: [
            { name: "C24 — DD phase (structure/MEP/site)" },
            { name: "C24 — Design phase (arch + interiors)" },
            { name: "C24 — Permitting phase" },
            { name: "C24 — Construction phase" },
            { name: "C24 — Punchlist & QA" },
            { name: "C24 — Lease-up launch" },
          ],
        },
        {
          name: "Permits & Compliance",
          tasks: [],
        },
      ],
    },
    {
      name: "Operations",
      lists: [
        {
          name: "Lease-Up & Operations",
          tasks: [
            { name: "Tenant screening standard (docs + rules)" },
            { name: "Rent pricing matrix" },
            { name: "Marketing photos + floorplans plan" },
            { name: "Maintenance + cleaning plan" },
            { name: "Utilities/meters plan" },
          ],
        },
        {
          name: "Maintenance / Vendors",
          tasks: [],
        },
      ],
    },
    {
      name: "Bench",
      lists: [
        {
          name: "Vendor Bench (Architect/BET/GC/etc.)",
          tasks: [
            { name: "Architect shortlist" },
            { name: "Structural engineer shortlist" },
            { name: "MEP shortlist" },
            { name: "GC shortlist" },
            { name: "Owner's rep shortlist" },
          ],
        },
      ],
    },
  ],
};

// =============================================================================
// ARABIA & THE WORLD SPACE
// =============================================================================
const atwSpace: SpaceSpec = {
  name: "Arabia & The World",
  folders: [
    {
      name: "Content",
      lists: [
        {
          name: "Editorial Pipeline",
          tasks: [
            { name: "ATW newsletter concept + cadence" },
            { name: '"Start here" landing page outline' },
          ],
        },
        {
          name: "Weekly Market Briefing",
          tasks: [],
        },
        {
          name: "City Guides",
          tasks: [
            { name: "City guides list (initial 10)" },
          ],
        },
      ],
    },
    {
      name: "Clients",
      lists: [
        {
          name: "Clients & Engagements",
          tasks: [
            { name: "Relocation intake workflow v1" },
            { name: "Action Plan deliverable template" },
          ],
        },
        {
          name: "Delivery Templates",
          tasks: [],
        },
      ],
    },
    {
      name: "Funnels",
      lists: [
        {
          name: "ATW Funnels & Products",
          tasks: [],
        },
        {
          name: "Partnerships",
          tasks: [],
        },
      ],
    },
    {
      name: "Research",
      lists: [
        {
          name: "Research & Briefings",
          tasks: [
            { name: "Morocco investor brief v1" },
          ],
        },
      ],
    },
  ],
};

// =============================================================================
// OBX / OBI ALFRED SPACE
// =============================================================================
const obxSpace: SpaceSpec = {
  name: "OBX / Obi Alfred",
  folders: [
    {
      name: "Releases",
      lists: [
        {
          name: "Release Calendar",
          tasks: [
            { name: "Better Than Gold — release checklist" },
            { name: "Better Than Gold PM — release checklist" },
            { name: "Archives Vol 1 — prep checklist" },
            { name: "Nights in Dubai — EP prep checklist" },
          ],
        },
        {
          name: "Production (Audio)",
          tasks: [
            { name: "Mix/master checklist template" },
          ],
        },
      ],
    },
    {
      name: "Visuals",
      lists: [
        {
          name: "Video Shoots & Visuals",
          tasks: [
            { name: "BTG video treatment" },
          ],
        },
        {
          name: "Content Clips",
          tasks: [],
        },
      ],
    },
    {
      name: "Promo",
      lists: [
        {
          name: "Marketing & Distribution",
          tasks: [
            { name: "Pre-save campaign" },
          ],
        },
        {
          name: "Live / Bookings",
          tasks: [],
        },
      ],
    },
    {
      name: "Rights",
      lists: [
        {
          name: "Rights & Admin",
          tasks: [
            { name: "Splits sheet template" },
            { name: "Metadata checklist template" },
          ],
        },
      ],
    },
  ],
};

// =============================================================================
// EXPORT COMPLETE SPEC
// =============================================================================
export const HOUSE_AL_NUR_SPEC: SpaceSpec[] = [
  corporateSpace,
  novaSpace,
  jannaSpace,
  atwSpace,
  obxSpace,
];

// Helper to count items
export function getSpecStats() {
  let folders = 0;
  let lists = 0;
  let tasks = 0;

  for (const space of HOUSE_AL_NUR_SPEC) {
    folders += space.folders.length;
    for (const folder of space.folders) {
      lists += folder.lists.length;
      for (const list of folder.lists) {
        tasks += list.tasks.length;
      }
    }
  }

  return {
    spaces: HOUSE_AL_NUR_SPEC.length,
    folders,
    lists,
    tasks,
  };
}
