import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Task, TaskPriorityLevel } from "@/lib/types";
import type { FocusBlock } from "@/lib/calendar/types";
import { autoSchedule, DEFAULT_SCHEDULER_PREFERENCES, calculateDoDate } from "@/lib/scheduler";

interface ArmRow {
  id: string;
  name: string;
  slug: string;
}

async function resolveArmId(arm: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const normalized = arm.toLowerCase();
  const { data } = await supabase
    .from("arms")
    .select("id, name, slug")
    .or(`id.eq.${arm},slug.eq.${normalized},name.ilike.%${arm}%`)
    .limit(1)
    .maybeSingle();
  const row = data as ArmRow | null;
  return row?.id || null;
}

type ToolContext = { tenantId?: string; userId?: string };

const PRIORITY_FROM_LEVEL: Record<TaskPriorityLevel, "critical" | "high" | "medium" | "low"> = {
  p1: "critical",
  p2: "high",
  p3: "medium",
  p4: "low",
};

const PRIORITY_LEVEL_FROM_PRIORITY: Record<string, TaskPriorityLevel> = {
  critical: "p1",
  high: "p2",
  medium: "p3",
  low: "p4",
};

function resolveTaskContext(
  args: { tenant_id?: string; tenantId?: string; owner_id?: string; user_id?: string },
  context?: ToolContext
) {
  const tenantId = context?.tenantId || args.tenant_id || args.tenantId;
  const userId = context?.userId || args.owner_id || args.user_id;
  if (!tenantId || !userId) {
    throw new Error("Tenant/user context required for task actions");
  }
  return { tenantId, userId };
}

function normalizeDateInput(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (normalized === "today") {
    return today.toISOString().split("T")[0];
  }
  if (normalized === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }
  if (normalized === "next_week" || normalized === "next week") {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split("T")[0];
  }
  if (normalized === "someday") {
    return null;
  }
  return value;
}

function inferContextFromText(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("nova")) return "nova";
  if (lower.includes("janna")) return "janna";
  if (lower.includes("silk")) return "silk";
  if (lower.includes("obx") || lower.includes("music")) return "obx";
  if (lower.includes("atw")) return "atw";
  if (lower.includes("maison")) return "maison";
  if (lower.includes("personal")) return "personal";
  if (lower.includes("house")) return "house";
  return undefined;
}

function inferPriorityLevelFromText(text: string): TaskPriorityLevel | undefined {
  const lower = text.toLowerCase();
  if (/(urgent|asap|critical|immediately|right away)/.test(lower)) return "p1";
  if (/(high priority|important|priority high)/.test(lower)) return "p2";
  if (/(low priority|whenever|someday|nice to have)/.test(lower)) return "p4";
  return undefined;
}

function extractDurationMinutes(text: string): number | undefined {
  const match = text
    .toLowerCase()
    .match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/);
  if (!match) return undefined;
  const value = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(value)) return undefined;
  if (unit.startsWith("h")) return Math.round(value * 60);
  return Math.round(value);
}

function inferDateFromText(text: string): string | undefined {
  const lower = text.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isoMatch = lower.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];

  if (lower.includes("today")) return today.toISOString().split("T")[0];
  if (lower.includes("tomorrow")) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  const inDaysMatch = lower.match(/\bin\s+(\d+)\s+day/);
  if (inDaysMatch) {
    const days = Number(inDaysMatch[1]);
    if (Number.isFinite(days)) {
      const target = new Date(today);
      target.setDate(target.getDate() + days);
      return target.toISOString().split("T")[0];
    }
  }

  if (lower.includes("next week")) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split("T")[0];
  }

  if (lower.includes("next month")) {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split("T")[0];
  }

  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  for (const day of weekdays) {
    if (!lower.includes(day)) continue;
    const targetIdx = weekdays.indexOf(day);
    const currentIdx = today.getDay();
    let delta = (targetIdx - currentIdx + 7) % 7;
    if (lower.includes(`next ${day}`)) {
      delta = delta === 0 ? 7 : delta + 7;
    }
    const target = new Date(today);
    target.setDate(target.getDate() + delta);
    return target.toISOString().split("T")[0];
  }

  return undefined;
}

