// Process Street API Integration
// Documentation: https://developer.process.st/

const PROCESS_STREET_API_BASE = 'https://api.process.st/api/v1.1';

interface ProcessStreetConfig {
  apiKey: string;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  folder_id?: string;
  created_at: string;
  updated_at: string;
}

interface WorkflowRun {
  id: string;
  workflow_id: string;
  name: string;
  status: 'Active' | 'Completed' | 'Archived';
  created_at: string;
  completed_at?: string;
}

interface Task {
  id: string;
  workflow_run_id: string;
  name: string;
  description?: string;
  status: 'NotStarted' | 'InProgress' | 'Completed' | 'Skipped';
  due_date?: string;
  assignee_email?: string;
}

interface TaskUpdate {
  status?: Task['status'];
  assignee_email?: string;
  form_fields?: Record<string, unknown>;
}

export class ProcessStreetClient {
  private apiKey: string;

  constructor(config: ProcessStreetConfig) {
    this.apiKey = config.apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${PROCESS_STREET_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Process Street API Error: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // Workflows (Templates)
  async getWorkflows() {
    return this.request<{ workflows: Workflow[] }>('/workflows');
  }

  async getWorkflow(workflowId: string) {
    return this.request<Workflow>(`/workflows/${workflowId}`);
  }

  // Workflow Runs (Checklists)
  async getWorkflowRuns(workflowId: string, options?: { status?: string }) {
    const params = new URLSearchParams();
    params.append('workflow_id', workflowId);
    if (options?.status) params.append('status', options.status);

    return this.request<{ workflow_runs: WorkflowRun[] }>(`/workflow-runs?${params.toString()}`);
  }

  async getWorkflowRun(workflowRunId: string) {
    return this.request<WorkflowRun>(`/workflow-runs/${workflowRunId}`);
  }

  async createWorkflowRun(workflowId: string, data: {
    name: string;
    assignee_email?: string;
  }) {
    return this.request<WorkflowRun>('/workflow-runs', {
      method: 'POST',
      body: JSON.stringify({
        workflow_id: workflowId,
        ...data,
      }),
    });
  }

  async updateWorkflowRun(workflowRunId: string, data: {
    name?: string;
    status?: WorkflowRun['status'];
  }) {
    return this.request<WorkflowRun>(`/workflow-runs/${workflowRunId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Tasks
  async getTasks(workflowRunId: string) {
    return this.request<{ tasks: Task[] }>(`/workflow-runs/${workflowRunId}/tasks`);
  }

  async getTask(taskId: string) {
    return this.request<Task>(`/tasks/${taskId}`);
  }

  async updateTask(taskId: string, data: TaskUpdate) {
    return this.request<Task>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Complete a task
  async completeTask(taskId: string) {
    return this.updateTask(taskId, { status: 'Completed' });
  }

  // Skip a task
  async skipTask(taskId: string) {
    return this.updateTask(taskId, { status: 'Skipped' });
  }
}

// Create client singleton
let processStreetClient: ProcessStreetClient | null = null;

export function getProcessStreetClient(): ProcessStreetClient | null {
  const apiKey = process.env.PROCESS_STREET_API_KEY;
  
  if (!apiKey) {
    console.warn('Process Street API key not configured');
    return null;
  }

  if (!processStreetClient) {
    processStreetClient = new ProcessStreetClient({ apiKey });
  }

  return processStreetClient;
}

// Pre-defined SOP templates for House Al Nur
export const HOUSE_AL_NUR_SOPS = {
  JANNA_PROPERTY_ACQUISITION: 'janna-property-acquisition',
  JANNA_RENOVATION_PROJECT: 'janna-renovation-project',
  NOVA_PRODUCT_LAUNCH: 'nova-product-launch',
  NOVA_WEBSITE_LAUNCH: 'nova-website-launch',
  HOUSE_WEEKLY_REVIEW: 'house-weekly-review',
  HOUSE_MONTHLY_REPORT: 'house-monthly-report',
  ATW_CONTENT_PIPELINE: 'atw-content-pipeline',
} as const;

export type { Workflow, WorkflowRun, Task };
