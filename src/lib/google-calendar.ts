/**
 * Google Calendar OAuth + Events integration
 *
 * Flow:
 * 1. User clicks "Connect Google Calendar" → redirect to /api/calendar/google/connect
 * 2. /connect builds the Google OAuth URL and redirects
 * 3. User approves → Google redirects to /api/calendar/google/callback
 * 4. /callback exchanges code for tokens, stores in calendar_connections
 * 5. When a showing is booked, createCalendarEvent() is called
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

// ---------------------------------------------------------------------------
// Build the Google OAuth authorization URL
// ---------------------------------------------------------------------------
export function buildGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`;

  if (!clientId) throw new Error("GOOGLE_CALENDAR_CLIENT_ID not set");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",         // force refresh_token issuance
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Exchange authorization code for access + refresh tokens
// ---------------------------------------------------------------------------
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  email?: string;
}> {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokens = await res.json();

  // Fetch user email
  let email: string | undefined;
  try {
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const userInfo = await userRes.json();
    email = userInfo.email;
  } catch {
    // non-critical
  }

  return { ...tokens, email };
}

// ---------------------------------------------------------------------------
// Refresh an expired access token using the stored refresh_token
// ---------------------------------------------------------------------------
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${err}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Create a Google Calendar event for a showing
// ---------------------------------------------------------------------------
export interface ShowingEventParams {
  accessToken: string;
  calendarId?: string;
  title: string;
  description?: string;
  startISO: string;   // ISO 8601
  durationMinutes?: number;
  attendeeEmails?: string[];
  location?: string;
  addMeet?: boolean;
}

export interface CalendarEventResult {
  eventId: string;
  htmlLink: string;
  meetLink?: string;
}

export async function createCalendarEvent(
  params: ShowingEventParams
): Promise<CalendarEventResult> {
  const {
    accessToken,
    calendarId = "primary",
    title,
    description,
    startISO,
    durationMinutes = 30,
    attendeeEmails = [],
    location,
    addMeet = true,
  } = params;

  const startDate = new Date(startISO);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);

  const body: Record<string, unknown> = {
    summary: title,
    description: description ?? "",
    start: { dateTime: startDate.toISOString(), timeZone: "America/Bogota" },
    end: { dateTime: endDate.toISOString(), timeZone: "America/Bogota" },
    attendees: attendeeEmails.map((email) => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 1440 },  // 24h before
        { method: "popup", minutes: 30 },
      ],
    },
  };

  if (location) body.location = location;
  if (addMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: `nocomiss-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const url = `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events${addMeet ? "?conferenceDataVersion=1" : ""}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Calendar event creation failed: ${err}`);
  }

  const event = await res.json();

  return {
    eventId: event.id,
    htmlLink: event.htmlLink,
    meetLink: event.conferenceData?.entryPoints?.find(
      (ep: { entryPointType: string; uri: string }) => ep.entryPointType === "video"
    )?.uri,
  };
}

// ---------------------------------------------------------------------------
// Delete a calendar event (on showing cancellation)
// ---------------------------------------------------------------------------
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId = "primary"
): Promise<void> {
  await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
}

// ---------------------------------------------------------------------------
// Check if token is expired and refresh if needed
// Returns a valid access token.
// ---------------------------------------------------------------------------
export async function getValidAccessToken(connection: {
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
}): Promise<string> {
  const { google_access_token, google_refresh_token, google_token_expiry } = connection;

  if (!google_refresh_token) throw new Error("No refresh token stored");

  const isExpired =
    !google_token_expiry ||
    new Date(google_token_expiry) <= new Date(Date.now() + 60_000); // 1 min buffer

  if (!isExpired && google_access_token) return google_access_token;

  const { access_token } = await refreshAccessToken(google_refresh_token);
  return access_token;
}
