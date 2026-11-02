import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: apiBaseURL,
  headers: { "Content-Type": "application/json" },
});

// Invitation unlocks are intentionally memory-only: a browser refresh or logout relocks cards.
const invitationUnlockTokens = new Map();
export function setInvitationUnlockToken(invitationId, token) {
  if (token) invitationUnlockTokens.set(invitationId, token);
  else invitationUnlockTokens.delete(invitationId);
}
export function clearInvitationUnlockTokens() {
  invitationUnlockTokens.clear();
}

api.interceptors.request.use((config) => {
  const match = String(config.url || "").match(/(?:^|\\/)invitations\\/([a-f\\d]{24})(?:\\/|$)/i);
  const unlockToken = match ? invitationUnlockTokens.get(match[1]) : null;
  if (unlockToken) config.headers["X-Invitation-Unlock"] = unlockToken;
  return config;
});

const token = localStorage.getItem("wedding_admin_token");
if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;

export function resolveMediaUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  const mediaUrl = value.trim();

  try {
    const apiOrigin = new URL(apiBaseURL, window.location.origin).origin;
    const parsedUrl = new URL(mediaUrl, apiOrigin);

    // Re-home previously saved audio URLs from the retired Render backend.
    if (
      parsedUrl.hostname === "invitation-app-3o1t.onrender.com" &&
      parsedUrl.pathname.startsWith("/api/uploads/audio/")
    ) {
      return new URL(`${parsedUrl.pathname}${parsedUrl.search}`, apiOrigin).toString();
    }

    // Stored upload paths are relative to the API, not the frontend site.
    if (mediaUrl.startsWith("/")) {
      return new URL(mediaUrl, apiOrigin).toString();
    }

    return parsedUrl.toString();
  } catch {
    return mediaUrl;
  }
}

export default api;
