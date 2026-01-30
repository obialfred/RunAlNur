/**
 * Local IndexedDB Database using Dexie.js
 * Mirrors Supabase schema for offline-first architecture
 */

import Dexie, { type Table } from 'dexie';

// Sync metadata for tracking changes
export interface SyncMeta {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  synced: boolean;
  retries: number;
}

// Local versions of database types with sync tracking
export interface LocalArm {
  id: string;
  name: string;
  slug: string;
  head: string;
  description: string | null;
  color: string | null;
  created_at: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface LocalProject {
  id: string;
  arm_id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  clickup_id: string | null;
  due_date: string | null;
  progress: number;
  tasks_total: number;
  tasks_completed: number;
  created_at: string;
  updated_at: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface LocalContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  arm_id: string;
  hubspot_id: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface LocalTask {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  assignee: string | null;
  due_date: string | null;
  clickup_id: string | null;
  created_at: string;
  updated_at: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface LocalActivity {
  id: string;
  type: string;
  description: string;
  arm_id: string | null;
  project_id: string | null;
  contact_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  _synced?: boolean;
}

export interface LocalNotification {
  id: string;
  user_id: string | null;
  title: string;
  body: string | null;
  type: string;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  _synced?: boolean;
}

export interface LocalSOP {
  id: string;
  name: string;
  description: string | null;
  arm_id: string | null;
  process_street_id: string | null;
  steps: Array<{
    id: string;
    name: string;
    description?: string;
    order: number;
    is_completed: boolean;
  }>;
  created_at: string;
  updated_at: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface LocalSOPRun {
  id: string;
  sop_id: string;
  project_id: string | null;
  status: string;
  current_step: number;
  started_at: string;
  completed_at: string | null;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface LocalProperty {
  id: string;
  arm_id: string | null;
  name: string;
  address: string | null;
  units: number | null;
  sqft: number | null;
  acquisition_date: string | null;
  purchase_price: number | null;
  renovation_budget: number | null;
  target_rent: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface LocalDeal {
  id: string;
  arm_id: string | null;
  hubspot_id: string | null;
  name: string;
  stage: string;
  score: number;
  amount: number | null;
  status: string;
  created_at: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface LocalVendor {
  id: string;
  arm_id: string | null;
  name: string;
  vendor_type: string | null;
  contact_id: string | null;
  notes: string | null;
  created_at: string;
  _synced?: boolean;
  _deleted?: boolean;
}

// The Dexie database class
export class RunAlNurDB extends Dexie {
  arms!: Table<LocalArm>;
  projects!: Table<LocalProject>;
  contacts!: Table<LocalContact>;
  tasks!: Table<LocalTask>;
  activities!: Table<LocalActivity>;
  notifications!: Table<LocalNotification>;
  sops!: Table<LocalSOP>;
  sop_runs!: Table<LocalSOPRun>;
  properties!: Table<LocalProperty>;
  deals!: Table<LocalDeal>;
  vendors!: Table<LocalVendor>;
  sync_queue!: Table<SyncMeta>;

  constructor() {
    super('RunAlNurDB');

    this.version(1).stores({
      arms: 'id, slug, name, _synced, _deleted',
      projects: 'id, arm_id, name, status, priority, due_date, _synced, _deleted',
      contacts: 'id, arm_id, name, email, company, hubspot_id, _synced, _deleted',
      tasks: 'id, project_id, name, status, priority, due_date, _synced, _deleted',
      activities: 'id, arm_id, project_id, contact_id, type, created_at, _synced',
      notifications: 'id, user_id, type, read_at, created_at, _synced',
      sops: 'id, arm_id, name, process_street_id, _synced, _deleted',
      sop_runs: 'id, sop_id, project_id, status, _synced, _deleted',
      properties: 'id, arm_id, name, status, _synced, _deleted',
      deals: 'id, arm_id, hubspot_id, stage, status, _synced, _deleted',
      vendors: 'id, arm_id, name, vendor_type, _synced, _deleted',
      sync_queue: 'id, table, operation, timestamp, synced',
    });
  }
}

// Singleton instance
export const db = new RunAlNurDB();

// Helper to generate UUIDs
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper to get current timestamp
export function now(): string {
  return new Date().toISOString();
}

// Clear all local data (useful for logout)
export async function clearLocalDatabase(): Promise<void> {
  await Promise.all([
    db.arms.clear(),
    db.projects.clear(),
    db.contacts.clear(),
    db.tasks.clear(),
    db.activities.clear(),
    db.notifications.clear(),
    db.sops.clear(),
    db.sop_runs.clear(),
    db.properties.clear(),
    db.deals.clear(),
    db.vendors.clear(),
    db.sync_queue.clear(),
  ]);
}

// Get pending sync count
export async function getPendingSyncCount(): Promise<number> {
  return await db.sync_queue.where('synced').equals(0).count();
}

// Export database for debugging
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__runalnur_db = db;
}
