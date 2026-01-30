// HubSpot API Integration
// Documentation: https://developers.hubspot.com/docs/api/overview

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

interface HubSpotConfig {
  accessToken: string;
}

interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobtitle?: string;
    lifecyclestage?: string;
    hs_lead_status?: string;
    [key: string]: string | undefined;
  };
  createdAt: string;
  updatedAt: string;
}

interface HubSpotCompany {
  id: string;
  properties: {
    name?: string;
    domain?: string;
    industry?: string;
    phone?: string;
    city?: string;
    country?: string;
    [key: string]: string | undefined;
  };
  createdAt: string;
  updatedAt: string;
}

interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    pipeline?: string;
    [key: string]: string | undefined;
  };
  createdAt: string;
  updatedAt: string;
}

interface SearchResult<T> {
  total: number;
  results: T[];
}

export class HubSpotClient {
  private accessToken: string;

  constructor(config: HubSpotConfig) {
    this.accessToken = config.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${HUBSPOT_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`HubSpot API Error: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  }

  // Contacts
  async getContacts(options?: {
    limit?: number;
    after?: string;
    properties?: string[];
  }) {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.after) params.append('after', options.after);
    if (options?.properties) {
      options.properties.forEach(p => params.append('properties', p));
    } else {
      // Default properties
      ['firstname', 'lastname', 'email', 'phone', 'company', 'jobtitle'].forEach(
        p => params.append('properties', p)
      );
    }

    return this.request<{ results: HubSpotContact[]; paging?: { next?: { after: string } } }>(
      `/crm/v3/objects/contacts?${params.toString()}`
    );
  }

  async getContact(contactId: string, properties?: string[]) {
    const params = new URLSearchParams();
    if (properties) {
      properties.forEach(p => params.append('properties', p));
    }

    return this.request<HubSpotContact>(
      `/crm/v3/objects/contacts/${contactId}?${params.toString()}`
    );
  }

  async createContact(properties: Record<string, string>) {
    return this.request<HubSpotContact>('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({ properties }),
    });
  }

  async updateContact(contactId: string, properties: Record<string, string>) {
    return this.request<HubSpotContact>(`/crm/v3/objects/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    });
  }

  async searchContacts(query: string, properties?: string[]) {
    return this.request<SearchResult<HubSpotContact>>('/crm/v3/objects/contacts/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        properties: properties || ['firstname', 'lastname', 'email', 'phone', 'company', 'jobtitle'],
      }),
    });
  }

  // Companies
  async getCompanies(options?: {
    limit?: number;
    after?: string;
    properties?: string[];
  }) {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.after) params.append('after', options.after);
    if (options?.properties) {
      options.properties.forEach(p => params.append('properties', p));
    }

    return this.request<{ results: HubSpotCompany[]; paging?: { next?: { after: string } } }>(
      `/crm/v3/objects/companies?${params.toString()}`
    );
  }

  async createCompany(properties: Record<string, string>) {
    return this.request<HubSpotCompany>('/crm/v3/objects/companies', {
      method: 'POST',
      body: JSON.stringify({ properties }),
    });
  }

  // Deals
  async getDeals(options?: {
    limit?: number;
    after?: string;
    properties?: string[];
  }) {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.after) params.append('after', options.after);
    if (options?.properties) {
      options.properties.forEach(p => params.append('properties', p));
    }

    return this.request<{ results: HubSpotDeal[]; paging?: { next?: { after: string } } }>(
      `/crm/v3/objects/deals?${params.toString()}`
    );
  }

  async createDeal(properties: Record<string, string>) {
    return this.request<HubSpotDeal>('/crm/v3/objects/deals', {
      method: 'POST',
      body: JSON.stringify({ properties }),
    });
  }

  async updateDeal(dealId: string, properties: Record<string, string>) {
    return this.request<HubSpotDeal>(`/crm/v3/objects/deals/${dealId}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties }),
    });
  }

  // Associations
  async associateContactWithCompany(contactId: string, companyId: string) {
    return this.request(`/crm/v4/objects/contacts/${contactId}/associations/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify([{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }]),
    });
  }

  async associateContactWithDeal(contactId: string, dealId: string) {
    return this.request(`/crm/v4/objects/contacts/${contactId}/associations/deals/${dealId}`, {
      method: 'PUT',
      body: JSON.stringify([{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }]),
    });
  }
}

// Create client singleton
let hubspotClient: HubSpotClient | null = null;

export function getHubSpotClient(): HubSpotClient | null {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.warn('HubSpot access token not configured');
    return null;
  }

  if (!hubspotClient) {
    hubspotClient = new HubSpotClient({ accessToken });
  }

  return hubspotClient;
}

// Helper to convert HubSpot contact to our Contact type
export function hubspotContactToContact(hsContact: HubSpotContact, armId: string) {
  return {
    id: hsContact.id,
    name: `${hsContact.properties.firstname || ''} ${hsContact.properties.lastname || ''}`.trim() || 'Unknown',
    email: hsContact.properties.email,
    phone: hsContact.properties.phone,
    company: hsContact.properties.company,
    role: hsContact.properties.jobtitle,
    arm_id: armId,
    hubspot_id: hsContact.id,
    created_at: hsContact.createdAt,
    updated_at: hsContact.updatedAt,
    tags: [],
  };
}

export type { HubSpotContact, HubSpotCompany, HubSpotDeal };
