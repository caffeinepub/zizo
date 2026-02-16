# Specification

## Summary
**Goal:** Replace the current bottom-sheet comments UI with a full-screen TikTok-style comments screen, including typical comment interactions (likes, replies, delete) and correct comment-count updates.

**Planned changes:**
- Swap the feed’s comment button behavior to open a full-screen comments view (not a bottom sheet) with an explicit close/back control that returns to the feed.
- Implement a TikTok-like full-screen comments layout: header with “Comments” and total count, scrollable comment list, and a sticky bottom composer with mobile/PWA safe-area padding.
- Add comment interactions in the UI: like/unlike with count, reply with threaded replies under the parent, delete own comments/replies, and basic sorting (e.g., Top/Newest) with clear indication.
- Extend the Motoko backend comment model/APIs to support threaded replies and comment likes while preserving existing top-level comment posting (including optional media attachments).
- Update React Query hooks to use new backend APIs for replies/likes/deletion and ensure mutations invalidate/refetch so lists and counts stay in sync.
- Fix the comment count propagation bug by removing side-effects from a useState initializer and updating count via an effect tied to comment data changes.
- Apply a coherent dark theme for the full-screen comments UI using a consistent non-blue/non-purple accent color across header/dividers/buttons and loading/error/empty states.

**User-visible outcome:** Tapping the comment icon opens a full-screen TikTok-style comments experience where users can read, sort, like, reply in threads, delete their own comments, and post new comments without the composer being hidden by system UI; closing returns to the feed with comment counts updating correctly.
