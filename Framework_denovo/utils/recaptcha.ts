import * as fs from 'fs';
import * as path from 'path';

// ─── Load test data ──────────────────────────────────────────────────────────

const testData: Record<string, string> = JSON.parse(
  fs.readFileSync(path.resolve('data/test_data.json'), 'utf-8')
);

// ─── Constants ───────────────────────────────────────────────────────────────

const NOCAPTCHA_KEY = process.env['NOCAPTCHA_KEY'] || 'praveen-086576f3-eb00-05f9-a8a4-bf801602f9a2';
const GPT4_URL = process.env['AZURE_OPENAI_GPT4_URL'] as string;
const GPT4_KEY = process.env['AZURE_OPENAI_GPT4_KEY'] as string;
const NOCAPTCHA_URL = 'https://api.nocaptchaai.com/createTask';
const PAGE_URL = testData['PAYMENT_PAGE_URL'];
const CHROME_USER_DATA_DIR = testData['CHROME_USER_DATA_DIR'] || path.join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'User Data');
const BROWSER_CHANNEL = testData['BROWSER_CHANNEL'] || 'chrome';
export { PAGE_URL, CHROME_USER_DATA_DIR, BROWSER_CHANNEL };

export const CARD = {
  amount:  testData['CARD_AMOUNT']  || '10.00',
  number:  testData['CARD_NUMBER']  || '4111111111111111',
  expiry:  testData['CARD_EXPIRY']  || '12/28',
  cvv:     testData['CARD_CVV']     || '123',
  holder:  testData['CARD_HOLDER']  || 'Test User',
  email:   testData['CARD_EMAIL']   || 'test@example.com',
  phone:   testData['CARD_PHONE']   || '8122812418',
  customerName : testData['CARD_CUSTOMER_NAME'] || 'Test User',
  zipCode: testData['CARD_ZIP_CODE'] || '12345',
  gmailPassword: testData['CARD_GMAIL_PASSWORD'] || 'Thamizhanpk',
  
gSignIn : testData['googleSignIN']
};

// ─── NoCaptcha AI API ────────────────────────────────────────────────────────

export async function classifyWithNoCaptcha(
  spritesheetBase64: string,
  question: string,
  is3x3: boolean,
): Promise<number[] | null> {
  const questionType = is3x3 ? '33' : '44';

  const body = {
    clientKey: NOCAPTCHA_KEY,
    source: 'chrome',
    version: '1.0.0',
    task: {
      type: 'ReCaptchaV2Classification',
      questionType,
      image: [spritesheetBase64],
      question,
      websiteURL: PAGE_URL,
    },
  };

  try {
    const res = await fetch(NOCAPTCHA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as any;

    if (data.errorId !== 0) {
      console.log('  NoCaptcha error:', JSON.stringify(data).substring(0, 200));
      return null;
    }

    const objects: number[] = data.solution?.objects;
    if (!objects || objects.length === 0) return null;
    return objects;
  } catch (e) {
    console.log('  NoCaptcha fetch error:', (e as Error).message);
    return null;
  }
}

// ─── GPT-4.1 Vision API ──────────────────────────────────────────────────────

export async function classifyWithGPT4(
  spritesheetBase64: string,
  question: string,
  tileCount: number,
): Promise<number[] | null> {
  const cols = tileCount === 9 ? 3 : 4;
  const rows = tileCount === 9 ? 3 : 4;

  const body = {
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `This is a reCAPTCHA challenge grid (${rows}x${cols}). The task is to select all tiles containing "${question}". Tiles are numbered 0 to ${tileCount - 1} row by row (left to right, top to bottom). Return ONLY a valid JSON array of matching tile numbers, e.g. [0, 3, 5]. If none match, return []. No other text.`,
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${spritesheetBase64}` },
          },
        ],
      },
    ],
    max_tokens: 200,
  };

  try {
    const res = await fetch(GPT4_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': GPT4_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.log(`  GPT-4.1 error ${res.status}: ${await res.text().then(t => t.substring(0, 200))}`);
      return null;
    }
    const data = await res.json() as any;
    const text = data.choices?.[0]?.message?.content || '';
    const match = text.match(/\[[\d,\s]*\]/);
    if (!match) {
      console.log('  GPT-4.1: no array found in response:', text.substring(0, 100));
      return null;
    }
    const parsed = JSON.parse(match[0]) as number[];
    const indices = parsed.filter((n) => n >= 0 && n < tileCount);
    return indices.length ? indices : null;
  } catch (e) {
    console.log('  GPT-4.1 fetch error:', (e as Error).message);
    return null;
  }
}

// ─── Distorted text CAPTCHA solver via GPT-4 Vision ──────────────────────────

export async function readImageText(base64Image: string): Promise<string> {
  const body = {
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Read and return ONLY the text shown in this distorted CAPTCHA image. Return just the text characters, nothing else.',
        },
        {
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${base64Image}` },
        },
      ],
    }],
    max_tokens: 50,
  };

  const res = await fetch(GPT4_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': GPT4_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GPT-4 Vision error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content || '';
  return text.replace(/["']/g, '').trim();
}

// ─── Consensus: intersect two tile sets ──────────────────────────────────────

export function intersect(a: number[], b: number[]): number[] {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}
