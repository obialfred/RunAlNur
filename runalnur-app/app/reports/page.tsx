"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { useProjects } from "@/lib/hooks/useProjects";
import { useTasks } from "@/lib/hooks/useTasks";
import { useContacts } from "@/lib/hooks/useContacts";
import { useActivities } from "@/lib/hooks/useActivities";
import { Button } from "@/components/ui/button";
import type { Activity } from "@/lib/types";

export default function ReportsPage() {
  const { data: projects } = useProjects();
  const { data: tasks } = useTasks();
  const { data: contacts } = useContacts();
  const { data: activities } = useActivities({ limit: 50 });

  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length;

  const handleExportJson = () => {
    const payload = {
      summary: {
        projects: projects.length,
        activeProjects,
        completedProjects,
        tasks: tasks.length,
        overdueTasks,
        contacts: contacts.length,
      },
      latestActivity: activities.slice(0, 20),
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `runalnur-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <FadeIn className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Empire metrics and operational summaries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-[10px] h-7 px-2" onClick={() => window.print()}>
            EXPORT PDF
          </Button>
          <Button size="sm" className="text-[10px] h-7 px-2" onClick={handleExportJson}>
            EXPORT JSON
          </Button>
        </div>
      </FadeIn>

      <FadeIn className="agentic-card">
        <div className="agentic-card-header">
          <h2 className="text-section">Summary</h2>
        </div>
        <div className="agentic-card-content grid grid-cols-2 md:grid-cols-3 gap-6">
          <ReportMetric label="Projects" value={projects.length} />
          <ReportMetric label="Active Projects" value={activeProjects} />
          <ReportMetric label="Completed" value={completedProjects} />
          <ReportMetric label="Tasks" value={tasks.length} />
          <ReportMetric label="Overdue Tasks" value={overdueTasks} highlight={overdueTasks > 0} />
          <ReportMetric label="Contacts" value={contacts.length} />
        </div>
      </FadeIn>

      <FadeIn className="agentic-card">
        <div className="agentic-card-header">
          <h2 className="text-section">Latest Activity</h2>
        </div>
        <div className="agentic-card-content space-y-3">
          {activities.slice(0, 10).map((activity: Activity) => (
            <div key={activity.id} className="text-sm">
              {activity.description}
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-xs text-muted-foreground">No recent activity</div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}

function ReportMetric({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="report-card-metric">
      <span className="label">{label}</span>
      <AnimatedNumber
        value={value}
        className={`text-2xl font-semibold tabular-nums ${highlight ? "text-[var(--error)]" : ""}`}
      />
    </div>
  );
}
