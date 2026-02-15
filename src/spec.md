# Specification

## Summary
**Goal:** Rebuild and redeploy the app on the Internet Computer to regenerate a working public icp0.io URL and ensure the frontend canister serves the correct production build.

**Planned changes:**
- Rebuild and redeploy both backend and frontend canisters to produce a fresh, working public ICP URL.
- Fix frontend production asset serving so the deployed frontend canister serves the Vite build output from `frontend/dist` (not source files) and does not reference `/src/main.tsx`.
- Add a fail-fast deployment gate by running the existing frontend dist verification scripts before deploying the frontend canister.
- Output the final working public app URL in the format `https://<frontend-canister-id>.icp0.io`.

**User-visible outcome:** The app loads successfully in a browser from the deployed frontend canister at a working `https://<frontend-canister-id>.icp0.io` URL (not blank, not a raw link page, and not “Canister ID Not Resolved”).
