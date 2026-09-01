// Every real app route segment that lives under /{slug}/... — kept in sync with
// RESERVED_SLUGS in apps/api/app/routers/forms.py. Anything NOT in this list is
// treated as a coach's public form slug.
export const RESERVED_SLUGS = [
  "dashboard",
  "leads",
  "clients",
  "chat",
  "calendar",
  "documents",
  "billing",
  "settings",
  "checkin",
  "files",
  "messages",
  "onboarding",
  "progress",
  "tasks",
  "forms",
  "client",
  "assistant",
  "programs",
  "packages",
  "coach",
];
