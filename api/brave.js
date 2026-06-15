import { sendJson, handleOptions, requireEnv, errorMessage } from '../lib/api-utils.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const q = String(req.query.q || '').trim();
    if (!q) return sendJson(res, 400, { error: 'Missing query parameter: q' });

    const key = process.env.BRAVE_SEARCH_API_KEY || requireEnv('BRAVE_KEY');
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', q);
    url.searchParams.set('count', '8');
    url.searchParams.set('search_lang', 'zh-hans');

    const upstream = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': key
      },
      signal: AbortSignal.timeout(12000)
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return sendJson(res, upstream.status, { error: text || `Brave request failed: ${upstream.status}` });
    }

    sendJson(res, 200, JSON.parse(text));
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: errorMessage(error) });
  }
}
