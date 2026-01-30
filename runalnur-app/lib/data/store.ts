// In-memory data store for development
// This will be replaced with Supabase queries once connected

import type { Project, Contact, Task, Activity, ArmMetrics, DashboardMetrics } from '../types';
import type { ArmId } from '../constants';

// Sample projects for demonstration
export const sampleProjects: Project[] = [
  {
    id: '1',
    arm_id: 'janna',
    name: 'Casablanca 24-Unit Reposition',
    description: 'Value-add multifamily renovation project in Casablanca. Modern Asia-tier reposition targeting premium tenants.',
    status: 'in_progress',
    priority: 'critical',
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-16T00:00:00Z',
    due_date: '2026-06-30',
    progress: 15,
    tasks_total: 24,
    tasks_completed: 4,
  },
  {
    id: '2',
    arm_id: 'nova',
    name: 'Nova Website Launch',
    description: 'Official Nova Technology website with product showcase and configurator.',
    status: 'in_progress',
    priority: 'high',
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
    due_date: '2026-01-31',
    progress: 75,
    tasks_total: 12,
    tasks_completed: 9,
  },
  {
    id: '3',
    arm_id: 'nova',
    name: 'Nova Intelligence App',
    description: 'AI-powered intelligence web application.',
    status: 'in_progress',
    priority: 'high',
    created_at: '2026-01-08T00:00:00Z',
    updated_at: '2026-01-14T00:00:00Z',
    due_date: '2026-02-15',
    progress: 45,
    tasks_total: 18,
    tasks_completed: 8,
  },
  {
    id: '4',
    arm_id: 'atw',
    name: 'ATW Content Pipeline',
    description: 'Set up content creation and distribution pipeline for ATW media.',
    status: 'planning',
    priority: 'medium',
    created_at: '2026-01-12T00:00:00Z',
    updated_at: '2026-01-12T00:00:00Z',
    due_date: '2026-03-01',
    progress: 5,
    tasks_total: 8,
    tasks_completed: 0,
  },
  {
    id: '5',
    arm_id: 'house',
    name: 'Empire OS Setup',
    description: 'Establish House Al Nur operational infrastructure with Process Street, ClickUp, and AI integrations.',
    status: 'in_progress',
    priority: 'critical',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-16T00:00:00Z',
    progress: 20,
    tasks_total: 15,
    tasks_completed: 3,
  },
  {
    id: '6',
    arm_id: 'silk',
    name: 'Silk Platform Research',
    description: 'Research and plan luxury e-commerce platform infrastructure.',
    status: 'planning',
    priority: 'low',
    created_at: '2026-01-14T00:00:00Z',
    updated_at: '2026-01-14T00:00:00Z',
    progress: 0,
    tasks_total: 5,
    tasks_completed: 0,
  },
];

