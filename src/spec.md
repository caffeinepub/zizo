# Specification

## Summary
**Goal:** Fix upload and playback issues by making captions optional, ensuring edited videos remain valid with audio, and adding in-feed playback controls, then redeploy.

**Planned changes:**
- Allow uploads (images/videos) to proceed with an empty/whitespace caption and remove any “caption required” validation messaging.
- Update the backend addMedia API to accept and store empty captions without errors; ensure feed fetching/serialization and UI rendering handle caption="" safely.
- Fix the video editing/upload pipeline so edited videos remain playable video files (not converted to images) and retain their audio track; address freezing during playback and replay.
- Add in-feed overlay controls for the active video: Pause/Play toggle and Mute/Unmute toggle (videos start muted by default; images show no such controls).
- Re-run build and deployment so updated frontend/backend are compiled and released.

**User-visible outcome:** Users can upload media without a caption, edited videos upload and play correctly with sound available via unmute, videos don’t freeze mid-play, and videos in the feed have pause/resume and mute/unmute controls.
