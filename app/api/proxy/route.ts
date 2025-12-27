// app/api/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
  'Access-Control-Max-Age': '86400',
};

// Domains that need special handling
const SPECIAL_DOMAINS: Record<string, { headers?: Record<string, string> }> = {
  '190.92.10.66': {
    headers: {
      'Referer': 'https://190.92.10.66/',
      'Origin': 'https://190.92.10.66',
    },
  },
  '135.125.109.73': {
    headers: {
      'Referer': 'http://135.125.109.73/',
    },
  },
  '148.113.207.98': {
    headers: {
      'Referer': 'http://148.113.207.98/',
    },
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get('url');

    if (!urlParam) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Decode URL
    let targetUrl: string;
    try {
      targetUrl = decodeURIComponent(urlParam);
    } catch {
      targetUrl = urlParam;
    }

    // Parse URL for security and domain info
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    console.log(`[PROXY] Fetching: ${parsedUrl.hostname}${parsedUrl.pathname}`);

    // Prepare fetch headers
    const fetchHeaders: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };

    // Add special domain headers if needed
    const domainConfig = SPECIAL_DOMAINS[parsedUrl.hostname];
    if (domainConfig?.headers) {
      Object.entries(domainConfig.headers).forEach(([key, value]) => {
        fetchHeaders[key] = value;
      });
    }

    // Add Range header if present in request
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    // Fetch the content
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: fetchHeaders,
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[PROXY] Failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Upstream error: ${response.status} ${response.statusText}` },
        { 
          status: response.status,
          headers: CORS_HEADERS
        }
      );
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 
                       (targetUrl.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t');

    // Handle HLS playlists (.m3u8 files)
    if (contentType.includes('mpegurl') || contentType.includes('vnd.apple.mpegurl') || targetUrl.endsWith('.m3u8')) {
      const playlistText = await response.text();
      
      // Rewrite URLs in the playlist
      const rewrittenPlaylist = rewritePlaylistUrls(playlistText, targetUrl);
      
      return new NextResponse(rewrittenPlaylist, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // For video segments (.ts files) and other content
    const contentLength = response.headers.get('content-length');
    const contentRange = response.headers.get('content-range');

    const headers = new Headers({
      ...CORS_HEADERS,
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    if (contentLength) headers.set('Content-Length', contentLength);
    if (contentRange) {
      headers.set('Content-Range', contentRange);
      headers.set('Accept-Ranges', 'bytes');
    }

    // Return the stream
    return new NextResponse(response.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('[PROXY] Error:', error);
    return NextResponse.json(
      { error: 'Internal proxy error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

// Helper function to rewrite playlist URLs
function rewritePlaylistUrls(playlist: string, baseUrl: string): string {
  const baseUrlObj = new URL(baseUrl);
  const lines = playlist.split('\n');
  const rewrittenLines: string[] = [];

  for (let line of lines) {
    line = line.trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      rewrittenLines.push(line);
      continue;
    }

    // Handle different URL formats
    if (line.startsWith('http://') || line.startsWith('https://')) {
      // Absolute URL - proxy it
      rewrittenLines.push(`/api/proxy?url=${encodeURIComponent(line)}`);
    } else if (line.startsWith('/')) {
      // Root-relative URL
      const absoluteUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${line}`;
      rewrittenLines.push(`/api/proxy?url=${encodeURIComponent(absoluteUrl)}`);
    } else if (line.startsWith('./') || line.startsWith('../')) {
      // Relative URL
      try {
        const absoluteUrl = new URL(line, baseUrl).toString();
        rewrittenLines.push(`/api/proxy?url=${encodeURIComponent(absoluteUrl)}`);
      } catch {
        rewrittenLines.push(line);
      }
    } else if (line.includes('.ts') || line.includes('.m3u8')) {
      // Probably a segment or nested playlist
      try {
        const absoluteUrl = new URL(line, baseUrl).toString();
        rewrittenLines.push(`/api/proxy?url=${encodeURIComponent(absoluteUrl)}`);
      } catch {
        rewrittenLines.push(line);
      }
    } else {
      rewrittenLines.push(line);
    }
  }

  return rewrittenLines.join('\n');
}