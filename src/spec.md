# Specification

## Summary
**Goal:** Enable any authenticated user to upload videos or pictures with captions into the global feed, and improve the web app’s mobile experience with PWA installability.

**Planned changes:**
- Update backend data model and authenticated APIs to accept user uploads (image or video + caption), store media in-canister, and return mixed media items in the global feed for everyone (including guests).
- Remove the admin-only restriction for adding feed content; enforce that only authenticated users can upload.
- Add a frontend upload entry point (button) on both mobile and desktop, with an upload flow that prompts login when needed and updates the feed immediately after posting.
- Update feed rendering to support full-screen, vertically paged image and video posts together while preserving existing overlays, scroll-snap behavior, and like toggling.
- Add PWA support (manifest + service worker) and mobile-stability improvements (safe-area spacing, stable full-height layout, touch-first controls).
- If required by the new mixed-media state shape, add a conditional Motoko migration to preserve existing feed items and like counts on upgrade.

**User-visible outcome:** Logged-in users can upload a photo or video with a caption and see it appear right away in the global feed; everyone can browse a unified, full-screen scrolling feed of both images and videos, and the site can be installed and used more like a mobile app.
