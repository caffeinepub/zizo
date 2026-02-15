# Specification

## Summary
**Goal:** Improve feed reliability and upload clarity, add server-backed search, enable in-app capture/editing, implement a simplified security verification flow (no email), and allow media downloads from the feed.

**Planned changes:**
- Make feed loading resilient: always attempt `fetchFeedItems()` once an actor is available (anonymous or authenticated), show a loading state while the actor is unavailable, and surface actionable (non-sensitive) error details with a retry action when fetching fails.
- Improve upload UX: show clear busy/progress state during upload, show success feedback on completion, keep the dialog open on failure with an error message, and refresh/insert the new post so it appears in the feed immediately after a successful upload.
- Add keyword search for image/video posts across captions and creator handles: add a Search button in the main top bar, a dedicated search UI for results, navigation from a selected result to its post in the vertical feed, and a backend query for server-side search.
- Add in-app video capture via device camera within the existing upload flow, including preview and clear permission-denied handling with a fallback to file upload.
- Add basic pre-upload editing tools: image cropping + simple filter, video trimming + simple filter, and text overlays for both images and videos, ensuring edits are applied to the uploaded media.
- Implement simplified three-step security verification without email: setup flow for security questions and a PIN, per-device trust/confirmation with backend registration, and a PIN challenge that blocks sensitive actions when suspicious activity is detected.
- Add a Download action on each feed item to save the current image/video to the user’s device using existing direct media URLs (`getDirectURL()`).

**User-visible outcome:** The feed reliably loads (with retry on errors), uploads provide clear progress and show new posts immediately, users can search posts by keyword/creator, record and lightly edit media before uploading, complete non-email security verification when prompted, and download images/videos directly from the feed.
