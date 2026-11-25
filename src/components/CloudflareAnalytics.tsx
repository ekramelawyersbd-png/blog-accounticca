import { useEffect } from 'react';

const CF_BEACON_SCRIPT_ID = 'cloudflare-web-analytics-beacon';

/**
 * Conditionally injects the privacy-first Cloudflare Web Analytics beacon
 * when VITE_CLOUDFLARE_ANALYTICS_TOKEN is configured in the environment.
 * Produces zero network requests or console noise when unset.
 */
export function CloudflareAnalytics() {
  useEffect(() => {
    const token = (import.meta.env.VITE_CLOUDFLARE_ANALYTICS_TOKEN || '').trim();
    if (!token) return;
    if (document.getElementById(CF_BEACON_SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = CF_BEACON_SCRIPT_ID;
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.setAttribute('data-cf-beacon', JSON.stringify({ token }));
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById(CF_BEACON_SCRIPT_ID);
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    };
  }, []);

  return null;
}
