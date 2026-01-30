/**
 * Google Calendar API Client
 * 
 * Handles OAuth2 authentication and calendar operations
 */

// ============================================================================
// TYPES
// ============================================================================

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  colorId?: string;
  extendedProperties?: {
    private?: Record<string, string>;
  };
}

export interface CalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
  : "http://localhost:3000/api/calendar/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

// Google Calendar color IDs mapping
export const GOOGLE_COLOR_MAP: Record<string, string> = {
  "#3B82F6": "9",  // Blue (Nova)
  "#10B981": "10", // Green (Janna)
  "#8B5CF6": "1",  // Purple (OBX)
  "#F59E0B": "5",  // Amber (House/Silk)
  "#EC4899": "4",  // Pink (Personal)
  "#6B7280": "8",  // Gray (Admin/Maison)
  "#EF4444": "11", // Red (Training/ATW)
};

// ============================================================================
// OAUTH FUNCTIONS
// ============================================================================

/**
 * Generate OAuth2 authorization URL
 */
export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    ...(state && { state }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Failed to exchange code for tokens");
  }

  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || "Failed to refresh token");
  }

  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: refreshToken, // Keep original refresh token
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Revoke access token
 */
export async function revokeToken(token: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
    method: "POST",
  });
}

// ============================================================================
// CALENDAR OPERATIONS
// ============================================================================

class GoogleCalendarClient {
  private accessToken: string;
  private baseUrl = "https://www.googleapis.com/calendar/v3";

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get list of user's calendars
   */
  async listCalendars(): Promise<CalendarListEntry[]> {
    const data = await this.request<{ items: CalendarListEntry[] }>(
      "/users/me/calendarList"
    );
    return data.items || [];
  }

  /**
   * Get primary calendar ID
   */
  async getPrimaryCalendarId(): Promise<string> {
    const calendars = await this.listCalendars();
    const primary = calendars.find((c) => c.primary);
    return primary?.id || "primary";
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    calendarId: string,
    event: GoogleCalendarEvent
  ): Promise<GoogleCalendarEvent> {
    return this.request<GoogleCalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        body: JSON.stringify(event),
      }
    );
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    return this.request<GoogleCalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "PATCH",
        body: JSON.stringify(event),
      }
    );
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await fetch(
      `${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );
  }

  /**
   * Get events in a time range
   */
  async listEvents(
    calendarId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<GoogleCalendarEvent[]> {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
    });

    const data = await this.request<{ items: GoogleCalendarEvent[] }>(
      `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
    );

    return data.items || [];
  }

  /**
   * Get a single event by ID
   */
  async getEvent(
    calendarId: string,
    eventId: string
  ): Promise<GoogleCalendarEvent> {
    return this.request<GoogleCalendarEvent>(
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
    );
  }
}

/**
 * Create a Google Calendar client with a valid access token
 */
export function createCalendarClient(accessToken: string): GoogleCalendarClient {
  return new GoogleCalendarClient(accessToken);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert context color to Google Calendar color ID
 */
export function getGoogleColorId(hexColor: string): string | undefined {
  return GOOGLE_COLOR_MAP[hexColor];
}

/**
 * Create a Google Calendar event from a focus block
 */
export function focusBlockToGoogleEvent(block: {
  title: string;
  description?: string;
  start_time: Date | string;
  end_time: Date | string;
  context: string;
  color?: string;
  id: string;
}): GoogleCalendarEvent {
  const startTime = typeof block.start_time === "string" 
    ? new Date(block.start_time) 
    : block.start_time;
  const endTime = typeof block.end_time === "string" 
    ? new Date(block.end_time) 
    : block.end_time;

  return {
    summary: `[${block.context.toUpperCase()}] ${block.title}`,
    description: block.description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: "America/Chicago", // TODO: Get from user preferences
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: "America/Chicago",
    },
    colorId: block.color ? getGoogleColorId(block.color) : undefined,
    extendedProperties: {
      private: {
        dynastyBlockId: block.id,
        context: block.context,
      },
    },
  };
}
