import { sendJson, handleOptions, requireEnv, errorMessage } from '../lib/api-utils.js';

function normalizeItem(entry) {
  const item = entry?.item || {};
  const sku = item?.sku?.def || {};
  const seller = entry?.seller || {};
  const image = item.image || '';

  return {
    title: item.title || '-',
    price: sku.promotionPrice || sku.price || '-',
    originalPrice: sku.price || '-',
    sales: item.sales || '0',
    shop: seller.storeTitle || '',
    storeType: seller.storeType || '',
    image: image.startsWith('//') ? `https:${image}` : image
  };
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const q = String(req.query.q || '').trim();
    if (!q) return sendJson(res, 400, { error: 'Missing query parameter: q' });

    const url = new URL('https://taobao-datahub.p.rapidapi.com/item_search_x');
    url.searchParams.set('q', q);
    url.searchParams.set('page', '1');
    url.searchParams.set('pageSize', '10');
    url.searchParams.set('sort', 'default');
    url.searchParams.set('switches', 'tmall');
    url.searchParams.set('region', 'CN');

    const upstream = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'taobao-datahub.p.rapidapi.com',
        'x-rapidapi-key': requireEnv('RAPIDAPI_KEY')
      },
      signal: AbortSignal.timeout(12000)
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return sendJson(res, upstream.status, { error: text || `Taobao request failed: ${upstream.status}` });
    }

    const data = JSON.parse(text);
    const resultList = data?.result?.resultList || [];
    const total = data?.result?.base?.totalResults || resultList.length;

    sendJson(res, 200, {
      items: resultList.slice(0, 10).map(normalizeItem),
      total
    });
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: errorMessage(error) });
  }
}