// Casablanca bench (architects + interior) for Janna (imported from PDF: Janna_Casablanca_Bench_Master_List.pdf)
export const sampleContacts: Contact[] = [
  // Section A — permit-board proven architects and lead designers
  {
    id: "casa-bench-01",
    name: "ARCHI NOBLE (Zerouali)",
    arm_id: "janna",
    role: "Architect",
    notes:
      "Permit-board listed with full execution chain (OPC/control/structure/GO). Strong candidate for first deal. Ask for comparable multifamily upgrades and site supervision cadence.\nSource: Permit board photo (Casa)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:permit-board",
      "priority:a",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-02",
    name: "B2A Studio (Benabdallah Abdelkader)",
    arm_id: "janna",
    role: "Architect",
    notes:
      "Active on a ZEJ Invest job. Good sign: listed on an in-flight project. Pre-qualify for residential reposition and storefront/lobby design.\nSource: Permit board photo (ZEJ Invest project)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:permit-board",
      "priority:a",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-03",
    name: "Dagram Architecture (Mehdi Besri)",
    arm_id: "janna",
    role: "Architect",
    notes:
      "Active on office-oriented work; still useful if you want a commercial-forward ground floor. Validate experience with multi-unit residential.\nSource: Permit board photo (Corrida Office SARL project)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:permit-board",
      "priority:b",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-04",
    name: "C2A Architecte (Chagdal Abdelati)",
    arm_id: "janna",
    role: "Architect",
    email: "c2aarchitecte@gmail.com",
    notes:
      "Direct email captured. Good for quick outreach and feasibility. Ask for Casablanca permitting workflow + a clean fee proposal.\nSource: Permit board photo",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:permit-board",
      "priority:b",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-05",
    name: "Ali Bekkari",
    arm_id: "janna",
    role: "Architect",
    notes:
      "Listed on an office project. Validate ability to deliver your Asia-tier interior/commons spec and manage subcontractor quality.\nSource: Permit board photo (BK Holding project)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:permit-board",
      "priority:b",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-06",
    name: "Saïd Belahmer",
    arm_id: "janna",
    role: "Architect / Urbanist",
    notes:
      "Hotel work typically implies stronger coordination and standards. Great candidate if you want premium lobby/storefront execution.\nSource: Permit board photo (Oasis Suite Hotel)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:permit-board",
      "priority:a",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-07",
    name: "RAD Studio (Radia Lemseffer)",
    arm_id: "janna",
    role: "Architecture + Interior Design",
    notes:
      "Modern render and mixed-use offices/retail config. Good fit if your ground-floor retail identity matters. Validate site management and procurement discipline.\nSource: Permit board photo (SO. Esperviers)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:permit-board",
      "priority:a",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-08",
    name: "Kahlaoui & Associés",
    arm_id: "janna",
    role: "Architects",
    notes:
      "Clinic project suggests compliance focus. Good for controlled execution. Ask about their contractor and BET partners for a repeatable playbook.\nSource: Permit board photo (Clinique V)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:permit-board",
      "priority:a",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-09",
    name: "AS Partners (Hicham Berrada El Azizi, Mehdi Redouane El Ghozali)",
    arm_id: "janna",
    role: "Architects",
    notes:
      "Showroom building can translate well to retail-grade facade and finishes. Validate residential layout planning capability.\nSource: Permit board photo (Showroom)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:permit-board",
      "priority:b",
      "city:casablanca",
    ],
  },

  // Section J — IG-sourced Casablanca/Rabat architect bench (portfolio candidates)
  {
    id: "casa-bench-10",
    name: "Atelier LINEA",
    arm_id: "janna",
    role: "Architect / Archi-deco - Casablanca",
    notes:
      "IG: @atelierlinea.archideco\nGood candidate for interiors + premium detailing. Validate site supervision and contractor network.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "interior",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-11",
    name: "Mariam Ammor Architecte",
    arm_id: "janna",
    role: "Architect - Casablanca",
    notes:
      "IG: @mariam.ammor.archideco\nReview portfolio for clean modern work and space planning; check recent delivered projects.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-12",
    name: "FAIZ Omar - Architecte / AAF",
    arm_id: "janna",
    role: "Architect - Casablanca",
    notes:
      "IG: @aaf_agence_archifaiz / @omar_archifaiz\nLikely capable of modern midrise workflows. Validate multi-unit residential experience.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-13",
    name: "Ikram Moumen",
    arm_id: "janna",
    role: "Architect / Designer - Casablanca",
    notes:
      "IG: @ikramoumen\nPotential interiors-forward partner. Validate technical depth and execution partners.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "interior",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-14",
    name: "ALIF Architecture Studio",
    arm_id: "janna",
    role: "Architecture studio - Casablanca",
    notes:
      "IG: @alif_archi_studio\nShortlist for modern style alignment. Ask for permitting and contractor bench.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-15",
    name: "MB. Architecture",
    arm_id: "janna",
    role: "Architecture studio - Casablanca",
    notes:
      "IG: @mb.architecturee\nCandidate for modern upgrades. Validate ability to deliver a repeatable spec package.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-16",
    name: "Atelier ZE architecture",
    arm_id: "janna",
    role: "Architecture studio - Casablanca",
    notes:
      "IG: @ze_architecture_\nPortfolio candidate; check for consistent built work quality.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-17",
    name: "Yame Architecture Studio",
    arm_id: "janna",
    role: "Architecture studio - Rabat",
    notes:
      "IG: @yamearchitecturestudio\nRabat-based; could still be useful if they operate in Casa. Validate Casablanca references.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:rabat",
    ],
  },
  {
    id: "casa-bench-18",
    name: "Atelier 4A",
    arm_id: "janna",
    role: "Architecture studio - Casablanca",
    notes:
      "IG: @atelier.4a\nPortfolio candidate; check for finishes/cleanliness level you want.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-19",
    name: "MA architecte d'interieur",
    arm_id: "janna",
    role: "Interior design - Casablanca",
    notes:
      "IG: @ma.architectedinterieur\nGood for lobby/hallways/staging. Pair with a strong architect + PM for permit delivery.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "interior",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-20",
    name: "Nassima Reda Architecte",
    arm_id: "janna",
    role: "Architect - Casablanca",
    notes:
      "IG: @nassimaredaarchitecte\nPortfolio candidate; verify project management and on-site QA approach.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-21",
    name: "Atelier Essolaymany Salma",
    arm_id: "janna",
    role: "Architect / Interior - Casablanca",
    notes:
      "IG: @atelieres_\nCandidate; verify scope comfort from concept to site execution.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "interior",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-22",
    name: "DADOUN Architects",
    arm_id: "janna",
    role: "Architecture studio - Casablanca",
    notes:
      "IG: @dadoun_archs\nStrong candidate for modern presence; validate delivered projects and responsiveness.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-23",
    name: "K'studio (handle TBD)",
    arm_id: "janna",
    role: "Architecture / Interior - Casablanca",
    notes:
      "IG: Likely @kprimestudio or @kstudiobyks (verify)\nHandle needs verification. Review portfolio and confirm legal entity + references.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "interior",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-24",
    name: "Sanaa Almourtajy (handle TBD)",
    arm_id: "janna",
    role: "Interior design (as noted) - Casablanca",
    notes:
      "IG: Handle to confirm\nName captured; needs verification and portfolio review.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "interior",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
  {
    id: "casa-bench-25",
    name: "YZA by Yassin Zerrouk (handle TBD)",
    arm_id: "janna",
    role: "Architecture studio - Casablanca",
    notes:
      "IG: Handle to confirm\nName captured; needs verification and portfolio review.\nSource: IG suggestion (prior thread)",
    created_at: "2026-01-20T00:00:00Z",
    updated_at: "2026-01-20T00:00:00Z",
    tags: [
      "architect",
      "project:casablanca",
      "reachout:pending",
      "source:ig",
      "priority:c",
      "city:casablanca",
    ],
  },
];

