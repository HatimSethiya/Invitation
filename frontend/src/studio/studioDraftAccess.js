// Memory-only unlock tokens: browser refresh closes unlocked Studio drafts.
// Never store card passwords, JWTs or draft contents in localStorage.
const studioDraftTokens = new Map();

export function getStudioDraftUnlockToken(draftId) {
  return studioDraftTokens.get(draftId) || "";
}

export function setStudioDraftUnlockToken(draftId, token) {
  if (draftId && typeof token === "string" && token) {
    studioDraftTokens.set(draftId, token);
  }
}

export function clearStudioDraftUnlockTokens() {
  studioDraftTokens.clear();
}

export function clearStudioDraftUnlockToken(draftId) {
  studioDraftTokens.delete(draftId);
}

export function studioDraftHeaders(draftId) {
  const token = getStudioDraftUnlockToken(draftId);
  return token ? { "X-Studio-Draft-Unlock": token } : {};
}
