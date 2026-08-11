export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function avatarUrl(userId: string): string {
  return `${API_URL}/auth/users/${userId}/avatar`;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let refreshPromise: Promise<boolean> | null = null;

// Access tokens are short-lived; on a 401 (outside of auth endpoints
// themselves) try the refresh-token cookie once before giving up, so a
// mid-session token expiry doesn't look like a random logout. Concurrent
// 401s share one in-flight refresh instead of racing separate calls.
async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function parseError(res: Response): Promise<ApiError> {
  let detail = res.statusText;
  try {
    const body = await res.json();
    detail = body.detail ?? detail;
  } catch {
    // no JSON body
  }
  return new ApiError(res.status, detail);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

  let res = await doFetch();

  if (res.status === 401 && !path.startsWith("/auth/")) {
    if (await tryRefresh()) res = await doFetch();
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function requestForm<T>(path: string, formData: FormData, init?: RequestInit): Promise<T> {
  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...init,
      method: init?.method ?? "POST",
      credentials: "include",
      body: formData,
    });

  let res = await doFetch();

  if (res.status === 401 && !path.startsWith("/auth/")) {
    if (await tryRefresh()) res = await doFetch();
  }

  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<T>;
}

export type UserRole = "coach" | "client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  timezone: string;
}

export interface CoachProfile {
  portal_slug: string;
  business_name: string | null;
  niche: string | null;
  brand_color: string | null;
  logo_url: string | null;
  name: string;
  email: string;
  timezone: string;
}

export interface CoachProfileUpdate {
  name?: string;
  timezone?: string;
  business_name?: string;
  niche?: string;
}

export interface ClientSelfProfile {
  name: string;
  email: string;
  timezone: string;
  goals: string | null;
  program: string | null;
  coach_name: string;
  portal_slug: string | null;
}

export interface ClientSelfProfileUpdate {
  name?: string;
  timezone?: string;
}

export interface PortalPublic {
  business_name: string | null;
  niche: string | null;
  brand_color: string | null;
  logo_url: string | null;
  coach_name: string;
}

export type ClientStatus = "active" | "at_risk" | "paused" | "churned";

export interface ClientListItem {
  id: string;
  user_id: string;
  name: string;
  email: string;
  program: string | null;
  status: ClientStatus;
  joined_at: string;
  invite_pending: boolean;
}

export interface ClientDetail extends ClientListItem {
  goals: string | null;
  subscription_valid_until: string | null;
  tags: string[] | null;
  notes: string | null;
  thread_id: string | null;
  timezone: string;
}

export interface InviteInfo {
  invite_token: string;
  invite_path: string;
}

export interface ClientUpdate {
  name?: string;
  goals?: string;
  program?: string;
  tags?: string[];
  status?: ClientStatus;
}

// Client import
export interface ImportPreview {
  headers: string[];
  mapping: Record<string, string | null>;
  rows: Record<string, string>[];
  warnings: string[];
}

export interface ImportSkip {
  row: Record<string, string>;
  reason: string;
}

export interface ImportCommitResult {
  created: number;
  skipped: ImportSkip[];
}

// Goals
export interface ClientGoal {
  id: string;
  client_id: string;
  title: string;
  target_date: string | null;
  done: boolean;
  order: number;
  created_by: string;
  created_at: string;
}

// Progress
export interface ProgressEntry {
  id: string;
  client_id: string;
  created_by: string;
  created_by_name: string;
  note: string | null;
  media_type: string | null;
  entry_date: string;
  created_at: string;
}

export interface IntakeResponseData {
  id: string;
  goals: string | null;
  experience: string | null;
  availability: string | null;
  notes: string | null;
  submitted_at: string;
}

export type LeadStage = "new" | "contacted" | "follow_up" | "booked" | "converted";

export interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  interested_in: string | null;
  stage: LeadStage;
  notes: string | null;
  created_at: string;
  last_contacted_at: string | null;
  source: string;
  form_submission_id: string | null;
}

export type FormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "consent";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[] | null;
  placeholder?: string | null;
}

export interface CoachForm {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  fields: FormField[];
  is_active: boolean;
  created_at: string;
  submission_count: number;
}

export interface PublicForm {
  title: string;
  description: string | null;
  fields: FormField[];
  coach_name: string;
  business_name: string | null;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  answers: Record<string, string | string[]>;
  submitted_at: string;
}