// Sample tasks
export const sampleTasks: Task[] = [
  {
    id: '1',
    project_id: '1',
    name: 'Finalize architect selection',
    description: 'Review proposals and select primary architect for Casablanca project',
    status: 'in_progress',
    priority: 'critical',
    due_date: '2026-01-20',
    context: 'janna',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-16T00:00:00Z',
  },
  {
    id: '2',
    project_id: '1',
    name: 'Site inspection and assessment',
    description: 'Conduct thorough inspection of the 24-unit property',
    status: 'todo',
    priority: 'high',
    due_date: '2026-01-25',
    context: 'janna',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
  },
  {
    id: '3',
    project_id: '1',
    name: 'Create renovation timeline',
    description: 'Develop detailed project timeline with milestones',
    status: 'todo',
    priority: 'high',
    due_date: '2026-01-28',
    context: 'janna',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
  },
  {
    id: '4',
    project_id: '2',
    name: 'Final QA pass',
    description: 'Complete quality assurance testing on Nova website',
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-01-18',
    context: 'nova',
    created_at: '2026-01-14T00:00:00Z',
    updated_at: '2026-01-16T00:00:00Z',
  },
  {
    id: '5',
    project_id: '5',
    name: 'Set up ClickUp workspace structure',
    description: 'Configure ClickUp with folders for all arms',
    status: 'done',
    priority: 'high',
    context: 'house',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-16T00:00:00Z',
  },
];

