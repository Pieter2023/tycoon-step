// Validates full-game access codes.
//
// Two sources, checked in order:
// 1. ACCESS_CODES env var — comma-separated list of codes (case-insensitive).
//    Use for beta testers, bulk/classroom packs, and manual sales.
// 2. Gumroad license keys — set GUMROAD_PRODUCT_ID to the product's ID and
//    every license key Gumroad issues for that product becomes a valid code.
//    Refunded or charged-back purchases are rejected.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

const reply = (statusCode: number, body: object) => ({
  statusCode,
  headers: jsonHeaders,
  body: JSON.stringify(body)
});

export const handler = async (event: { httpMethod?: string; body?: string }) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return reply(405, { valid: false, error: 'Method not allowed' });
  }

  let code = '';
  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    code = typeof payload.code === 'string' ? payload.code.trim() : '';
  } catch {
    return reply(400, { valid: false, error: 'Invalid JSON body' });
  }
  if (!code || code.length > 200) {
    return reply(400, { valid: false, error: 'Missing code' });
  }

  const envCodes = (process.env.ACCESS_CODES || '')
    .split(',')
    .map(c => c.trim().toLowerCase())
    .filter(Boolean);
  if (envCodes.includes(code.toLowerCase())) {
    return reply(200, { valid: true, source: 'code' });
  }

  const productId = process.env.GUMROAD_PRODUCT_ID;
  if (productId) {
    try {
      const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ product_id: productId, license_key: code })
      });
      const data = await res.json() as {
        success?: boolean;
        purchase?: { refunded?: boolean; chargebacked?: boolean };
      };
      if (data.success && data.purchase && !data.purchase.refunded && !data.purchase.chargebacked) {
        return reply(200, { valid: true, source: 'gumroad' });
      }
    } catch (e) {
      console.error('Gumroad license verify failed:', e);
      return reply(502, { valid: false, error: 'License verification unavailable' });
    }
  }

  return reply(200, { valid: false });
};
