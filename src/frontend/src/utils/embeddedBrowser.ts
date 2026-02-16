/**
 * Detects if the app is running inside an embedded/in-app browser (e.g., Android WebView)
 * where Internet Identity login may be blocked by Google's policies.
 */

export function isEmbeddedBrowser(): boolean {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // Android WebView detection
  const isAndroidWebView = 
    /wv/.test(userAgent) || // WebView indicator
    /Android.*AppleWebKit(?!.*Chrome)/.test(userAgent) || // Old Android WebView
    (userAgent.includes('Android') && !userAgent.includes('Chrome')) || // No Chrome = WebView
    (userAgent.includes('Android') && userAgent.includes('Version/') && !userAgent.includes('Chrome/')); // Version without Chrome

  // iOS WebView detection (UIWebView or WKWebView)
  const isIOSWebView = 
    /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/.test(userAgent) ||
    (userAgent.includes('iPhone') && !userAgent.includes('Safari'));

  // Facebook/Instagram/Twitter in-app browsers
  const isInAppBrowser = 
    /FBAN|FBAV|Instagram|Twitter/.test(userAgent);

  return isAndroidWebView || isIOSWebView || isInAppBrowser;
}

/**
 * Checks if the current environment supports external browser redirects
 */
export function supportsExternalBrowser(): boolean {
  // Check if we can open external URLs
  return typeof window !== 'undefined' && 
         typeof window.location !== 'undefined' &&
         isEmbeddedBrowser();
}