export interface InvitePreview {
  name: string;
  email: string;
  coach_name: string;
  portal_slug: string | null;
}

export interface InviteAcceptResult {
  id: string;
  email: string;
  name: string;
  portal_slug: string | null;
}

// Tasks
export type TaskPriority = "low" | "medium" | "high";

export interface TaskData {
  id: string;
  title: string;
  due_date: string | null;
  done: boolean;
  priority: TaskPriority;
  is_recurring: boolean;
  added_by_user_id: string;
  added_by_name: string;
  added_by_role: UserRole;
  created_at: string;
}

// Documents
export interface DocumentData {
  id: string;
  name: string;
  type: string;
  uploaded_by_name: string;
  created_at: string;
  download_url: string;
}

// Chat
export type MessageType = "text" | "image" | "pdf" | "video" | "voice";

export interface MessageData {
  id: string;
  thread_id: string;
  sender_id: string;
  type: MessageType;
  body: string | null;
  media_url: string | null;
  created_at: string;
  read_at: string | null;
}

export interface ThreadData {
  id: string;
  client_id: string;
  client_name: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  timezone: string;
}

export interface ThreadPresence {
  user_id: string;
  online: boolean;
  last_seen_at: string | null;
}

// Calendar
export interface AvailabilityDays {
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
}

export interface AvailabilityRules {
  session_length: number;
  buffer: number;
  days: AvailabilityDays;
  slots: string[];
}

export type MeetingStatus = "scheduled" | "completed" | "canceled";

export interface MeetingData {
  id: string;
  client_id: string;
  client_name: string;
  starts_at: string;
  ends_at: string;
  status: MeetingStatus;
  meeting_url: string | null;
}

export type CalendarProviderKey = "google" | "zoom" | "calendly" | "cal_com";

export interface IntegrationStatus {
  provider: CalendarProviderKey;
  connected: boolean;
  account_label: string | null;
  connected_at: string | null;
}

export interface SchedulingLinks {
  calendly_url: string | null;
  cal_com_url: string | null;
}

// Check-ins
export type CheckinType = "daily" | "weekly";

export interface CheckinData {
  id: string;
  type: CheckinType;
  period_key: string;
  mood: string | null;
  one_liner: string | null;
  progress_notes: string | null;
  challenges: string | null;
  wins: string | null;
  submitted_at: string;
}

export interface CurrentCheckins {
  daily: CheckinData | null;
  weekly: CheckinData | null;
}

// Billing
export interface InvoiceData {
  id: string;
  amount: number;
  due_date: string;
  paid: boolean;
  created_at: string;
}

export type ClientBillingStatus = "not_set" | "active" | "renewal_due" | "overdue";

export interface ClientBilling {
  subscription_valid_until: string | null;
  status: ClientBillingStatus;
  invoices: InvoiceData[];
}

export type SubscriptionTier = "trial" | "starter" | "growth" | "scale" | "enterprise";
export type SubscriptionStatus = "trialing" | "active" | "trial_expired" | "past_due" | "canceled";

export interface PlatformSubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trial_ends_at: string;
  current_period_end: string | null;
  client_limit: number | null;
  active_client_count: number;
}

// AI
export interface BriefingData {
  bullets: string[];
  generated_at: string;
}

export interface RiskFlag {
  client_id: string;
  client_name: string;
  level: string;
  reason: string;
}

export interface SessionNoteResult {
  summary: string;
  action_items: string[];
  draft_message: string;
}

export interface ProgressInsight {
  insight: string;
  tasks_done: number;
  tasks_total: number;
}

// Notifications
export interface NotificationData {
  id: string;
  type: string;
  payload_json: { message?: string; client_name?: string; key?: string };
  read_at: string | null;
  created_at: string;
}

// Analytics
export interface AnalyticsSummary {
  active_clients: number;
  at_risk_clients: number;
  paused_clients: number;
  churned_clients: number;
  lead_conversion_rate: number;
  task_completion_rate: number;
  leads_total: number;
  leads_converted: number;
  tasks_total: number;
  tasks_done: number;
}

export interface WeekPoint {
  week: string;
  count: number;
}

export interface CheckinWeekPoint {
  week: string;
  checkins: number;
  active_clients: number;
  rate: number;
}

export interface FunnelPoint {
  stage: string;
  count: number;
}

export interface AnalyticsTimeseries {
  client_growth: WeekPoint[];
  lead_funnel: FunnelPoint[];
  checkin_rate: CheckinWeekPoint[];
}

