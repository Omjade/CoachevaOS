// NEXT_PUBLIC_API_URL should always be set explicitly in Vercel's project
// env vars — this fallback exists only so a build/preview that forgot to set
// it doesn't silently try to reach localhost from a deployed site.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production" ? "https://api.coachevaos.com" : "http://localhost:8000");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Render's free tier spins the API down after ~15 minutes idle and takes
// roughly 30-60s to wake on the next request — during that window a request
// can fail outright (network error) or the platform proxy can return a
// 502/503 while the instance is still starting. This retries only those two
// cases, with backoff, so a cold start reads as "a bit slow" instead of "the
// app is down." It does not retry any response the app itself returned
// (4xx/5xx from real request handling) — those are real errors, not a
// cold-start symptom, and must surface immediately.
async function fetchWithColdStartRetry(doFetch: () => Promise<Response>, attempts = 4): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await doFetch();
      if ((res.status === 502 || res.status === 503) && i < attempts - 1) {
        await sleep(750 * 2 ** i);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1) throw err;
      await sleep(750 * 2 ** i);
    }
  }
  throw lastErr;
}

export function avatarUrl(userId: string): string {
  return `${API_URL}/auth/users/${userId}/avatar`;
}

export function formImageUrl(formId: string): string {
  return `${API_URL}/forms/${formId}/image`;
}

