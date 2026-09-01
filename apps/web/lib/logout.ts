import { api } from "@/lib/api";
import { invalidateCurrentUser } from "@/lib/useCurrentUser";

// Shared by both settings pages (CoachSettings/ClientSettings) — logout
// moved here from the sidebar identity block per the "logout belongs in
// Profile, not the sidebar" request.
export async function performLogout() {
  try {
    await api.logout();
  } catch {
    // Clear local state and redirect regardless — a failed logout call
    // shouldn't strand the user unable to leave the app.
  }
  invalidateCurrentUser();
  window.location.href = "/login";
}
