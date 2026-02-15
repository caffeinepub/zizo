/**
 * Generates a shareable URL for a specific feed post.
 * The URL includes a postId parameter that enables deep-linking.
 */
export function generateShareUrl(postId: string): string {
  if (typeof window === 'undefined') return '';
  
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('postId', postId);
  
  return url.toString();
}

/**
 * Copies text to clipboard using the modern Clipboard API.
 * Returns true if successful, false otherwise.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator?.clipboard) {
    console.warn('Clipboard API not supported');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Checks if the native share API is available.
 */
export function isNativeShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Shares content using the native share sheet if available.
 * Returns true if successful, false otherwise.
 */
export async function nativeShare(data: { title?: string; text?: string; url: string }): Promise<boolean> {
  if (!isNativeShareSupported()) {
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error: any) {
    // User cancelled the share or error occurred
    if (error.name !== 'AbortError') {
      console.error('Native share failed:', error);
    }
    return false;
  }
}