// Sample activities
export const sampleActivities: Activity[] = [
  {
    id: '1',
    type: 'project_created',
    description: 'Created project "Casablanca 24-Unit Reposition"',
    arm_id: 'janna',
    project_id: '1',
    created_at: '2026-01-10T09:00:00Z',
  },
  {
    id: '2',
    type: 'contact_added',
    description: 'Added Casablanca bench contacts to contacts',
    arm_id: 'janna',
    created_at: '2026-01-15T14:30:00Z',
  },
  {
    id: '3',
    type: 'task_completed',
    description: 'Completed "Set up ClickUp workspace structure"',
    arm_id: 'house',
    project_id: '5',
    created_at: '2026-01-16T10:00:00Z',
  },
  {
    id: '4',
    type: 'project_updated',
    description: 'Updated Nova Website progress to 75%',
    arm_id: 'nova',
    project_id: '2',
    created_at: '2026-01-15T16:00:00Z',
  },
  {
    id: '5',
    type: 'status_changed',
    description: 'Changed "Nova Intelligence App" status to In Progress',
    arm_id: 'nova',
    project_id: '3',
    created_at: '2026-01-14T11:00:00Z',
  },
  {
    id: '6',
    type: 'project_created',
    description: 'Created project "Empire OS Setup"',
    arm_id: 'house',
    project_id: '5',
    created_at: '2026-01-15T08:00:00Z',
  },
];

// Data access functions
export function getProjects(): Project[] {
  return sampleProjects;
}

export function getProjectsByArm(armId: ArmId): Project[] {
  return sampleProjects.filter(p => p.arm_id === armId);
}

export function getProject(id: string): Project | undefined {
  return sampleProjects.find(p => p.id === id);
}

export function getContacts(): Contact[] {
  return sampleContacts;
}

export function getContactsByArm(armId: ArmId): Contact[] {
  return sampleContacts.filter(c => c.arm_id === armId);
}

export function getTasks(): Task[] {
  return sampleTasks;
}

export function getTasksByProject(projectId: string): Task[] {
  return sampleTasks.filter(t => t.project_id === projectId);
}

export function getActivities(limit?: number): Activity[] {
  const sorted = [...sampleActivities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export function getActivitiesByArm(armId: ArmId): Activity[] {
  return sampleActivities
    .filter(a => a.arm_id === armId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getDashboardMetrics(): DashboardMetrics {
  const projects = getProjects();
  const tasks = getTasks();
  const contacts = getContacts();
  const today = new Date().toISOString().split('T')[0];
  
  return {
    total_projects: projects.length,
    active_projects: projects.filter(p => p.status === 'in_progress').length,
    completed_projects: projects.filter(p => p.status === 'completed').length,
    total_contacts: contacts.length,
    tasks_due_today: tasks.filter(t => t.due_date === today).length,
    tasks_overdue: tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done').length,
    sops_in_progress: 0,
  };
}

export function getArmMetrics(armId: ArmId): ArmMetrics {
  const projects = getProjectsByArm(armId);
  const contacts = getContactsByArm(armId);
  const tasks = getTasks().filter(t => 
    projects.some(p => p.id === t.project_id)
  );
  
  return {
    arm_id: armId,
    projects_count: projects.length,
    active_projects: projects.filter(p => p.status === 'in_progress').length,
    contacts_count: contacts.length,
    tasks_pending: tasks.filter(t => t.status !== 'done').length,
  };
}
