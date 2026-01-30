// ClickUp API Integration
// Documentation: https://clickup.com/api

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

interface ClickUpConfig {
  apiKey: string;
  workspaceId?: string;
}

interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status: {
    status: string;
    color: string;
  };
  priority?: {
    priority: string;
    color: string;
  };
  due_date?: string;
  assignees?: Array<{
    id: number;
    username: string;
    email: string;
  }>;
  list: {
    id: string;
    name: string;
  };
  folder: {
    id: string;
    name: string;
  };
  space: {
    id: string;
    name: string;
  };
}

interface ClickUpList {
  id: string;
  name: string;
  folder: {
    id: string;
    name: string;
  };
  space: {
    id: string;
    name: string;
  };
}

interface ClickUpSpace {
  id: string;
  name: string;
  private: boolean;
}

interface ClickUpFolder {
  id: string;
  name: string;
  orderindex: number;
  hidden: boolean;
  space: {
    id: string;
    name: string;
  };
  lists: ClickUpList[];
}

export class ClickUpClient {
  private apiKey: string;
  private workspaceId?: string;

  constructor(config: ClickUpConfig) {
    this.apiKey = config.apiKey;
    this.workspaceId = config.workspaceId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${CLICKUP_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`ClickUp API Error: ${response.status} - ${error.err || response.statusText}`);
    }

    return response.json();
  }

  // Teams/Workspaces
  async getWorkspaces() {
    return this.request<{ teams: Array<{ id: string; name: string }> }>('/team');
  }

  // Spaces
  async getSpaces(teamId: string) {
    return this.request<{ spaces: ClickUpSpace[] }>(`/team/${teamId}/space`);
  }

  async getSpace(spaceId: string) {
    return this.request<ClickUpSpace>(`/space/${spaceId}`);
  }

  // Folders
  async getFolders(spaceId: string) {
    return this.request<{ folders: ClickUpFolder[] }>(`/space/${spaceId}/folder`);
  }

  async createFolder(spaceId: string, name: string) {
    return this.request<ClickUpFolder>(`/space/${spaceId}/folder`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // Lists
  async getLists(folderId: string) {
    return this.request<{ lists: ClickUpList[] }>(`/folder/${folderId}/list`);
  }

  async getFolderlessLists(spaceId: string) {
    return this.request<{ lists: ClickUpList[] }>(`/space/${spaceId}/list`);
  }

  async createList(folderId: string, name: string, options?: { status?: string }) {
    return this.request<ClickUpList>(`/folder/${folderId}/list`, {
      method: 'POST',
      body: JSON.stringify({ name, ...options }),
    });
  }

  async createFolderlessList(spaceId: string, name: string) {
    return this.request<ClickUpList>(`/space/${spaceId}/list`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  // Tasks
  async getTasks(listId: string, options?: {
    archived?: boolean;
    page?: number;
    subtasks?: boolean;
    include_closed?: boolean;
  }) {
    const params = new URLSearchParams();
    if (options?.archived) params.append('archived', 'true');
    if (options?.page) params.append('page', options.page.toString());
    if (options?.subtasks) params.append('subtasks', 'true');
    if (options?.include_closed) params.append('include_closed', 'true');

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ tasks: ClickUpTask[] }>(`/list/${listId}/task${query}`);
  }

  async getTask(taskId: string) {
    return this.request<ClickUpTask>(`/task/${taskId}`);
  }

  async createTask(listId: string, task: {
    name: string;
    description?: string;
    priority?: number; // 1 = Urgent, 2 = High, 3 = Normal, 4 = Low
    due_date?: number; // Unix timestamp in milliseconds
    status?: string;
    assignees?: number[];
  }) {
    return this.request<ClickUpTask>(`/list/${listId}/task`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(taskId: string, updates: {
    name?: string;
    description?: string;
    priority?: number;
    due_date?: number;
    status?: string;
    assignees?: { add?: number[]; rem?: number[] };
  }) {
    return this.request<ClickUpTask>(`/task/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(taskId: string) {
    return this.request<unknown>(`/task/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Task Comments
  async getTaskComments(taskId: string) {
    return this.request<{ comments: Array<{ id: string; comment_text: string; user: { username: string } }> }>(
      `/task/${taskId}/comment`
    );
  }

  async addTaskComment(taskId: string, comment: string) {
    return this.request<{ id: string; comment_text: string }>(`/task/${taskId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ comment_text: comment }),
    });
  }
}

// Priority mapping
export const CLICKUP_PRIORITY_MAP = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
} as const;

export const PRIORITY_FROM_CLICKUP = {
  1: 'critical',
  2: 'high',
  3: 'medium',
  4: 'low',
} as const;

// Create client singleton
let clickupClient: ClickUpClient | null = null;

export function getClickUpClient(): ClickUpClient | null {
  const apiKey = process.env.CLICKUP_API_KEY;
  
  if (!apiKey) {
    console.warn('ClickUp API key not configured');
    return null;
  }

  if (!clickupClient) {
    clickupClient = new ClickUpClient({
      apiKey,
      workspaceId: process.env.CLICKUP_WORKSPACE_ID,
    });
  }

  return clickupClient;
}

export type { ClickUpTask, ClickUpList, ClickUpSpace, ClickUpFolder };
