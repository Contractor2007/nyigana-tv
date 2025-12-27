// lib/stream-utils.ts

/**
 * Check if a URL needs to be proxied
 */
export function needsProxy(url: string): boolean {
  // Always proxy HTTP URLs
  if (url.startsWith('http://')) return true;
  
  // Proxy HTTPS URLs from these problematic domains
  const problematicDomains = [
    '190.92.10.66',
    '135.125.109.73',
    '148.113.207.98',
    'fl1.moveonjoy.com',
    '176.65.146.237',
    '138.68.138.119',
    '68.183.41.209',
    '69.64.57.208'
  ];
  
  try {
    const parsed = new URL(url);
    return problematicDomains.some(domain => parsed.hostname.includes(domain));
  } catch {
    return true; // If URL parsing fails, use proxy
  }
}

/**
 * Get the proxied URL for a stream
 */
export function getProxiedUrl(originalUrl: string): string {
  if (!needsProxy(originalUrl)) {
    return originalUrl;
  }
  
  const encodedUrl = encodeURIComponent(originalUrl);
  return `/api/proxy?url=${encodedUrl}`;
}

/**
 * Test if a stream URL is accessible
 */
export async function testStreamUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get the best available stream URL with fallbacks
 */
export async function getBestStreamUrl(originalUrl: string): Promise<string> {
  const strategies = [
    // Strategy 1: Try HTTPS directly (if HTTP)
    async () => {
      if (originalUrl.startsWith('http://')) {
        const httpsUrl = originalUrl.replace('http://', 'https://');
        if (await testStreamUrl(httpsUrl)) return httpsUrl;
      }
      return null;
    },
    
    // Strategy 2: Try with proxy
    async () => {
      const proxyUrl = getProxiedUrl(originalUrl);
      // We'll assume proxy works since it's our endpoint
      return proxyUrl;
    },
    
    // Strategy 3: Try original URL as last resort
    async () => {
      if (await testStreamUrl(originalUrl)) return originalUrl;
      return null;
    }
  ];

  for (const strategy of strategies) {
    try {
      const result = await strategy();
      if (result) {
        console.log(`Found working URL: ${result}`);
        return result;
      }
    } catch (error) {
      console.warn(`Strategy failed: ${error}`);
    }
  }

  throw new Error('No working stream URL found');
}