// ============================================================================
// KNOWLEDGE MANAGEMENT
// ============================================================================

export async function createKnowledge(args: {
  title: string;
  content: string;
  category?: string;
  arm?: string;
  tags?: string[];
  related_contact?: string;
  related_project?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  const armId = args.arm ? await resolveArmId(args.arm) : null;

  const insertData = {
    title: args.title,
    content: args.content,
    category: args.category || null,
    arm_id: armId,
    tags: args.tags || [],
    source: "ai" as const,
    metadata: {
      created_via: "coo_ai",
      ...(args.related_contact && { related_contact_query: args.related_contact }),
      ...(args.related_project && { related_project_query: args.related_project }),
    },
  };

  const { data, error } = await supabase
    .from("knowledge_base")
    .insert(insertData as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return { 
    success: true, 
    knowledge: data,
    message: `Knowledge saved: "${args.title}" in ${args.category || "General"}` 
  };
}

export async function searchKnowledge(args: {
  query: string;
  category?: string;
  arm?: string;
  tags?: string[];
  limit?: number;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  let query = supabase
    .from("knowledge_base")
    .select("*")
    .textSearch("search_vector", args.query, { type: "websearch" })
    .limit(args.limit || 10);

  if (args.category) {
    query = query.eq("category", args.category);
  }

  if (args.arm) {
    const armId = await resolveArmId(args.arm);
    if (armId) {
      query = query.eq("arm_id", armId);
    }
  }

  if (args.tags && args.tags.length > 0) {
    query = query.overlaps("tags", args.tags);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return {
    results: data || [],
    count: data?.length || 0,
    query: args.query,
  };
}

// ============================================================================
// DEADLINES & MILESTONES
// ============================================================================

export async function createDeadline(args: {
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  priority?: string;
  arm?: string;
  project_id?: string;
  reminders?: number[];
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  const armId = args.arm ? await resolveArmId(args.arm) : null;

  // Convert reminders array to JSONB format
  const remindersJson = args.reminders?.map(days => ({
    type: "days_before",
    value: days,
  })) || [];

  const insertData = {
    title: args.title,
    description: args.description || null,
    due_date: args.due_date,
    due_time: args.due_time || null,
    priority: args.priority || "medium",
    arm_id: armId,
    project_id: args.project_id || null,
    reminders: remindersJson,
    status: "pending",
  };

  const { data, error } = await supabase
    .from("deadlines")
    .insert(insertData as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  // Format response message
  const reminderText = args.reminders?.length 
    ? ` Reminders set for ${args.reminders.map(d => `${d} day${d === 1 ? '' : 's'} before`).join(", ")}.`
    : "";

  return {
    success: true,
    deadline: data,
    message: `Deadline created: "${args.title}" due ${args.due_date}.${reminderText}`,
  };
}

export async function createMilestone(args: {
  title: string;
  description?: string;
  project_id: string;
  target_date?: string;
  dependent_on?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  // Get the next sort order for this project
  const { data: existingMilestones } = await supabase
    .from("milestones")
    .select("sort_order")
    .eq("project_id", args.project_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const milestoneRows = existingMilestones as Array<{ sort_order: number }> | null;
  const nextOrder = (milestoneRows?.[0]?.sort_order ?? -1) + 1;

  const insertData = {
    title: args.title,
    description: args.description || null,
    project_id: args.project_id,
    target_date: args.target_date || null,
    dependent_on: args.dependent_on || null,
    sort_order: nextOrder,
    status: "pending",
  };

  const { data, error } = await supabase
    .from("milestones")
    .insert(insertData as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return {
    success: true,
    milestone: data,
    message: `Milestone created: "${args.title}"${args.target_date ? ` targeting ${args.target_date}` : ""}`,
  };
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export async function createBulkContacts(args: {
  contacts: Array<{
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    role?: string;
    arm?: string;
    tags?: string[];
  }>;
  default_arm?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  const defaultArmId = args.default_arm ? await resolveArmId(args.default_arm) : null;

  // Prepare all contacts with resolved arm IDs
  const contactsToInsert = await Promise.all(
    args.contacts.map(async (contact) => {
      const armId = contact.arm ? await resolveArmId(contact.arm) : defaultArmId;
      return {
        name: contact.name,
        email: contact.email || null,
        phone: contact.phone || null,
        company: contact.company || null,
        role: contact.role || null,
        arm_id: armId,
        tags: contact.tags || [],
      };
    })
  );

  const { data, error } = await supabase
    .from("contacts")
    .insert(contactsToInsert as never[])
    .select("*");

  if (error) throw new Error(error.message);

  return {
    success: true,
    created: data?.length || 0,
    contacts: data,
    message: `Created ${data?.length || 0} contacts successfully.`,
  };
}

export async function updateContact(args: {
  contact_id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  arm?: string;
  tags?: string[];
  notes?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  const updateData: Record<string, unknown> = {};

  if (args.name) updateData.name = args.name;
  if (args.email !== undefined) updateData.email = args.email || null;
  if (args.phone !== undefined) updateData.phone = args.phone || null;
  if (args.company !== undefined) updateData.company = args.company || null;
  if (args.role !== undefined) updateData.role = args.role || null;
  if (args.tags) updateData.tags = args.tags;
  if (args.notes !== undefined) updateData.notes = args.notes || null;
  
  if (args.arm) {
    const armId = await resolveArmId(args.arm);
    if (armId) updateData.arm_id = armId;
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, message: "No fields to update" };
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(updateData as never)
    .eq("id", args.contact_id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const contactData = data as { name: string } | null;
  return {
    success: true,
    contact: data,
    message: `Contact "${contactData?.name || "Unknown"}" updated successfully.`,
  };
}

// ============================================================================
// SOP MANAGEMENT
// ============================================================================

export async function createSOP(args: {
  name: string;
  description?: string;
  arm: string;
  steps: Array<{
    title: string;
    description?: string;
    required?: boolean;
  }>;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  const armId = await resolveArmId(args.arm);
  if (!armId) throw new Error("Arm not found");

  // Format steps for JSONB storage
  const formattedSteps = args.steps.map((step, index) => ({
    order: index + 1,
    title: step.title,
    description: step.description || "",
    required: step.required ?? true,
  }));

  const insertData = {
    name: args.name,
    description: args.description || null,
    arm_id: armId,
    steps: formattedSteps,
  };

  const { data, error } = await supabase
    .from("sops")
    .insert(insertData as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return {
    success: true,
    sop: data,
    message: `SOP "${args.name}" created with ${args.steps.length} steps.`,
  };
}

export async function createProject(args: {
  name: string;
  arm: string;
  description?: string;
  priority?: string;
  due_date?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const armId = await resolveArmId(args.arm);
  if (!armId) throw new Error("Arm not found");

  const insertData = {
    arm_id: armId,
    name: args.name,
    description: args.description || "",
    status: "planning",
    priority: args.priority || "medium",
    due_date: args.due_date || null,
    progress: 0,
    tasks_total: 0,
    tasks_completed: 0,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(insertData as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createTask(
  args: {
    project_id?: string | null;
    name: string;
    description?: string;
    priority?: string;
    priority_level?: TaskPriorityLevel;
    status?: string;
    due_date?: string;
    do_date?: string;
    committed_date?: string;
    duration_minutes?: number;
    auto_schedule?: boolean;
    recurrence_rule?: string;
    context?: string;
    tenant_id?: string;
    owner_id?: string;
  },
  context?: ToolContext
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  const { tenantId, userId } = resolveTaskContext(args, context);
  const resolvedPriority = args.priority || "medium";
  const resolvedPriorityLevel =
    args.priority_level || PRIORITY_LEVEL_FROM_PRIORITY[resolvedPriority] || "p3";

  const insertData = {
    tenant_id: tenantId,
    owner_id: userId,
    project_id: args.project_id || null,
    name: args.name,
    description: args.description || null,
    priority: resolvedPriority,
    priority_level: resolvedPriorityLevel,
    status: args.status || "todo",
    due_date: normalizeDateInput(args.due_date),
    do_date: normalizeDateInput(args.do_date),
    committed_date: normalizeDateInput(args.committed_date),
    duration_minutes: args.duration_minutes ?? 30,
    auto_schedule: args.auto_schedule ?? true,
    recurrence_rule: args.recurrence_rule || null,
    context: args.context || "house",
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(insertData as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createContact(args: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  arm: string;
  tags?: string[];
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const armId = await resolveArmId(args.arm);
  if (!armId) throw new Error("Arm not found");

  const insertData = {
    name: args.name,
    email: args.email || null,
    phone: args.phone || null,
    company: args.company || null,
    role: args.role || null,
    arm_id: armId,
    tags: args.tags || [],
  };

  const { data, error } = await supabase
    .from("contacts")
    .insert(insertData as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTaskStatus(args: { task_id: string; status: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: args.status } as never)
    .eq("id", args.task_id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ============================================================================
// ADVANCED TASK SYSTEM (Motion/Sunsama/Reclaim-inspired)
// ============================================================================

async function runAutoScheduleForUser(args: {
  tenantId: string;
  userId: string;
  targetDate: Date;
  taskIds?: string[];
  maxTasks?: number;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");

  let tasksQuery = supabase
    .from("tasks")
    .select("*")
    .eq("tenant_id", args.tenantId)
    .eq("owner_id", args.userId)
    .neq("status", "done")
    .eq("auto_schedule", true)
    .is("scheduled_block_id", null);

  if (args.taskIds && args.taskIds.length > 0) {
    tasksQuery = tasksQuery.in("id", args.taskIds);
  }

  if (args.maxTasks) {
    tasksQuery = tasksQuery.limit(args.maxTasks);
  }

  const { data: tasksRaw, error: tasksErr } = await tasksQuery;
  if (tasksErr) throw new Error(tasksErr.message);

  const tasks = (tasksRaw as unknown as Array<Record<string, unknown>>).map((t) => {
    const priorityLevel = (t.priority_level || "p3") as TaskPriorityLevel;
    const mappedPriority = PRIORITY_FROM_LEVEL[priorityLevel] || "medium";
    return {
      id: String(t.id),
      name: String(t.name || ""),
      status: (t.status || "todo") as Task["status"],
      priority: mappedPriority,
      priority_level: priorityLevel,
      due_date: (t.due_date as string | undefined) || undefined,
      do_date: (t.do_date as string | undefined) || undefined,
      duration_minutes: (t.duration_minutes as number | undefined) || 30,
      committed_date: (t.committed_date as string | undefined) || undefined,
      auto_schedule: Boolean(t.auto_schedule),
      scheduled_block_id: (t.scheduled_block_id as string | null) || null,
      context: (t.context as string | undefined) || "house",
      created_at: "",
      updated_at: "",
    } as Task;
  });

  if (tasks.length === 0) {
    return {
      scheduled: 0,
      unscheduled: 0,
      atRisk: 0,
      totalMinutesScheduled: 0,
      createdBlockIds: [] as string[],
      atRiskTasks: [] as Array<{ id: string; name: string; reason: string; suggestedAction: string }>,
    };
  }

  const horizonEnd = new Date(args.targetDate);
  horizonEnd.setDate(horizonEnd.getDate() + DEFAULT_SCHEDULER_PREFERENCES.schedulingHorizon);

  const { data: blocksRaw, error: blocksErr } = await supabase
    .from("focus_blocks")
    .select("*")
    .eq("tenant_id", args.tenantId)
    .eq("user_id", args.userId)
    .gte("end_time", args.targetDate.toISOString())
    .lte("start_time", horizonEnd.toISOString());

  if (blocksErr) throw new Error(blocksErr.message);

  const existingBlocks = (blocksRaw as unknown as Array<Record<string, unknown>>).map((b) => ({
    id: String(b.id),
    user_id: args.userId,
    title: String(b.title || ""),
    context: (b.context as string) || "other",
    start_time: String(b.start_time),
    end_time: String(b.end_time),
    timezone: "America/Chicago",
    completed: Boolean(b.completed),
    sync_status: "synced" as const,
    created_at: "",
    updated_at: "",
  })) as FocusBlock[];

  const result = await autoSchedule({
    tasks,
    existingBlocks,
    preferences: DEFAULT_SCHEDULER_PREFERENCES,
    targetDate: args.targetDate,
  });

  const createdBlockIds: string[] = [];

  for (const scheduled of result.scheduledTasks) {
    const block = result.createdBlocks.find(
      (b) => b.metadata?.task_id === scheduled.task.id
    );

    if (!block) continue;

    const { data: newBlock, error: blockErr } = await supabase
      .from("focus_blocks")
      .insert({
        tenant_id: args.tenantId,
        user_id: args.userId,
        title: block.title,
        description: block.description,
        context: block.context,
        start_time: block.start_time,
        end_time: block.end_time,
        timezone: block.timezone || "America/Chicago",
        completed: false,
        sync_status: "pending",
        metadata: block.metadata,
      } as never)
      .select("id")
      .single();

    if (blockErr || !newBlock) continue;

    const blockId = (newBlock as { id: string }).id;
    createdBlockIds.push(blockId);

    await supabase
      .from("tasks")
      .update({
        scheduled_block_id: blockId,
        do_date: scheduled.scheduledStart.toISOString().split("T")[0],
        scheduling_metadata: {
          last_scheduled_at: new Date().toISOString(),
          schedule_attempts: 1,
        },
      } as never)
      .eq("tenant_id", args.tenantId)
      .eq("id", scheduled.task.id);
  }

  for (const atRisk of result.atRiskTasks) {
    await supabase
      .from("tasks")
      .update({
        scheduling_metadata: {
          at_risk: true,
          at_risk_reason: atRisk.reason,
        },
      } as never)
      .eq("tenant_id", args.tenantId)
      .eq("id", atRisk.task.id);
  }

  return {
    scheduled: result.summary.totalScheduled,
    unscheduled: result.summary.totalUnscheduled,
    atRisk: result.summary.totalAtRisk,
    totalMinutesScheduled: result.summary.totalMinutesScheduled,
    createdBlockIds,
    atRiskTasks: result.atRiskTasks.map((t) => ({
      id: t.task.id,
      name: t.task.name,
      reason: t.reason,
      suggestedAction: t.suggestedAction,
    })),
  };
}

export async function createTaskSmart(
  args: {
    raw_input: string;
    name?: string;
    context?: string;
    priority_level?: TaskPriorityLevel;
    due_date?: string;
    do_date?: string;
    duration_minutes?: number;
    auto_schedule?: boolean;
    commit_to_today?: boolean;
    recurrence_rule?: string;
  },
  context?: ToolContext
) {
  const { tenantId, userId } = resolveTaskContext({}, context);
  const rawInput = args.raw_input || "";
  const resolvedName = args.name || rawInput.trim();
  if (!resolvedName) throw new Error("Task name is required");

  const today = new Date().toISOString().split("T")[0];
  let resolvedDoDate = normalizeDateInput(args.do_date);
  const inferredContext = inferContextFromText(rawInput);
  const inferredPriority = inferPriorityLevelFromText(rawInput);
  const inferredDuration = extractDurationMinutes(rawInput);
  const inferredDueDate = inferDateFromText(rawInput);

  const resolvedPriorityLevel = args.priority_level || inferredPriority || "p3";
  const resolvedContext = args.context || inferredContext || "house";
  const resolvedDuration = args.duration_minutes ?? inferredDuration ?? 30;
  const resolvedDueDate = normalizeDateInput(args.due_date) || inferredDueDate;
  const resolvedCommittedDate = args.commit_to_today ? today : null;

  if (args.commit_to_today) {
    resolvedDoDate = today;
  } else if (!resolvedDoDate && resolvedDueDate) {
    resolvedDoDate = calculateDoDate(resolvedDueDate, resolvedDuration);
  }

  const task = await createTask(
    {
      name: resolvedName,
      context: resolvedContext,
      priority_level: resolvedPriorityLevel,
      priority: PRIORITY_FROM_LEVEL[resolvedPriorityLevel] || "medium",
      due_date: resolvedDueDate || undefined,
      do_date: resolvedDoDate || (args.commit_to_today ? today : undefined),
      committed_date: resolvedCommittedDate || undefined,
      duration_minutes: resolvedDuration,
      auto_schedule: args.auto_schedule ?? true,
      recurrence_rule: args.recurrence_rule,
      project_id: null,
      tenant_id: tenantId,
      owner_id: userId,
    },
    { tenantId, userId }
  );

  let scheduling = null;
  if (args.auto_schedule && (args.commit_to_today || resolvedDoDate)) {
    const targetDate = new Date(resolvedDoDate || today);
    scheduling = await runAutoScheduleForUser({
      tenantId,
      userId,
      targetDate,
      taskIds: [String((task as any).id)],
      maxTasks: 1,
    });
  }

  return {
    success: true,
    task,
    scheduling,
    message: `Task created${scheduling?.scheduled ? " and scheduled" : ""}: "${resolvedName}"`,
  };
}

export async function scheduleTasks(
  args: {
    task_ids?: string[];
    target_date?: string;
    max_tasks?: number;
  },
  context?: ToolContext
) {
  const { tenantId, userId } = resolveTaskContext({}, context);
  const targetDate = args.target_date ? new Date(args.target_date) : new Date();

  const result = await runAutoScheduleForUser({
    tenantId,
    userId,
    targetDate,
    taskIds: args.task_ids,
    maxTasks: args.max_tasks,
  });

  return {
    success: true,
    data: result,
    message: result.scheduled > 0
      ? `Scheduled ${result.scheduled} task(s)`
      : "No tasks scheduled",
  };
}

export async function commitTaskToDay(
  args: { task_id: string; date?: string; auto_schedule?: boolean },
  context?: ToolContext
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const { tenantId, userId } = resolveTaskContext({}, context);

  const commitDate = normalizeDateInput(args.date) || new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("tasks")
    .update({
      committed_date: commitDate,
      do_date: commitDate,
      auto_schedule: args.auto_schedule ?? true,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("tenant_id", tenantId)
    .eq("owner_id", userId)
    .eq("id", args.task_id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  let scheduling = null;
  if (args.auto_schedule) {
    scheduling = await runAutoScheduleForUser({
      tenantId,
      userId,
      targetDate: new Date(commitDate),
      taskIds: [args.task_id],
      maxTasks: 1,
    });
  }

  return {
    success: true,
    task: data,
    scheduling,
    message: `Task committed to ${commitDate}`,
  };
}

export async function deferTask(
  args: { task_id: string; defer_to?: string; reason?: string },
  context?: ToolContext
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const { tenantId, userId } = resolveTaskContext({}, context);

  const deferDate = normalizeDateInput(args.defer_to);

  const { data: existingRaw, error: fetchError } = await supabase
    .from("tasks")
    .select("id, name, scheduled_block_id, scheduling_metadata")
    .eq("tenant_id", tenantId)
    .eq("owner_id", userId)
    .eq("id", args.task_id)
    .single();

  if (fetchError || !existingRaw) throw new Error("Task not found");

  const existing = existingRaw as {
    id: string;
    name: string;
    scheduled_block_id: string | null;
    scheduling_metadata: Record<string, unknown> | null;
  };

  const currentMetadata = existing.scheduling_metadata || {};
  const deferCount = ((currentMetadata.defer_count as number) || 0) + 1;

  const { data, error } = await supabase
    .from("tasks")
    .update({
      committed_date: deferDate,
      do_date: deferDate,
      scheduled_block_id: null,
      updated_at: new Date().toISOString(),
      scheduling_metadata: {
        ...currentMetadata,
        defer_count: deferCount,
        last_deferred_at: new Date().toISOString(),
        defer_reason: args.reason || undefined,
      },
    } as never)
    .eq("tenant_id", tenantId)
    .eq("id", args.task_id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (existing.scheduled_block_id) {
    await supabase
      .from("focus_blocks")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", existing.scheduled_block_id);
  }

  return {
    success: true,
    task: data,
    message: `Task deferred${deferDate ? ` to ${deferDate}` : " to someday"}`,
  };
}

export async function rescheduleTask(
  args: { task_id: string; new_date: string; new_time?: string; reason?: string },
  context?: ToolContext
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const { tenantId, userId } = resolveTaskContext({}, context);

  const newDate = normalizeDateInput(args.new_date);
  if (!newDate) throw new Error("new_date is required");

  const { data: existingRaw, error: fetchError } = await supabase
    .from("tasks")
    .select("id, name, scheduled_block_id, duration_minutes")
    .eq("tenant_id", tenantId)
    .eq("owner_id", userId)
    .eq("id", args.task_id)
    .single();

  if (fetchError || !existingRaw) throw new Error("Task not found");

  const existing = existingRaw as {
    id: string;
    name: string;
    scheduled_block_id: string | null;
    duration_minutes: number | null;
  };

  const { data, error } = await supabase
    .from("tasks")
    .update({
      do_date: newDate,
      committed_date: newDate,
      updated_at: new Date().toISOString(),
      scheduling_metadata: {
        last_rescheduled_at: new Date().toISOString(),
        reschedule_reason: args.reason || undefined,
      },
    } as never)
    .eq("tenant_id", tenantId)
    .eq("id", args.task_id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (existing.scheduled_block_id) {
    if (args.new_time) {
      const [hours, minutes] = args.new_time.split(":").map(Number);
      const startTime = new Date(newDate);
      startTime.setHours(hours, minutes, 0, 0);
      const duration = existing.duration_minutes || 30;
      const endTime = new Date(startTime.getTime() + duration * 60000);
      await supabase
        .from("focus_blocks")
        .update({
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq("tenant_id", tenantId)
        .eq("id", existing.scheduled_block_id);
    } else {
      await supabase
        .from("focus_blocks")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", existing.scheduled_block_id);

      await supabase
        .from("tasks")
        .update({ scheduled_block_id: null } as never)
        .eq("tenant_id", tenantId)
        .eq("id", args.task_id);
    }
  }

  return {
    success: true,
    task: data,
    message: `Task rescheduled to ${newDate}${args.new_time ? ` at ${args.new_time}` : ""}`,
  };
}

export async function getTodaySchedule(
  args: { include_backlog?: boolean; include_at_risk?: boolean },
  context?: ToolContext
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const { tenantId, userId } = resolveTaskContext({}, context);

  const today = new Date().toISOString().split("T")[0];
  const backlogFilter = "and(committed_date.is.null,do_date.is.null)";
  const orFilter = args.include_backlog
    ? `committed_date.lte.${today},do_date.lte.${today},due_date.lte.${today},${backlogFilter}`
    : `committed_date.lte.${today},do_date.lte.${today},due_date.lte.${today}`;

  const { data: tasksRaw, error: tasksErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("owner_id", userId)
    .neq("status", "done")
    .or(orFilter)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (tasksErr) throw new Error(tasksErr.message);

  const tasks = (tasksRaw as Task[]) || [];

  const committed = tasks.filter((t) => {
    const due = t.due_date?.slice(0, 10);
    return (
      t.committed_date === today ||
      t.do_date === today ||
      (due ? due <= today : false)
    );
  });

  const backlog = tasks.filter((t) => {
    const due = t.due_date?.slice(0, 10);
    const isCommitted =
      t.committed_date === today || t.do_date === today || (due ? due <= today : false);
    return !isCommitted;
  });

  const atRisk = args.include_at_risk
    ? tasks.filter((t) => {
        const due = t.due_date?.slice(0, 10);
        if (!due) return false;
        return due < today || (due === today && t.status === "todo") || t.scheduling_metadata?.at_risk;
      })
    : [];

  const endWindow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  const { data: blocksRaw } = await supabase
    .from("focus_blocks")
    .select("id,title,context,start_time,end_time,color,completed")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .gte("end_time", new Date().toISOString())
    .lte("start_time", endWindow.toISOString())
    .order("start_time", { ascending: true })
    .limit(12);

  return {
    success: true,
    today,
    committed,
    backlog: args.include_backlog ? backlog : [],
    focusBlocks: blocksRaw || [],
    atRisk: args.include_at_risk ? atRisk : [],
  };
}

export async function getBacklog(
  args: { context?: string; limit?: number },
  context?: ToolContext
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const { tenantId, userId } = resolveTaskContext({}, context);

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("owner_id", userId)
    .neq("status", "done")
    .is("committed_date", null)
    .is("do_date", null)
    .limit(args.limit || 20);

  if (args.context && args.context !== "all") {
    query = query.eq("context", args.context);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const PRIORITY_WEIGHTS: Record<TaskPriorityLevel, number> = {
    p1: 100,
    p2: 75,
    p3: 50,
    p4: 25,
  };

  const tasks = (data as Task[]) || [];
  tasks.sort((a, b) => {
    const ap = PRIORITY_WEIGHTS[a.priority_level || "p3"];
    const bp = PRIORITY_WEIGHTS[b.priority_level || "p3"];
    if (ap !== bp) return bp - ap;
    const ad = a.due_date || "";
    const bd = b.due_date || "";
    return ad.localeCompare(bd);
  });

  return { success: true, tasks, count: tasks.length };
}

export async function createRecurringTask(
  args: {
    name: string;
    context?: string;
    frequency: "daily" | "weekdays" | "weekly" | "biweekly" | "monthly";
    duration_minutes?: number;
    preferred_time?: string;
    auto_schedule?: boolean;
  },
  context?: ToolContext
) {
  const ruleMap: Record<string, string> = {
    daily: "FREQ=DAILY",
    weekdays: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    weekly: "FREQ=WEEKLY",
    biweekly: "FREQ=WEEKLY;INTERVAL=2",
    monthly: "FREQ=MONTHLY",
  };

  const recurrence_rule = ruleMap[args.frequency] || "FREQ=WEEKLY";

  const task = await createTask(
    {
      name: args.name,
      context: args.context || "house",
      duration_minutes: args.duration_minutes ?? 30,
      auto_schedule: args.auto_schedule ?? true,
      recurrence_rule,
      do_date: new Date().toISOString().split("T")[0],
    },
    context
  );

  return {
    success: true,
    task,
    message: `Recurring task created (${args.frequency})`,
  };
}

export async function getProjectStatus(args: { project_id: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", args.project_id)
    .single();
  if (error) throw new Error(error.message);
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", args.project_id);
  return { project, tasks: tasks || [] };
}

export async function getArmSummary(args: { arm: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const armId = await resolveArmId(args.arm);
  if (!armId) throw new Error("Arm not found");
  const { data: projects } = await supabase.from("projects").select("*").eq("arm_id", armId);
  const { data: contacts } = await supabase.from("contacts").select("*").eq("arm_id", armId);
  return {
    arm_id: armId,
    projects: projects || [],
    contacts: contacts || [],
  };
}

export async function searchContacts(args: { query: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .or(`name.ilike.%${args.query}%,email.ilike.%${args.query}%,company.ilike.%${args.query}%`)
    .limit(20);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getOverdueTasks() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .lt("due_date", today)
    .neq("status", "done");
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createDailyBriefing() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase not configured");
  const { data: projects } = await supabase.from("projects").select("*");
  const { data: tasks } = await supabase.from("tasks").select("*");
  const { data: contacts } = await supabase.from("contacts").select("*");

  return {
    projects: projects?.length || 0,
    tasks: tasks?.length || 0,
    contacts: contacts?.length || 0,
  };
}
