import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

function isPrivateIP(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (hostname.endsWith('.local')) return true;

  // IPv4 Private Address Space (RFC 1918)
  const parts = hostname.split('.').map(Number);
  if (parts.length === 4 && !parts.some(isNaN)) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
  }
  
  // Basic IPv6 loopback check
  if (hostname === '::1') return true;

  return false;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const urlObj = new URL(targetUrl);
    
    // SSRF Prevention
    if (isPrivateIP(urlObj.hostname)) {
      return NextResponse.json({ error: 'Private IP addresses are not allowed' }, { status: 403 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      return NextResponse.json({
        url: targetUrl,
        title: targetUrl,
        description: null,
        image: null,
        domain: urlObj.hostname
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const getMetaTag = (name: string) => 
      $(`meta[property="${name}"]`).attr('content') || 
      $(`meta[name="${name}"]`).attr('content');

    const title = getMetaTag('og:title') || getMetaTag('twitter:title') || $('title').text() || targetUrl;
    const description = getMetaTag('og:description') || getMetaTag('twitter:description') || getMetaTag('description') || null;
    let image = getMetaTag('og:image') || getMetaTag('twitter:image') || null;

    // Handle relative image URLs
    if (image && !image.startsWith('http')) {
      try {
        image = new URL(image, targetUrl).toString();
      } catch (e) {
        image = null;
      }
    }

    const data = {
      url: targetUrl,
      title,
      description,
      image,
      domain: urlObj.hostname
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
      }
    });

  } catch (error) {
    console.error('Link preview error:', error);
    return NextResponse.json({ error: 'Failed to generate link preview' }, { status: 500 });
  }
}