export function publicFormImageUrl(slug: string, formSlug: string): string {
  return `${API_URL}/portal/${slug}/forms/${formSlug}/image`;
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

  let res = await fetchWithColdStartRetry(doFetch);

  if (res.status === 401 && !path.startsWith("/auth/")) {
    if (await tryRefresh()) res = await fetchWithColdStartRetry(doFetch);
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

  let res = await fetchWithColdStartRetry(doFetch);

  if (res.status === 401 && !path.startsWith("/auth/")) {
    if (await tryRefresh()) res = await fetchWithColdStartRetry(doFetch);
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
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
  mfa_enabled: boolean;
}

export interface MfaSetup {
  secret: string;
  otpauth_uri: string;
  qr_data_uri: string;
}

export interface MfaEnableResult {
  backup_codes: string[];
}

export interface MfaRequired {
  mfa_required: true;
  challenge_token: string;
}

export function isMfaRequired(
  result: User | MfaRequired | CoachChoiceRequired
): result is MfaRequired {
  return "mfa_required" in result;
}

export interface CoachChoice {
  coach_id: string;
  business_name: string;
  portal_slug: string | null;
}

export interface CoachChoiceRequired {
  coach_choice_required: true;
  challenge_token: string;
  choices: CoachChoice[];
}

export function isCoachChoiceRequired(
  result: User | MfaRequired | CoachChoiceRequired
): result is CoachChoiceRequired {
  return "coach_choice_required" in result;
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
  billing_country_code: string | null;
  bio: string | null;
  website_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  gallery_image_urls: string[] | null;
}

export interface CoachProfileUpdate {
  name?: string;
  timezone?: string;
  business_name?: string;
  niche?: string;
  billing_country_code?: string;
  bio?: string;
  website_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
}

export interface ClientSelfProfile {
  id: string;
  name: string;
  email: string;
  timezone: string;
  goals: string | null;
  program: string | null;
  coach_name: string;
  portal_slug: string | null;
  subscription_valid_from: string | null;
  subscription_valid_until: string | null;
  billing_status: ClientBillingStatus;
  niche: string | null;
  phone: string | null;
  status: ClientStatus;
  billing_currency: string | null;
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
  bio: string | null;
  website_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  gallery_image_urls: string[] | null;
}

export type ClientStatus = "active" | "at_risk" | "paused" | "churned";

export interface ClientListItem {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
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
  niche: string | null;
  billing_currency: string | null;
}

export interface InviteInfo {
  invite_token: string;
  invite_path: string;
}

export interface ClientUpdate {
  name?: string;
  phone?: string;
  goals?: string;
  program?: string;
  niche?: string;
  tags?: string[];
  status?: ClientStatus;
  billing_currency?: string;
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

export type LeadStage = "new" | "contacted" | "follow_up" | "booked" | "converted" | "lost";

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
  has_image: boolean;
}

export interface PublicForm {
  title: string;
  description: string | null;
  fields: FormField[];
  coach_name: string;
  business_name: string | null;
  has_image: boolean;
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
  existing_account: boolean;
}

export interface InviteAcceptResult {
  id: string;
  client_id: string;
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
  is_library: boolean;
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
  client_timezone: string | null;
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

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: string | null;
  end: string | null;
  all_day_date: string | null;
  hangout_link: string | null;
  html_link: string | null;
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
  currency: string;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export type ClientBillingStatus = "not_set" | "active" | "renewal_due" | "overdue";

export interface ClientBilling {
  subscription_valid_from: string | null;
  subscription_valid_until: string | null;
  status: ClientBillingStatus;
  billing_currency: string | null;
  invoices: InvoiceData[];
}

export type SubscriptionTier = "trial" | "starter" | "growth" | "scale" | "pro" | "enterprise";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "trial_expired"
  | "past_due"
  | "restricted"
  | "canceled";
export type PaymentProvider = "paddle" | "razorpay";
export type BillingCycle = "monthly" | "annual";

export interface PlatformSubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trial_ends_at: string;
  current_period_end: string | null;
  client_limit: number | null;
  active_client_count: number;
  provider: PaymentProvider | null;
  currency: string | null;
  billing_cycle: BillingCycle | null;
  cancel_at_period_end: boolean;
  grace_period_ends_at: string | null;
}

// AI
export interface BriefingData {
  bullets: string[];
  generated_at: string;
}

export interface SuggestedGoalUpdate {
  title: string;
  target_date: string | null;
}

export interface SuggestedTask {
  title: string;
  due_date: string | null;
}

export interface SessionNoteResult {
  summary: string;
  action_items: string[];
  draft_message: string;
  suggested_goal_updates: SuggestedGoalUpdate[];
  suggested_tasks: SuggestedTask[];
}

export interface ProgressInsight {
  insight: string;
  tasks_done: number;
  tasks_total: number;
}

export interface ChurnScorePoint {
  date: string;
  score: number;
  explanation: string | null;
}

export interface ChurnTrend {
  client_id: string;
  points: ChurnScorePoint[];
}

export interface PrepMyDayItem {
  client_name: string;
  meeting_time: string;
  reminder: string;
}

export interface PrepMyDayData {
  items: PrepMyDayItem[];
  generated_at: string;
}

export interface OnboardingGoalSuggestion {
  title: string;
  target_date: string | null;
}

export interface OnboardingDraft {
  welcome_message: string;
  suggested_goals: OnboardingGoalSuggestion[];
  suggested_cadence: string;
}

export interface WeeklyDigestData {
  bullets: string[];
  generated_at: string;
}

export interface InvoiceReminderDraft {
  draft_message: string;
}

export interface ProgramItemDraft {
  title: string;
  description: string;
  target_metric: string | null;
}

export interface ProgramDraft {
  title: string;
  items: ProgramItemDraft[];
}

export type ProgramItemKind = "milestone" | "task" | "goal" | "form";

export interface ProgramItem {
  id: string;
  order: number;
  title: string;
  description: string | null;
  target_metric: string | null;
  week_number: number | null;
  item_kind: ProgramItemKind;
  linked_form_id: string | null;
}

export interface Program {
  id: string;
  client_id: string | null;
  title: string;
  niche: string | null;
  created_at: string;
  items: ProgramItem[];
  assigned_from_template_id: string | null;
  duration_weeks: number | null;
  started_at: string | null;
  description: string | null;
  checkin_cadence: string | null;
  price_amount: number | null;
  price_currency: string | null;
  billing_cadence: string | null;
}

export interface ProgramItemInput {
  title: string;
  description?: string;
  target_metric?: string;
  week_number?: number;
  item_kind?: ProgramItemKind;
  linked_form_id?: string;
}

export interface ProgramTemplate {
  id: string;
  title: string;
  niche: string | null;
  duration_weeks: number | null;
  description: string | null;
  checkin_cadence: string | null;
  price_amount: number | null;
  price_currency: string | null;
  billing_cadence: string | null;
  client_selectable: boolean;
  created_at: string;
  items: ProgramItem[];
  assigned_count: number;
}

export interface ProgramTemplateInput {
  title: string;
  niche?: string;
  duration_weeks?: number;
  description?: string;
  checkin_cadence?: string;
  price_amount?: number;
  price_currency?: string;
  billing_cadence?: string;
  client_selectable?: boolean;
  items?: ProgramItemInput[];
}

export interface ProgramTemplateDraft {
  title: string;
  description: string | null;
  items: {
    title: string;
    description: string | null;
    target_metric: string | null;
    week_number: number | null;
    item_kind: ProgramItemKind;
  }[];
}

export interface AssistantSettings {
  enabled: boolean;
  tone: string | null;
  style_notes: string | null;
  custom_instructions: string | null;
  daily_query_limit: number;
  platform_query_ceiling: number;
}

export interface AutomationSettings {
  auto_onboarding_enabled: boolean;
  auto_assign_template_id: string | null;
}

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  escalated: boolean;
  created_at: string;
}

export interface AssistantMessageSendResult {
  reply: AssistantMessage;
  remaining_today: number;
}

export interface AskSource {
  document_id: string;
  document_name: string;
  snippet: string;
}

export interface AskResult {
  answer: string;
  sources: AskSource[];
}

export interface FormFieldDraft {
  type: string;
  label: string;
  required: boolean;
  options: string[] | null;
}

export interface FormAiDraft {
  title: string;
  description: string;
  fields: FormFieldDraft[];
}

// Custom Fields
export type CustomFieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "percentage"
  | "date"
  | "dropdown"
  | "multi_select"
  | "checkbox"
  | "rating"
  | "url"
  | "email"
  | "phone";

export interface CustomFieldGroup {
  id: string;
  name: string;
  order: number;
}

export interface CustomFieldDefinition {
  id: string;
  group_id: string | null;
  name: string;
  field_type: CustomFieldType;
  options: string[] | null;
  unit: string | null;
  required: boolean;
  visible_to_client: boolean;
  order: number;
}

export interface ClientFieldValue {
  definition: CustomFieldDefinition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

export interface ClientCustomFields {
  groups: CustomFieldGroup[];
  fields: ClientFieldValue[];
}

export interface ApplyTemplateResult {
  groups_created: number;
  fields_created: number;
  metrics_created: number;
}

export interface MetricDefinition {
  id: string;
  name: string;
  unit: string | null;
  category: string | null;
}

export interface MetricEntry {
  id: string;
  definition_id: string;
  value: number;
  recorded_at: string;
  notes: string | null;
  created_by: string;
}

export interface SessionNote {
  id: string;
  client_id: string;
  meeting_id: string | null;
  session_date: string;
  objective: string | null;
  discussion_notes: string | null;
  key_insights: string | null;
  wins: string | null;
  challenges: string | null;
  action_items: string[] | null;
  follow_up_date: string | null;
  created_by: string;
}

export interface ClientSnapshot {
  narrative: string;
  generated_at: string;
}

export interface AttentionItem {
  client_id: string;
  client_name: string;
  bucket: "urgent" | "behind" | "minor";
  reason: string;
  thread_id: string | null;
  suggested_action: string;
}

export interface NeedsAttention {
  items: AttentionItem[];
  generated_at: string;
}

export interface TimelineEvent {
  type: "goal" | "task" | "progress" | "checkin" | "session" | "document" | "metric" | "payment" | "risk";
  date: string;
  title: string;
  summary: string | null;
}

export interface Timeline {
  events: TimelineEvent[];
}

// Notifications
export interface NotificationData {
  id: string;
  type: string;
  payload_json: {
    message?: string;
    client_name?: string;
    key?: string;
    client_id?: string;
    thread_id?: string;
    lead_id?: string;
    form_id?: string;
  };
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
  leads_lost: number;
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
    request<User | MfaRequired | CoachChoiceRequired>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  selectLoginCoach: (challengeToken: string, coachId: string) =>
    request<User | MfaRequired>("/auth/login/select-coach", {
      method: "POST",
      body: JSON.stringify({ challenge_token: challengeToken, coach_id: coachId }),
    }),

  getLoginCoachChoices: (challengeToken: string) =>
    request<CoachChoiceRequired>(
      `/auth/login/coach-choices?challenge_token=${encodeURIComponent(challengeToken)}`
    ),

  logout: () => request<void>("/auth/logout", { method: "POST" }),

  me: () => request<User>("/auth/me"),

  exportMyData: () => request<Record<string, unknown>>("/auth/me/export"),

  deleteMyAccount: () => request<void>("/auth/me/delete", { method: "POST" }),

  setupMfa: () => request<MfaSetup>("/auth/mfa/setup", { method: "POST" }),

  enableMfa: (code: string) =>
    request<MfaEnableResult>("/auth/mfa/enable", { method: "POST", body: JSON.stringify({ code }) }),

  disableMfa: (password: string, code: string) =>
    request<void>("/auth/mfa/disable", { method: "POST", body: JSON.stringify({ password, code }) }),

  verifyMfa: (challengeToken: string, code: string) =>
    request<User>("/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify({ challenge_token: challengeToken, code }),
    }),

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
    billing_country_code?: string;
  }) => request<CoachProfile>("/coach/onboarding", { method: "POST", body: JSON.stringify(body) }),

  myProfile: () => request<CoachProfile>("/coach/me/profile"),

  updateMyProfile: (body: CoachProfileUpdate) =>
    request<CoachProfile>("/coach/me/profile", { method: "PATCH", body: JSON.stringify(body) }),

  uploadGalleryImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return requestForm<CoachProfile>("/coach/me/gallery", form);
  },

  removeGalleryImage: (index: number) =>
    request<CoachProfile>(`/coach/me/gallery/${index}`, { method: "DELETE" }),

  portalBySlug: (slug: string) => request<PortalPublic>(`/portal/${slug}`),

  getPublicPackages: (slug: string) => request<ProgramTemplate[]>(`/portal/${slug}/packages`),

  galleryImageUrl: (slug: string, index: number) => `${API_URL}/portal/${slug}/gallery/${index}`,

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

  commitClientImport: (
    mapping: Record<string, string | null>,
    rows: Record<string, string>[],
    customFieldColumns: string[] = []
  ) =>
    request<ImportCommitResult>("/clients/import/commit", {
      method: "POST",
      body: JSON.stringify({ mapping, rows, custom_field_columns: customFieldColumns }),
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

  getClientPortalLink: (id: string) =>
    request<{ portal_code: string; portal_path: string }>(`/clients/${id}/portal-link`),

  getClientPortalPreview: (slug: string, code: string) =>
    request<{ name: string; email: string; coach_name: string; business_name: string | null }>(
      `/portal/${slug}/c/${code}`
    ),

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
    country_code?: string;
    timezone?: string;
  }) => request<IntakeResponseData>("/clients/me/intake", { method: "POST", body: JSON.stringify(body) }),

  // Leads
  listLeads: () => request<Lead[]>("/leads"),

  createLead: (body: {
    name: string;
    phone?: string;
    email?: string;
    interested_in?: string;
    notes?: string;
    source?: string;
  }) => request<Lead>("/leads", { method: "POST", body: JSON.stringify(body) }),

  submitLandingInterest: (body: { name: string; email: string; niche?: string; note?: string }) =>
    request<{ ok: boolean }>("/portal/landing-interest", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateLeadStage: (id: string, stage: LeadStage) =>
    request<Lead>(`/leads/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stage }) }),

  convertLead: (id: string) =>
    request<ClientListItem>(`/leads/${id}/convert`, { method: "POST" }),

  restoreLead: (id: string) => request<Lead>(`/leads/${id}/restore`, { method: "POST" }),

  uploadClientAvatar: (clientId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return requestForm<void>(`/clients/${clientId}/avatar`, form);
  },

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

  uploadFormImage: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return requestForm<CoachForm>(`/forms/${id}/image`, form);
  },

  deleteFormImage: (id: string) =>
    request<CoachForm>(`/forms/${id}/image`, { method: "DELETE" }),

  shareForm: (id: string, clientIds: string[]) =>
    request<{ sent: number }>(`/forms/${id}/share`, {
      method: "POST",
      body: JSON.stringify({ client_ids: clientIds }),
    }),

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

  // A coach's own client-agnostic reference library — client_id omitted.
  listLibraryDocuments: () => request<DocumentData[]>("/documents"),

  uploadLibraryDocument: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return requestForm<DocumentData>("/documents", form);
  },

  shareDocument: (documentId: string, clientIds: string[]) =>
    request<{ sent: number }>(`/documents/${documentId}/share`, {
      method: "POST",
      body: JSON.stringify({ client_ids: clientIds }),
    }),

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

  listGoogleCalendarEvents: () => request<GoogleCalendarEvent[]>("/integrations/google/events"),

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

  updateClientSubscription: (
    clientId: string,
    subscriptionValidUntil: string | null,
    subscriptionValidFrom: string | null = null
  ) =>
    request<ClientBilling>(`/clients/${clientId}/subscription`, {
      method: "PATCH",
      body: JSON.stringify({
        subscription_valid_until: subscriptionValidUntil,
        subscription_valid_from: subscriptionValidFrom,
      }),
    }),

  addInvoice: (clientId: string, body: { amount: number; due_date: string }) =>
    request<InvoiceData>(`/clients/${clientId}/invoices`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  toggleInvoicePaid: (invoiceId: string) =>
    request<InvoiceData>(`/invoices/${invoiceId}/paid`, { method: "PATCH" }),

  // Region / provider routing
  getRegion: () =>
    request<{
      country_code: string | null;
      suggested_provider: PaymentProvider;
      suggested_currency: string;
      region: "global" | "india";
      source: "declared" | "ip" | "registration_ip" | "none";
      mismatch: boolean;
    }>("/geo/region"),

  // Platform billing
  getPlatformSubscription: () => request<PlatformSubscriptionData>("/coach/subscription"),

  getPaddleCheckoutToken: (
    tier: SubscriptionTier,
    cycle: BillingCycle,
    region: "global" | "india" = "global",
    confirmRegionMismatch = false
  ) =>
    request<{
      price_id: string;
      client_side_token: string;
      environment: string;
      customer_email: string;
      custom_data: Record<string, string>;
      resolved_country_code: string | null;
      region_mismatch: boolean;
      processor_customer_id: string | null;
    }>("/billing/paddle/checkout-token", {
      method: "POST",
      body: JSON.stringify({ tier, cycle, region, confirm_region_mismatch: confirmRegionMismatch }),
    }),

  getPaddlePortalSession: () => request<{ url: string }>("/billing/paddle/portal-session"),

  cancelSubscription: () => request<{ ok: boolean }>("/billing/subscription/cancel", { method: "POST" }),

  changePlan: (tier: SubscriptionTier, cycle: BillingCycle) =>
    request<{ ok: boolean }>("/billing/subscription/plan", {
      method: "PATCH",
      body: JSON.stringify({ tier, cycle }),
    }),

  // AI
  getBriefing: (force = false) => request<BriefingData>(`/ai/briefing${force ? "?force=true" : ""}`),

  createSessionNote: (clientId: string, text: string) =>
    request<SessionNoteResult>("/ai/session-note", {
      method: "POST",
      body: JSON.stringify({ client_id: clientId, text }),
    }),

  sendFollowup: (
    clientId: string,
    draftMessage: string,
    options?: {
      sessionSummary?: string;
      acceptedGoalUpdates?: SuggestedGoalUpdate[];
      acceptedTasks?: SuggestedTask[];
    }
  ) =>
    request<void>("/ai/session-note/send", {
      method: "POST",
      body: JSON.stringify({
        client_id: clientId,
        draft_message: draftMessage,
        session_summary: options?.sessionSummary ?? null,
        accepted_goal_updates: options?.acceptedGoalUpdates ?? [],
        accepted_tasks: options?.acceptedTasks ?? [],
      }),
    }),

  suggestReply: (threadId: string) =>
    request<{ draft: string }>("/ai/suggest-reply", {
      method: "POST",
      body: JSON.stringify({ thread_id: threadId }),
    }),

  getClientProgressInsight: (clientId: string) =>
    request<ProgressInsight>(`/ai/clients/${clientId}/progress-insight`),

  getMyProgressInsight: () => request<ProgressInsight>("/ai/clients/me/progress-insight"),

  getChurnTrend: (clientId: string) => request<ChurnTrend>(`/ai/clients/${clientId}/churn-trend`),

  getPrepMyDay: () => request<PrepMyDayData>("/ai/prep-my-day"),

  getOnboardingDraft: (clientId: string) =>
    request<OnboardingDraft>(`/ai/clients/${clientId}/onboarding-draft`, { method: "POST" }),

  getWeeklyDigest: (force = false) =>
    request<WeeklyDigestData>(`/ai/weekly-digest${force ? "?force=true" : ""}`),

  getInvoiceReminderDraft: (invoiceId: string) =>
    request<InvoiceReminderDraft>(`/ai/invoices/${invoiceId}/reminder-draft`, { method: "POST" }),

  getProgramDraft: (clientId: string, constraints?: string) =>
    request<ProgramDraft>(`/ai/clients/${clientId}/program-draft`, {
      method: "POST",
      body: JSON.stringify({ constraints: constraints || undefined }),
    }),

  getFormAiDraft: (description: string) =>
    request<FormAiDraft>("/forms/ai-draft", {
      method: "POST",
      body: JSON.stringify({ description }),
    }),

  // Programs
  listMyPrograms: () => request<Program[]>("/clients/me/programs"),

  listMyAvailablePackages: () => request<ProgramTemplate[]>("/clients/me/available-packages"),

  selectMyPackage: (templateId: string) =>
    request<Program>(`/clients/me/select-package/${templateId}`, { method: "POST" }),

  listClientPrograms: (clientId: string) => request<Program[]>(`/clients/${clientId}/programs`),

  createClientProgram: (clientId: string, title: string, items: ProgramItemDraft[]) =>
    request<Program>(`/clients/${clientId}/programs`, {
      method: "POST",
      body: JSON.stringify({ title, items }),
    }),

  deleteClientProgram: (clientId: string, programId: string) =>
    request<void>(`/clients/${clientId}/programs/${programId}`, { method: "DELETE" }),

  updateClientProgramDates: (
    clientId: string,
    programId: string,
    body: { started_at?: string | null; duration_weeks?: number | null }
  ) =>
    request<Program>(`/clients/${clientId}/programs/${programId}/dates`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  assignTemplateToClient: (clientId: string, templateId: string) =>
    request<Program>(`/clients/${clientId}/programs/assign-template/${templateId}`, {
      method: "POST",
    }),

  // Program templates & packages
  listTemplates: () => request<ProgramTemplate[]>("/programs/templates"),

  createTemplate: (body: ProgramTemplateInput) =>
    request<ProgramTemplate>("/programs/templates", { method: "POST", body: JSON.stringify(body) }),

  updateTemplate: (id: string, body: Partial<ProgramTemplateInput>) =>
    request<ProgramTemplate>(`/programs/templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteTemplate: (id: string) => request<void>(`/programs/templates/${id}`, { method: "DELETE" }),

  getProgramTemplateDraft: (niche: string, durationWeeks?: number, hint?: string) =>
    request<ProgramTemplateDraft>("/ai/program-template-draft", {
      method: "POST",
      body: JSON.stringify({ niche, duration_weeks: durationWeeks, hint: hint || undefined }),
    }),

  // Custom Fields
  listCustomFieldGroups: () => request<CustomFieldGroup[]>("/custom-field-groups"),

  createCustomFieldGroup: (body: { name: string; order?: number }) =>
    request<CustomFieldGroup>("/custom-field-groups", { method: "POST", body: JSON.stringify(body) }),

  updateCustomFieldGroup: (id: string, body: { name?: string; order?: number }) =>
    request<CustomFieldGroup>(`/custom-field-groups/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  deleteCustomFieldGroup: (id: string) =>
    request<void>(`/custom-field-groups/${id}`, { method: "DELETE" }),

  listCustomFieldDefinitions: () => request<CustomFieldDefinition[]>("/custom-field-definitions"),

  createCustomFieldDefinition: (body: {
    group_id?: string | null;
    name: string;
    field_type: CustomFieldType;
    options?: string[] | null;
    unit?: string | null;
    required?: boolean;
    visible_to_client?: boolean;
    order?: number;
  }) => request<CustomFieldDefinition>("/custom-field-definitions", { method: "POST", body: JSON.stringify(body) }),

  updateCustomFieldDefinition: (
    id: string,
    body: Partial<{
      group_id: string | null;
      name: string;
      field_type: CustomFieldType;
      options: string[] | null;
      unit: string | null;
      required: boolean;
      visible_to_client: boolean;
      order: number;
    }>
  ) => request<CustomFieldDefinition>(`/custom-field-definitions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  deleteCustomFieldDefinition: (id: string) =>
    request<void>(`/custom-field-definitions/${id}`, { method: "DELETE" }),

  applyCustomFieldTemplate: () =>
    request<ApplyTemplateResult>("/custom-field-definitions/apply-template", { method: "POST" }),

  getClientCustomFields: (clientId: string) =>
    request<ClientCustomFields>(`/clients/${clientId}/custom-fields`),

  getMyCustomFields: () => request<ClientCustomFields>("/clients/me/custom-fields"),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setClientCustomFieldValue: (clientId: string, definitionId: string, value: any) =>
    request<void>(`/clients/${clientId}/custom-fields/${definitionId}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setMyCustomFieldValue: (definitionId: string, value: any) =>
    request<void>(`/clients/me/custom-fields/${definitionId}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),

  // Metrics
  listMetricDefinitions: () => request<MetricDefinition[]>("/metric-definitions"),

  listMyMetricDefinitions: () => request<MetricDefinition[]>("/clients/me/metric-definitions"),

  listClientMetricEntries: (clientId: string, definitionId: string) =>
    request<MetricEntry[]>(`/clients/${clientId}/metrics/${definitionId}/entries`),

  createClientMetricEntry: (
    clientId: string,
    definitionId: string,
    body: { value: number; recorded_at: string; notes?: string | null }
  ) =>
    request<MetricEntry>(`/clients/${clientId}/metrics/${definitionId}/entries`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listMyMetricEntries: (definitionId: string) =>
    request<MetricEntry[]>(`/clients/me/metrics/${definitionId}/entries`),

  createMyMetricEntry: (
    definitionId: string,
    body: { value: number; recorded_at: string; notes?: string | null }
  ) =>
    request<MetricEntry>(`/clients/me/metrics/${definitionId}/entries`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Session notes
  listClientSessions: (clientId: string) => request<SessionNote[]>(`/clients/${clientId}/sessions`),

  listMySessions: () => request<SessionNote[]>("/clients/me/sessions"),

  createClientSession: (
    clientId: string,
    body: {
      session_date: string;
      objective?: string | null;
      discussion_notes?: string | null;
      key_insights?: string | null;
      wins?: string | null;
      challenges?: string | null;
      follow_up_date?: string | null;
    }
  ) =>
    request<SessionNote>(`/clients/${clientId}/sessions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteClientSession: (clientId: string, noteId: string) =>
    request<void>(`/clients/${clientId}/sessions/${noteId}`, { method: "DELETE" }),

  // AI Client Snapshot
  getClientSnapshot: (clientId: string) =>
    request<ClientSnapshot>(`/ai/clients/${clientId}/snapshot`),

  // Needs Attention
  getNeedsAttention: () => request<NeedsAttention>("/coach/needs-attention"),

  // Timeline
  getClientTimeline: (clientId: string) => request<Timeline>(`/clients/${clientId}/timeline`),

  getMyTimeline: () => request<Timeline>("/clients/me/timeline"),

  // Client AI Assistant
  getAssistantSettings: () => request<AssistantSettings>("/coach/ai-assistant-settings"),

  updateAssistantSettings: (body: Partial<Omit<AssistantSettings, "platform_query_ceiling">>) =>
    request<AssistantSettings>("/coach/ai-assistant-settings", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // Automation
  getAutomationSettings: () => request<AutomationSettings>("/coach/automation-settings"),

  updateAutomationSettings: (
    body: Partial<AutomationSettings> & { clear_template?: boolean }
  ) =>
    request<AutomationSettings>("/coach/automation-settings", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  listMyAssistantMessages: () => request<AssistantMessage[]>("/clients/me/assistant/messages"),

  sendMyAssistantMessage: (content: string) =>
    request<AssistantMessageSendResult>("/clients/me/assistant/messages", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  listClientAssistantMessages: (clientId: string) =>
    request<AssistantMessage[]>(`/clients/${clientId}/assistant/messages`),

  askDocuments: (question: string) =>
    request<AskResult>("/ai/ask", { method: "POST", body: JSON.stringify({ question }) }),

  // Notifications
  listNotifications: () => request<NotificationData[]>("/notifications"),

  markNotificationRead: (id: string) =>
    request<NotificationData>(`/notifications/${id}/read`, { method: "PATCH" }),

  markAllNotificationsRead: () => request<void>("/notifications/read-all", { method: "POST" }),

  // Analytics
  getAnalyticsSummary: () => request<AnalyticsSummary>("/analytics/summary"),

  getAnalyticsTimeseries: () => request<AnalyticsTimeseries>("/analytics/timeseries"),
};
