# Specification

## Summary
**Goal:** Fix Internet Identity login in the Android APK/WebView context by using an external browser authentication flow that returns to the app and completes login automatically, while preserving normal browser behavior.

**Planned changes:**
- Detect when the app is running inside an embedded/in-app browser (e.g., Android APK WebView) and, in that case, initiate Internet Identity login by opening the device’s external browser instead of authenticating inside the WebView.
- Add a safe return-to-app handling path that finalizes authentication automatically on load/resume after the external browser completes, and cleans any temporary callback parameters/fragments from the URL.
- Add English user-facing UI feedback for the workaround flow (explain that login will open in the device browser, show in-progress/disabled login state, and show clear error/retry if cancelled or failed).
- Keep existing Internet Identity login/logout behavior unchanged for standard (non-WebView) browsers, including current logout cache-clearing behavior.

**User-visible outcome:** In the Android APK, tapping “Login” opens the system browser for Internet Identity and then returns to the app already logged in (or shows a clear English error with retry). In normal browsers, login/logout continues to work as it does today.
