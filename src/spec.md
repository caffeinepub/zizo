# Specification

## Summary
**Goal:** Add a backend-persisted comments system with a TikTok-style comments UI, and implement per-post share links that deep-link to and auto-scroll to a specific post in the main feed.

**Planned changes:**
- Backend: Add persisted comment storage per feed item, plus APIs to fetch comments for a post and add a new comment (authenticated), supporting text and optional image/video attachments stored via the existing blob storage approach.
- Frontend: Replace the “Comments coming soon!” placeholder with a bottom-sheet (TikTok-style) comments screen that loads comments, shows loading/error states, and lets authenticated users post comments with optional media attachments.
- Frontend: Update feed interaction UI so the comment count reflects the number of comments for each post (at least after viewing/posting).
- Frontend: Implement per-post shareable URLs that include the post ID; on open, load the main feed and auto-scroll to the referenced post, with a not-found message if missing and URL parameter neutralization after handling.
- Frontend: Replace the “Share feature coming soon!” placeholder with a share menu that supports “Copy link” (clipboard + success/failure toast) and uses the native share sheet when available.

**User-visible outcome:** Users can open a TikTok-style comments panel on any post to read and (when logged in) add text comments with optional image/video attachments, and can share a post via a unique link that opens the feed and jumps directly to that post, with copy-link and native sharing support.
