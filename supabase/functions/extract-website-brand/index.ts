// Supabase Edge Function: extract-website-brand
// Fetches a website using Firecrawl and extracts a simple brand palette
// Requires secret FIRECRAWL_API_KEY configured in Supabase project settings

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface ExtractRequest {
  url?: string;
}

function hexNormalize(hex: string): string | null {
  const m = hex.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return `#${h.toLowerCase()}`;
}

function hexToRgb(hex: string) {
  const n = hexNormalize(hex);
  if (!n) return null;
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  return { r, g, b };
}

function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(hex1: string, hex2: string) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 1;
  const L1 = luminance(rgb1) + 0.05;
  const L2 = luminance(rgb2) + 0.05;
  return L1 > L2 ? L1 / L2 : L2 / L1;
}

function pickTextOn(bg: string) {
  const white = '#ffffff';
  const black = '#111111';
  return contrastRatio(bg, white) >= contrastRatio(bg, black) ? white : black;
}

function extractMeta(content: string, name: string) {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  const m = content.match(re);
  return m ? m[1] : undefined;
}

function extractTitle(content: string) {
  const m = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : undefined;
}

function extractColorsFromHtml(html: string) {
  const hexes = html.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) || [];
  const freq = new Map<string, number>();
  for (const h of hexes) {
    const n = hexNormalize(h);
    if (!n) continue;
    // skip near white/black greys
    if (['#ffffff', '#fff', '#000000', '#000'].includes(h.toLowerCase())) continue;
    const { r, g, b } = hexToRgb(n)!;
    const isGrey = Math.abs(r - g) < 8 && Math.abs(g - b) < 8;
    if (isGrey) continue;
    freq.set(n, (freq.get(n) || 0) + 1);
  }
  const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0]?.[0] || '#2b2b2b';
  return { primary };
}

serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { url } = (await req.json()) as ExtractRequest;
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'Missing url' }), {
        status: 400,
        headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Missing FIRECRAWL_API_KEY in function secrets' }), {
        status: 500,
        headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Call Firecrawl scrape endpoint (single page)
    const fcRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({ url, formats: ['html'] }),
    });

    if (!fcRes.ok) {
      const text = await fcRes.text();
      return new Response(JSON.stringify({ success: false, error: 'Firecrawl request failed', details: text }), {
        status: 502,
        headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const fcJson = await fcRes.json();
    // Attempt to locate HTML in common fields
    const html: string | undefined = fcJson?.data?.html || fcJson?.html || fcJson?.content || '';

    if (!html) {
      return new Response(JSON.stringify({ success: false, error: 'No HTML returned from Firecrawl' }), {
        status: 500,
        headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const title = extractTitle(html) || new URL(url).hostname;
    const description = extractMeta(html, 'description');
    const themeColor = extractMeta(html, 'theme-color');
    const { primary } = extractColorsFromHtml(html);

    // Pick background from theme-color or dark default
    const background = hexNormalize(themeColor || '#0b0b0b')!;
    const text = pickTextOn(background);

    const response = {
      success: true,
      title,
      description,
      colors: {
        background,
        primary,
        text,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message || 'Unknown error' }), {
      status: 500,
      headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
