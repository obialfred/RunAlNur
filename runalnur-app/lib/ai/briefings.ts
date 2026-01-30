import { getSupabaseAdmin } from "@/lib/supabase/server";

interface ProjectRow {
  id: string;
  status: string;
}

interface TaskRow {
  id: string;
  status: string;
  due_date: string | null;
}

export async function generateDailyBriefing() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return "Supabase not configured. No briefing data available.";
  }

  const { data: projects } = await supabase.from("projects").select("*");
  const { data: tasks } = await supabase.from("tasks").select("*");
  const { data: contacts } = await supabase.from("contacts").select("*");

  const projectRows = (projects || []) as ProjectRow[];
  const taskRows = (tasks || []) as TaskRow[];

  const activeProjects = projectRows.filter(p => p.status === "in_progress");
  const overdueTasks = taskRows.filter(t => t.status !== "done" && t.due_date);

  return `Daily Briefing\n\nProjects: ${projectRows.length}\nActive: ${activeProjects.length}\nTasks: ${taskRows.length}\nOverdue Tasks: ${overdueTasks.length}\nContacts: ${(contacts || []).length}`;
}
