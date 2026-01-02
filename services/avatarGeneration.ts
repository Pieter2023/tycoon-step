type AvatarOptionsResponse = {
  images: string[];
  error?: string;
};

type AvatarFinalResponse = {
  image: string;
  error?: string;
};

const resolveApiBase = () => {
  const override = import.meta.env.VITE_API_BASE_URL;
  if (override) {
    return override;
  }

  return import.meta.env.PROD ? '/.netlify/functions' : '/api';
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTimeoutHtml = (text: string) =>
  /Inactivity Timeout/i.test(text) || /<html/i.test(text);

const postJsonWithRetry = async <T>(
  endpoint: string,
  body: Record<string, unknown>,
  retries = 2
): Promise<T> => {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        let detail = text;
        try {
          const parsed = JSON.parse(text);
          detail = parsed?.error || detail;
        } catch (err) {
          // Keep raw text.
        }
        if (attempt < retries && isTimeoutHtml(detail)) {
          await sleep(1200 * (attempt + 1));
          continue;
        }
        throw new Error(detail || 'Request failed');
      }

      return (await response.json()) as T;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error('Avatar request timed out. Please retry.');
      } else if (err instanceof Error) {
        lastError = err;
      } else {
        lastError = new Error('Request failed');
      }
      if (attempt < retries) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError ?? new Error('Request failed');
};

export async function generateAvatarOptions(selfieBase64: string): Promise<string[]> {
  const apiBase = resolveApiBase();
  const endpoint = `${apiBase}/avatar-options`;
  const images: string[] = [];
  for (let i = 1; i <= 1; i += 1) {
    const data = await postJsonWithRetry<AvatarOptionsResponse>(endpoint, {
      imageBase64: selfieBase64,
      imageMime: 'image/jpeg',
      variation: i
    });
    if (data.images?.[0]) {
      images.push(data.images[0]);
    }
  }

  return images;
}

export async function generateFinalAvatar(
  baseAvatarBase64: string,
  outfit: { shirt?: string; accessory?: string; hair?: string }
): Promise<string> {
  const apiBase = resolveApiBase();
  const endpoint = `${apiBase}/avatar-final`;
  const data = await postJsonWithRetry<AvatarFinalResponse>(endpoint, {
    imageBase64: baseAvatarBase64,
    imageMime: 'image/jpeg',
    outfit
  });
  return data.image || '';
}
