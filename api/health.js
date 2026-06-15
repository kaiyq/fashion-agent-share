import { sendJson, handleOptions } from '../lib/api-utils.js';

export default function handler(req, res) {
  if (handleOptions(req, res)) return;

  sendJson(res, 200, {
    ok: true,
    services: {
      brave: Boolean(process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_KEY),
      taobao: Boolean(process.env.RAPIDAPI_KEY),
      siliconflow: Boolean(process.env.SILICONFLOW_API_KEY)
    }
  });
}
