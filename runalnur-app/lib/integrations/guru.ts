// Guru API Integration
// Documentation: https://developer.getguru.com/
// Auth: Basic Auth with email:token (base64 encoded)

const GURU_API_BASE = "https://api.getguru.com/api/v1";

interface GuruConfig {
  email: string;
  token: string;
}

interface GuruCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
  publicCardsEnabled?: boolean;
  dateCreated?: string;
}

interface GuruCard {
  id: string;
  slug?: string;
  preferredPhrase: string; // This is the title
  content: string;
  htmlContent?: boolean;
  collection?: {
    id: string;
    name: string;
  };
  boards?: Array<{
    id: string;
    title: string;
  }>;
  tags?: Array<{
    id: string;
    value: string;
  }>;
  verificationState?: string;
  verificationInterval?: number;
  verifier?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  owner?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  lastVerifiedBy?: {
    id: string;
    email: string;
  };
  lastModifiedBy?: {
    id: string;
    email: string;
  };
  dateCreated: string;
  lastModified: string;
  lastVerified?: string;
  shareStatus?: string;
}

interface GuruBoard {
  id: string;
  title: string;
  description?: string;
  collection?: {
    id: string;
    name: string;
  };
  items?: Array<{
    id: string;
    type: string;
    itemId: string;
  }>;
}

export class GuruClient {
  private email: string;
  private token: string;
  private authHeader: string;

  constructor(config: GuruConfig | string) {
    if (typeof config === 'string') {
      // Parse "email:token" format
      const [email, token] = config.split(':');
      if (!email || !token) {
        throw new Error('Guru config must be in "email:token" format');
      }
      this.email = email;
      this.token = token;
    } else {
      this.email = config.email;
      this.token = config.token;
    }
    
    // Guru uses Basic Auth with email:token base64 encoded
    const credentials = `${this.email}:${this.token}`;
    this.authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${GURU_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Guru API error ${response.status}`;
      try {
        const error = JSON.parse(errorText);
        errorMessage = error?.message || error?.error || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const text = await response.text();
    if (!text) return [] as T;
    return JSON.parse(text) as T;
  }

  // Test connection by fetching collections
  async testConnection(): Promise<boolean> {
    try {
      await this.getCollections();
      return true;
    } catch {
      return false;
    }
  }

  // Get all collections
  async getCollections(): Promise<GuruCollection[]> {
    return this.request<GuruCollection[]>("/collections");
  }

  // Get a single collection
  async getCollection(collectionId: string): Promise<GuruCollection> {
    return this.request<GuruCollection>(`/collections/${collectionId}`);
  }

  // List all cards (paginated)
  async listCards(options?: { query?: string; limit?: number }): Promise<GuruCard[]> {
    // Guru search endpoint
    const searchBody = {
      searchTerms: options?.query || "",
      maxResults: options?.limit || 100,
    };
    
    const response = await this.request<{ results: GuruCard[] } | GuruCard[]>(
      "/search/query",
      {
        method: "POST",
        body: JSON.stringify(searchBody),
      }
    );
    
    // Handle both response formats
    if (Array.isArray(response)) {
      return response;
    }
    return response.results || [];
  }

  // Get all cards (using search with empty query)
  async getAllCards(): Promise<GuruCard[]> {
    return this.listCards({ limit: 500 });
  }

  // Alias for backwards compatibility
  async getCards(options?: { query?: string; limit?: number }) {
    const cards = await this.listCards(options);
    return { cards };
  }

  // Get a single card by ID
  async getCard(cardId: string): Promise<GuruCard> {
    return this.request<GuruCard>(`/cards/${cardId}`);
  }

  // Search cards with query
  async searchCards(query: string): Promise<GuruCard[]> {
    return this.listCards({ query });
  }

  // Get boards
  async getBoards(): Promise<GuruBoard[]> {
    return this.request<GuruBoard[]>("/boards");
  }

  // Get a single board with items
  async getBoard(boardId: string): Promise<GuruBoard> {
    return this.request<GuruBoard>(`/boards/${boardId}`);
  }

  // Get cards in a collection
  async getCardsInCollection(collectionId: string): Promise<GuruCard[]> {
    return this.request<GuruCard[]>(`/collections/${collectionId}/cards`);
  }

  // ============ WRITE OPERATIONS ============

  // Create a new collection
  async createCollection(options: {
    name: string;
    description?: string;
    color?: string;
    collectionType?: 'INTERNAL' | 'EXTERNAL';
  }): Promise<GuruCollection> {
    return this.request<GuruCollection>('/collections', {
      method: 'POST',
      body: JSON.stringify({
        name: options.name,
        description: options.description || '',
        color: options.color || '#6B7280',
        collectionType: options.collectionType || 'INTERNAL',
        publicCardsEnabled: false,
      }),
    });
  }

  // Create a new card
  async createCard(options: {
    title: string;
    content: string;
    collectionId: string;
    folderIds?: string[];
    tags?: string[];
  }): Promise<GuruCard> {
    const body: Record<string, unknown> = {
      preferredPhrase: options.title,
      content: options.content,
      shareStatus: 'TEAM',
      collection: { id: options.collectionId },
    };

    if (options.folderIds?.length) {
      body.folderIds = options.folderIds;
    }

    return this.request<GuruCard>('/cards', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Update an existing card
  async updateCard(cardId: string, options: {
    title?: string;
    content?: string;
  }): Promise<GuruCard> {
    const body: Record<string, unknown> = {};
    if (options.title) body.preferredPhrase = options.title;
    if (options.content) body.content = options.content;

    return this.request<GuruCard>(`/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // Delete a card
  async deleteCard(cardId: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}`, {
      method: 'DELETE',
    });
  }

  // Create a folder in a collection
  async createFolder(options: {
    title: string;
    collectionId: string;
    parentFolderId?: string;
  }): Promise<{ id: string; title: string }> {
    return this.request<{ id: string; title: string }>('/folders', {
      method: 'POST',
      body: JSON.stringify({
        title: options.title,
        collection: { id: options.collectionId },
        ...(options.parentFolderId && { parentFolder: { id: options.parentFolderId } }),
      }),
    });
  }

  // Get folders in a collection
  async getFolders(collectionId: string): Promise<Array<{ id: string; title: string }>> {
    return this.request<Array<{ id: string; title: string }>>(`/folders?collection=${collectionId}`);
  }
}

// Create client singleton
let guruClient: GuruClient | null = null;

export function getGuruClient(credentials?: string): GuruClient | null {
  // Allow passing credentials directly (for user-specific clients)
  if (credentials) {
    return new GuruClient(credentials);
  }

  // Use environment variables
  const email = process.env.GURU_USER_EMAIL;
  const token = process.env.GURU_USER_TOKEN;
  
  if (!email || !token) {
    // Try legacy single-key format
    const legacyKey = process.env.GURU_API_KEY;
    if (legacyKey && legacyKey.includes(':')) {
      if (!guruClient) {
        guruClient = new GuruClient(legacyKey);
      }
      return guruClient;
    }
    return null;
  }

  // Use singleton for env-based client
  if (!guruClient) {
    guruClient = new GuruClient({ email, token });
  }
  return guruClient;
}

// Reset singleton (useful for testing or when credentials change)
export function resetGuruClient(): void {
  guruClient = null;
}

export type { GuruCard, GuruCollection, GuruBoard, GuruConfig };
