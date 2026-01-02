const OPENAI_API_URL = 'https://api.openai.com/v1/images/edits';
const MODEL_NAME = 'gpt-image-1';
const IMAGE_SIZE = '1024x1024';

const buildPrompt = (outfit: { shirt?: string; accessory?: string; hair?: string }) => {
  const shirt = outfit.shirt || 'tailored executive outfit';
  const accessory = outfit.accessory || 'no accessory';
  const hair = outfit.hair || 'original hairstyle';
  return [
    'Apply a subtle style tweak to this 3D cartoon character.',
    `Outfit: ${shirt}.`,
    `Accessory: ${accessory}.`,
    `Hair: ${hair}.`,
    'Keep facial features identical.',
    'Clean studio render.'
  ].join(' ');
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler = async (event: { httpMethod?: string; body?: string }) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method not allowed' };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: 'Missing OPENAI_API_KEY' };
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const imageBase64 = payload.imageBase64;
    const imageMime = payload.imageMime || 'image/jpeg';
    const outfit = payload.outfit || {};
    if (!imageBase64) {
      return { statusCode: 400, headers: corsHeaders, body: 'Missing imageBase64' };
    }

    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const formData = new FormData();
    formData.append('model', MODEL_NAME);
    formData.append('prompt', buildPrompt(outfit));
    formData.append('n', '1');
    formData.append('size', IMAGE_SIZE);
    formData.append('image', new Blob([imageBuffer], { type: imageMime }), 'avatar.jpg');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000);
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let message = errorText;
      try {
        const parsed = JSON.parse(errorText);
        message = parsed?.error?.message || message;
      } catch (err) {
        // Keep raw error text.
      }
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: message })
      };
    }

    const data = await response.json();
    const image = data.data?.[0]?.b64_json || '';

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ image }) };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        statusCode: 504,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Avatar render timed out. Try again.' })
      };
    }
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Avatar render failed' })
    };
  }
};