export const api = {
  register: (body: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    timezone?: string;
  }) => request<User>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<User>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  logout: () => request<void>("/auth/logout", { method: "POST" }),

  me: () => request<User>("/auth/me"),

  uploadMyAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return requestForm<User>("/auth/me/avatar", form);
  },

  completeOnboarding: (body: {
    portal_slug: string;
    business_name?: string;
    niche: string;
    timezone?: string;
  }) => request<CoachProfile>("/coach/onboarding", { method: "POST", body: JSON.stringify(body) }),

  myProfile: () => request<CoachProfile>("/coach/me/profile"),

  updateMyProfile: (body: CoachProfileUpdate) =>
    request<CoachProfile>("/coach/me/profile", { method: "PATCH", body: JSON.stringify(body) }),

  portalBySlug: (slug: string) => request<PortalPublic>(`/portal/${slug}`),

  // Clients
  listClients: () => request<ClientListItem[]>("/clients"),

  createClient: (body: {
    name: string;
    email: string;
    phone?: string;
    program?: string;
    goals?: string;
  }) => request<ClientListItem>("/clients", { method: "POST", body: JSON.stringify(body) }),

  getClient: (id: string) => request<ClientDetail>(`/clients/${id}`),

  updateClientNotes: (id: string, notes: string) =>
    request<ClientDetail>(`/clients/${id}/notes`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    }),

  updateClient: (id: string, body: ClientUpdate) =>
    request<ClientDetail>(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  // Client import
  previewClientImport: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return requestForm<ImportPreview>("/clients/import/preview", form);
  },

  commitClientImport: (mapping: Record<string, string | null>, rows: Record<string, string>[]) =>
    request<ImportCommitResult>("/clients/import/commit", {
      method: "POST",
      body: JSON.stringify({ mapping, rows }),
    }),

  // Goals (coach side)
  listClientGoals: (clientId: string) => request<ClientGoal[]>(`/clients/${clientId}/goals`),

  createClientGoal: (clientId: string, body: { title: string; target_date?: string | null }) =>
    request<ClientGoal>(`/clients/${clientId}/goals`, { method: "POST", body: JSON.stringify(body) }),

  updateClientGoal: (
    clientId: string,
    goalId: string,
    body: { title?: string; target_date?: string | null; done?: boolean; order?: number }
  ) =>
    request<ClientGoal>(`/clients/${clientId}/goals/${goalId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteClientGoal: (clientId: string, goalId: string) =>
    request<void>(`/clients/${clientId}/goals/${goalId}`, { method: "DELETE" }),

  // Goals (client self-service)
  listMyGoals: () => request<ClientGoal[]>("/clients/me/goals"),

  createMyGoal: (body: { title: string; target_date?: string | null }) =>
    request<ClientGoal>("/clients/me/goals", { method: "POST", body: JSON.stringify(body) }),

  updateMyGoal: (
    goalId: string,
    body: { title?: string; target_date?: string | null; done?: boolean; order?: number }
  ) => request<ClientGoal>(`/clients/me/goals/${goalId}`, { method: "PATCH", body: JSON.stringify(body) }),

  deleteMyGoal: (goalId: string) => request<void>(`/clients/me/goals/${goalId}`, { method: "DELETE" }),

  // Progress (coach side)
  listClientProgress: (clientId: string) => request<ProgressEntry[]>(`/clients/${clientId}/progress`),

  createClientProgress: (clientId: string, note: string, entryDate: string, file?: File | null) => {
    const form = new FormData();
    if (note) form.append("note", note);
    if (entryDate) form.append("entry_date", entryDate);
    if (file) form.append("file", file);
    return requestForm<ProgressEntry>(`/clients/${clientId}/progress`, form);
  },

  // Progress (client self-service)
  listMyProgress: () => request<ProgressEntry[]>("/clients/me/progress"),

  createMyProgress: (note: string, entryDate: string, file?: File | null) => {
    const form = new FormData();
    if (note) form.append("note", note);
    if (entryDate) form.append("entry_date", entryDate);
    if (file) form.append("file", file);
    return requestForm<ProgressEntry>("/clients/me/progress", form);
  },

  progressMediaUrl: (entryId: string) => `${API_URL}/progress/${entryId}/media`,

  getClientInvite: (id: string) => request<InviteInfo>(`/clients/${id}/invite`),

  getClientIntake: (id: string) => request<IntakeResponseData>(`/clients/${id}/intake`),

  getMyPortal: () => request<{ portal_slug: string | null }>("/clients/me/portal"),

  getMyClientProfile: () => request<ClientSelfProfile>("/clients/me/profile"),

  updateMyClientProfile: (body: ClientSelfProfileUpdate) =>
    request<ClientSelfProfile>("/clients/me/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  getMyIntake: () => request<IntakeResponseData>("/clients/me/intake"),

  submitMyIntake: (body: {
    goals?: string;
    experience?: string;
    availability?: string;
    notes?: string;
  }) => request<IntakeResponseData>("/clients/me/intake", { method: "POST", body: JSON.stringify(body) }),

  // Leads
  listLeads: () => request<Lead[]>("/leads"),

  createLead: (body: {
    name: string;
    phone?: string;
    email?: string;
    interested_in?: string;
    notes?: string;
  }) => request<Lead>("/leads", { method: "POST", body: JSON.stringify(body) }),

  updateLeadStage: (id: string, stage: LeadStage) =>
    request<Lead>(`/leads/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stage }) }),

  convertLead: (id: string) =>
    request<ClientListItem>(`/leads/${id}/convert`, { method: "POST" }),

  // Forms
  listForms: () => request<CoachForm[]>("/forms"),

  createForm: (body: { title: string; description?: string; fields: FormField[] }) =>
    request<CoachForm>("/forms", { method: "POST", body: JSON.stringify(body) }),

  getForm: (id: string) => request<CoachForm>(`/forms/${id}`),

  updateForm: (
    id: string,
    body: { title?: string; description?: string; fields?: FormField[]; is_active?: boolean }
  ) => request<CoachForm>(`/forms/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  deleteForm: (id: string) => request<void>(`/forms/${id}`, { method: "DELETE" }),

  listFormSubmissions: (formId: string) =>
    request<FormSubmission[]>(`/forms/${formId}/submissions`),

  getFormSubmission: (submissionId: string) =>
    request<FormSubmission>(`/forms/submissions/${submissionId}`),

  getPublicForm: (slug: string, formSlug: string) =>
    request<PublicForm>(`/portal/${slug}/forms/${formSlug}`),

  submitPublicForm: (
    slug: string,
    formSlug: string,
    answers: Record<string, string | string[]>
  ) =>
    request<{ ok: boolean }>(`/portal/${slug}/forms/${formSlug}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  // Invite
  previewInvite: (token: string) => request<InvitePreview>(`/invite/${token}`),

  acceptInvite: (token: string, password: string) =>
    request<InviteAcceptResult>(`/invite/${token}/accept`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  // Tasks
  listClientTasks: (clientId: string) => request<TaskData[]>(`/clients/${clientId}/tasks`),

  addClientTask: (
    clientId: string,
    body: { title: string; due_date?: string; priority?: TaskPriority }
  ) =>
    request<TaskData>(`/clients/${clientId}/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listMyTasks: () => request<TaskData[]>("/clients/me/tasks"),

  addMyTask: (body: { title: string; due_date?: string; priority?: TaskPriority }) =>
    request<TaskData>("/clients/me/tasks", { method: "POST", body: JSON.stringify(body) }),

  updateTask: (
    id: string,
    body: { title?: string; due_date?: string; priority?: TaskPriority }
  ) => request<TaskData>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  toggleTaskComplete: (id: string) =>
    request<TaskData>(`/tasks/${id}/complete`, { method: "PATCH" }),

  // Documents
  listClientDocuments: (clientId: string) =>
    request<DocumentData[]>(`/documents?client_id=${clientId}`),

  uploadClientDocument: (clientId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return requestForm<DocumentData>(`/documents?client_id=${clientId}`, form);
  },

  listMyDocuments: () => request<DocumentData[]>("/documents/mine"),

  uploadMyDocument: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return requestForm<DocumentData>("/documents/mine", form);
  },

  // Chat
  listThreads: () => request<ThreadData[]>("/threads"),

  getMyThread: () => request<ThreadData>("/threads/me"),

  listMessages: (threadId: string) => request<MessageData[]>(`/threads/${threadId}/messages`),

  sendMessage: (threadId: string, body: string) =>
    request<MessageData>(`/threads/${threadId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  sendMediaMessage: (threadId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return requestForm<MessageData>(`/threads/${threadId}/messages/media`, form);
  },

  getThreadPresence: (threadId: string) =>
    request<ThreadPresence>(`/threads/${threadId}/presence`),

  markThreadRead: (threadId: string) =>
    request<void>(`/threads/${threadId}/read`, { method: "POST" }),

  // Calendar
  getMyAvailability: () => request<AvailabilityRules>("/coach/availability"),

  updateMyAvailability: (body: AvailabilityRules) =>
    request<AvailabilityRules>("/coach/availability", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  getCoachAvailability: () => request<AvailabilityRules>("/calendar/availability"),

  getSchedulingLinks: () => request<SchedulingLinks>("/calendar/scheduling-links"),

  listMeetings: () => request<MeetingData[]>("/meetings"),

  createMeeting: (body: { client_id: string; starts_at: string; ends_at: string }) =>
    request<MeetingData>("/meetings", { method: "POST", body: JSON.stringify(body) }),

  listMyMeetings: () => request<MeetingData[]>("/meetings/mine"),

  bookMeeting: (starts_at: string) =>
    request<MeetingData>("/meetings/book", { method: "POST", body: JSON.stringify({ starts_at }) }),

  // Integrations
  listIntegrations: () => request<IntegrationStatus[]>("/integrations"),

  disconnectIntegration: (provider: CalendarProviderKey) =>
    request<void>(`/integrations/${provider}`, { method: "DELETE" }),

  // Check-ins
  getMyCurrentCheckins: () => request<CurrentCheckins>("/clients/me/checkins/current"),

  submitMyCheckin: (body: {
    type: CheckinType;
    mood: string;
    one_liner?: string;
    progress_notes?: string;
    challenges?: string;
    wins?: string;
  }) => request<CheckinData>("/clients/me/checkins", { method: "POST", body: JSON.stringify(body) }),

  listClientCheckins: (clientId: string) =>
    request<CheckinData[]>(`/clients/${clientId}/checkins`),

  // Client billing
  getClientBilling: (clientId: string) => request<ClientBilling>(`/clients/${clientId}/billing`),

  updateClientSubscription: (clientId: string, subscriptionValidUntil: string | null) =>
    request<ClientBilling>(`/clients/${clientId}/subscription`, {
      method: "PATCH",
      body: JSON.stringify({ subscription_valid_until: subscriptionValidUntil }),
    }),

  addInvoice: (clientId: string, body: { amount: number; due_date: string }) =>
    request<InvoiceData>(`/clients/${clientId}/invoices`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  toggleInvoicePaid: (invoiceId: string) =>
    request<InvoiceData>(`/invoices/${invoiceId}/paid`, { method: "PATCH" }),

  // Platform billing
  getPlatformSubscription: () => request<PlatformSubscriptionData>("/coach/subscription"),

  selectPlan: (tier: SubscriptionTier) =>
    request<PlatformSubscriptionData>("/coach/subscription/select-plan", {
      method: "POST",
      body: JSON.stringify({ tier }),
    }),

  // AI
  getBriefing: () => request<BriefingData>("/ai/briefing"),

  getRiskFlags: () => request<RiskFlag[]>("/ai/risk-flags"),

  createSessionNote: (clientId: string, text: string) =>
    request<SessionNoteResult>("/ai/session-note", {
      method: "POST",
      body: JSON.stringify({ client_id: clientId, text }),
    }),

  sendFollowup: (clientId: string, draftMessage: string) =>
    request<void>("/ai/session-note/send", {
      method: "POST",
      body: JSON.stringify({ client_id: clientId, draft_message: draftMessage }),
    }),

  suggestReply: (threadId: string) =>
    request<{ draft: string }>("/ai/suggest-reply", {
      method: "POST",
      body: JSON.stringify({ thread_id: threadId }),
    }),

  getClientProgressInsight: (clientId: string) =>
    request<ProgressInsight>(`/ai/clients/${clientId}/progress-insight`),

  getMyProgressInsight: () => request<ProgressInsight>("/ai/clients/me/progress-insight"),

  // Notifications
  listNotifications: () => request<NotificationData[]>("/notifications"),

  markNotificationRead: (id: string) =>
    request<NotificationData>(`/notifications/${id}/read`, { method: "PATCH" }),

  markAllNotificationsRead: () => request<void>("/notifications/read-all", { method: "POST" }),

  // Analytics
  getAnalyticsSummary: () => request<AnalyticsSummary>("/analytics/summary"),

  getAnalyticsTimeseries: () => request<AnalyticsTimeseries>("/analytics/timeseries"),
};
