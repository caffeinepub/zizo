/**
 * Removes a query parameter from the current URL without reloading the page.
 * Supports both regular query strings (?param=value) and hash query strings (#?param=value).
 */
export function removeUrlParameter(paramName: string): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  
  // Check if we have hash-based query params
  if (url.hash.includes('?')) {
    const [hashPath, hashQuery] = url.hash.split('?');
    const hashParams = new URLSearchParams(hashQuery);
    
    if (hashParams.has(paramName)) {
      hashParams.delete(paramName);
      const newHashQuery = hashParams.toString();
      url.hash = newHashQuery ? `${hashPath}?${newHashQuery}` : hashPath;
      window.history.replaceState({}, '', url.toString());
      return;
    }
  }
  
  // Regular query params
  if (url.searchParams.has(paramName)) {
    url.searchParams.delete(paramName);
    window.history.replaceState({}, '', url.toString());
  }
}

/**
 * Gets a query parameter value from the current URL.
 * Supports both regular query strings (?param=value) and hash query strings (#?param=value).
 */
export function getUrlParameter(paramName: string): string | null {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  
  // Check hash-based query params first
  if (url.hash.includes('?')) {
    const hashQuery = url.hash.split('?')[1];
    const hashParams = new URLSearchParams(hashQuery);
    const value = hashParams.get(paramName);
    if (value) return value;
  }
  
  // Regular query params
  return url.searchParams.get(paramName);
}

/**
 * Gets a secret parameter from the URL (for admin tokens, etc.).
 * After retrieving, the parameter is removed from the URL to prevent exposure.
 * Supports both regular query strings (?param=value) and hash query strings (#?param=value).
 */
export function getSecretParameter(paramName: string): string | null {
  const value = getUrlParameter(paramName);
  
  if (value) {
    // Remove the secret parameter from URL immediately
    removeUrlParameter(paramName);
  }
  
  return value;
}
