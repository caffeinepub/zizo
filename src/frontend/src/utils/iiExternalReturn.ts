/**
 * Utilities for managing the external-browser Internet Identity return flow.
 * Handles state persistence, callback detection, and URL cleanup.
 */

const EXTERNAL_LOGIN_STATE_KEY = 'ii_external_login_state';
const EXTERNAL_LOGIN_NONCE_KEY = 'ii_external_login_nonce';

export interface ExternalLoginState {
  nonce: string;
  timestamp: number;
  returnUrl: string;
}

/**
 * Generates a random nonce for CSRF protection
 */
function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Stores the external login state before redirecting to II
 */
export function storeExternalLoginState(): string {
  const nonce = generateNonce();
  const state: ExternalLoginState = {
    nonce,
    timestamp: Date.now(),
    returnUrl: window.location.href
  };
  
  try {
    sessionStorage.setItem(EXTERNAL_LOGIN_STATE_KEY, JSON.stringify(state));
    sessionStorage.setItem(EXTERNAL_LOGIN_NONCE_KEY, nonce);
  } catch (error) {
    console.error('Failed to store external login state:', error);
  }
  
  return nonce;
}

/**
 * Retrieves and validates the stored external login state
 */
export function getExternalLoginState(): ExternalLoginState | null {
  try {
    const stateStr = sessionStorage.getItem(EXTERNAL_LOGIN_STATE_KEY);
    if (!stateStr) return null;
    
    const state: ExternalLoginState = JSON.parse(stateStr);
    
    // Check if state is expired (30 minutes)
    const MAX_AGE = 30 * 60 * 1000;
    if (Date.now() - state.timestamp > MAX_AGE) {
      clearExternalLoginState();
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to retrieve external login state:', error);
    return null;
  }
}

/**
 * Clears the external login state from storage
 */
export function clearExternalLoginState(): void {
  try {
    sessionStorage.removeItem(EXTERNAL_LOGIN_STATE_KEY);
    sessionStorage.removeItem(EXTERNAL_LOGIN_NONCE_KEY);
  } catch (error) {
    console.error('Failed to clear external login state:', error);
  }
}

/**
 * Checks if the current URL contains callback markers from external II login
 */
export function isReturningFromExternalLogin(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  
  // Check for II callback markers
  const hasIICallback = 
    urlParams.has('ii_callback') ||
    hashParams.has('ii_callback') ||
    window.location.hash.includes('#authorize');
  
  // Verify we have stored state
  const hasStoredState = !!getExternalLoginState();
  
  return hasIICallback && hasStoredState;
}

/**
 * Removes callback-related parameters from the URL
 */
export function cleanupCallbackUrl(): void {
  try {
    if (typeof window === 'undefined' || !window.history?.replaceState) {
      return;
    }

    const url = new URL(window.location.href);
    
    // Remove query parameters
    url.searchParams.delete('ii_callback');
    url.searchParams.delete('state');
    
    // Clean hash if it contains authorize
    if (url.hash.includes('#authorize')) {
      url.hash = '';
    }
    
    // Replace the URL without reloading
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.error('Failed to cleanup callback URL:', error);
  }
}

/**
 * Validates the nonce from the callback against stored nonce
 */
export function validateNonce(callbackNonce?: string): boolean {
  if (!callbackNonce) return false;
  
  try {
    const storedNonce = sessionStorage.getItem(EXTERNAL_LOGIN_NONCE_KEY);
    return storedNonce === callbackNonce;
  } catch (error) {
    console.error('Failed to validate nonce:', error);
    return false;
  }
}
