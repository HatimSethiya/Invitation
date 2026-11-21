# Wedding Card Studio — Phase 0: Legacy Protection Baseline

Status: **Repository audit completed; live-card verification pending**  
Branch: **master**  
Prepared: 2026-11-21  
Scope: Read-only inspection of existing application behavior. This document is not a migration and does not change any invitation or page.

## Non-negotiable product scope

This project is **only a wedding invitation card design studio**. It is not an RSVP, guest management, budgeting, booking, or wedding planning system.

New visitors should be able to choose a community/style template, enter relevant wedding details, customize the appearance, preview the card, and save/publish/share it. Community-based templates must remain optional and customizable, not restricted by identity.

## Protect existing four saved invitations

The owner reports **four existing cards**. Their exact database records, IDs, full settings and visual screenshots have not been retrieved in this audit. Do not claim the four cards have been individually verified until authenticated card-specific baselines are captured.

For **all four cards**, preserve:
- Invitation `_id`, `slug`, public URL `/i/:slug`, publication status, saved title, and all persisted invitation data.
- Existing appearance: themes, layout, typography, image crop/position, colors, events, couple/family details, and regional/ceremony wording.
- Opening animations (`curtains`, `envelope`, `door`), manual/automatic modes, and handoff timing.
- Music selection, audio URL, existing browser-gesture fallbacks, mute/play behavior, and loop/autoplay settings.
- Countdown target of local 12:00 AM on the configured wedding date; never derive it from the event time.
- Arabic Fatemi date preference for each event and its existing formatting.
- Single- and double-couple cards.
- Dashboard statistics, edit/save, draft/publish/hold/archive, theme control, delete confirmation, and card password locking/unlocking.
- Existing admin authentication and ownership checks, token validation, and publicly published card availability.

**Never** bulk-update saved cards or migrate their theme IDs as part of studio rollout.
**Never** remove a legacy special case because it appears unused; verify against the four protected cards first.
**Never** replace the existing public renderer or the existing editor route for old cards.

## Verified source architecture on master

- Admin dashboard: `frontend/src/pages/admin/AdminDashboard.jsx`, scoped styling `AdminDashboard.css`.
- Existing editor: `frontend/src/pages/admin/InvitationWizard.jsx` (8 steps).
- Public rendering: `frontend/src/pages/public/PublicInvitation.jsx` and opening components `EnvelopeReveal.jsx`, `DoorOpening.jsx`.
- Existing routes: `/admin/dashboard`, `/admin/invitations/new`, `/admin/invitations/:id/edit`, `/i/:slug`.
- MongoDB model: `backend/models/Invitation.js`; current `theme` is a string and does not yet contain a dedicated studio template ID/version.
- Admin CRUD/public controller: `backend/controllers/invitationController.js`; existing admin list restricts records to `createdBy: req.user.id`; locked cards return a restricted summary until a valid unlock token exists.
- Public API returns only invitations with `status: "published"`.
- Current renderer contains special-case treatment for historic slugs/titles, including `mufaddalweddinginvitation` and `mariya`. These are *code references*, **not proof** that either is among the four current database cards.
- `/i/:slug` share route must remain stable, with no forced redirect to a new Studio URL.

## Four-card verification register (pending authenticated access)

| Card | Existing ID | Public slug / URL | Theme and layout screenshot | Animation + music | Events / dates | Password and publish behavior |
|------|-------------|-------------------|-----------------------------|-------------------|----------------|-------------------------------|
| 1 | Pending | Pending | Pending | Pending | Pending | Pending |
| 2 | Pending | Pending | Pending | Pending | Pending | Pending |
| 3 | Pending | Pending | Pending | Pending | Pending | Pending |
| 4 | Pending | Pending | Pending | Pending | Pending | Pending |

Record these baselines via the authenticated admin interface or a supported authorized data export **before changing the shared renderer or model**. Do not store passwords, unlock tokens, session tokens, or other secrets in this document.

## Required regression checks before each future studio phase is accepted

1. **Existing cards:** Each of the four original IDs and public URLs still resolves exactly as before, with the same published/draft/held behavior.
2. **Visual:** Compare desktop and mobile screenshots (including initial opening and fully opened card) against the recorded baseline at matched viewport sizes.
3. **Interaction:** Curtains/envelope/doors and manual/automatic opening continue working; unlocked UI remains interactive.
4. **Audio:** Music state, selected track and user-gesture fallback are unchanged; no claim of unconditional mobile audible autoplay.
5. **Data:** Round-trip edit/save for a legacy card preserves all fields; card themes and event order are not silently normalized or dropped.
6. **Dates:** Countdown uses 12:00 AM on the wedding date; Fatemi labels appear only for events with `showFatemiDate === true`.
7. **Security:** Locked card overlays, password verification, admin ownership checks, editing restrictions and logout relocking continue to work.
8. **Dashboard:** Edit, View, Publish, Hold, music, Delete and all counts remain functional.
9. **Performance:** No new unbounded animation loops or heavy gallery media loading on existing public cards.
10. **New studio isolation:** New template code must not change legacy CSS selectors or behavior unless a separately verified, explicitly scoped integration requires it.

## Future implementation contract

Phase 1 introduces an independent template registry and studio navigation. A template record should carry a stable `templateId`, `templateVersion`, community/style metadata, preview and editable fields. New cards alone may opt in to a new renderer; absent template identifier always means **legacy card**. No automatic conversion or migration of legacy invitations.

Phase 2 introduces the template gallery and filters; Phase 3 adds real community-specific layouts; Phase 4 adds easy relevant-field editing and preview; Phase 5 adds advanced customization; Phase 6 adds final preview/publish; Phase 7 adds full regression and mobile polish.

Prefer additive routes, isolated styles and components, and optional schema fields. Keep legacy APIs and renderers backward-compatible.

## Git and deployment rules

- Work and commit **only to `master`**. Do not write to `main`.
- **No deployment** (manual or automatic) from studio development. Preview auto-deployment must be suppressed in both frontend and API projects before commits.
- Source review, local build/lint/tests and commit diff review are required; record any unavailable checks honestly.
- Vercel production must continue to point to the previously approved `main` release unless the owner explicitly changes deployment instructions.

## Phase 0 completion gates

- [x] Repository branch, routes, existing model, admin controls and public renderer inspected without changing product code.
- [x] Non-negotiable legacy behavior and regression checks documented.
- [x] Deploy-suppression configuration requested on frontend and API Vercel projects.
- [ ] Individually verify all four actual saved cards and capture authorized baseline screenshots/settings.
- [ ] Validate deploy-suppression effectiveness for subsequent `master` commits.
- [ ] Run a complete browser-level smoke test with an authenticated staging/local environment.

Do **not** describe Phase 0 as fully complete until all pending gates are checked.
