import { sendJson, handleOptions, requireEnv, readJson, errorMessage } from '../lib/api-utils.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const payload = await readJson(req);
    const upstream = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${requireEnv('SILICONFLOW_API_KEY')}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000)
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return sendJson(res, upstream.status, { error: text || `SiliconFlow request failed: ${upstream.status}` });
    }

    sendJson(res, 200, JSON.parse(text));
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: errorMessage(error) });
  }
}
