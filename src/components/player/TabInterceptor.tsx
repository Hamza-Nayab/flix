'use client';

import { useEffect } from 'react';

/**
 * Global Tab Interceptor
 * Intercepts rogue third-party ad popups attempting to open new tabs/windows via window.open
 * while preserving legitimate intentional direct links (e.g. configured ad pass).
 *
 * NOTE: Never add window.addEventListener('blur', ...) or window.focus() here!
 * Cross-origin iframes trigger blur when clicked, and calling focus() steals focus
 * away from the video player, causing playback and control interaction to break.
 */
export default function TabInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalOpen = window.open;
    const directLink = process.env.NEXT_PUBLIC_DIRECT_LINK_URL?.trim();

    window.open = function (url, target, features) {
      // Allow configured direct link if present (e.g., intentional 12-hour ad-pass)
      if (
        directLink &&
        url &&
        (url === directLink || url.toString().includes(directLink))
      ) {
        return originalOpen.call(window, url, target, features);
      }

      console.warn('[Ad Interceptor] Blocked and auto-closed rogue popup redirect to:', url);
      return {
        closed: true,
        focus: () => {},
        close: () => {},
      } as unknown as Window;
    };

    return () => {
      window.open = originalOpen;
    };
  }, []);

  return null;
}
