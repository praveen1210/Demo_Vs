/**
 * reCAPTCHA v2 Enterprise solver — Consensus approach
 *
 * Uses BOTH GPT-4.1 Vision AND NoCaptcha AI to classify tiles.
 * Only clicks tiles where both services agree, improving precision.
 *
 * Config:
 *   .env                   → API keys & solving strategy
 *   tests/test_data.json   → page URL & card details
 */

import { test, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

// ─── Config loading ──────────────────────────────────────────────────────────

function loadEnv(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return result;
}

function loadConfig(filePath: string): Record<string, string> {
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  if (raw.startsWith('{')) return JSON.parse(raw);
  const result: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed === '{' || trimmed === '}') continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return result;
}

const env = loadEnv(path.resolve('.env'));
const config = loadConfig(path.resolve('tests/test_data.json'));

// ─── Constants ───────────────────────────────────────────────────────────────

const NOCAPTCHA_KEY = env['NOCAPTCHA_KEY'] || 'praveen-086576f3-eb00-05f9-a8a4-bf801602f9a2';
const GPT4_URL = env['AZURE_OPENAI_GPT4_URL'];
const GPT4_KEY = env['AZURE_OPENAI_GPT4_KEY'];
const NOCAPTCHA_URL = 'https://api.nocaptchaai.com/createTask';
const PAGE_URL = config['PAYMENT_PAGE_URL'];

const CARD = {
  number:  config['CARD_NUMBER']  || '4111111111111111',
  expiry:  config['CARD_EXPIRY']  || '12/28',
  cvv:     config['CARD_CVV']     || '123',
  holder:  config['CARD_HOLDER']  || 'Test User',
  email:   config['CARD_EMAIL']   || 'test@example.com',
  phone:   config['CARD_PHONE']   || '8122812418',
};

// ─── NoCaptcha AI API ────────────────────────────────────────────────────────

async function classifyWithNoCaptcha(
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

async function classifyWithGPT4(
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
    return indices.length ? indices : [];
  } catch (e) {
    console.log('  GPT-4.1 fetch error:', (e as Error).message);
    return null;
  }
}

// ─── Consensus: intersect two tile sets ──────────────────────────────────────

function intersect(a: number[], b: number[]): number[] {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

// ─── Page helpers ───────────────────────────────────────────────────────────

async function fillForm(page: Page): Promise<void> {
  await page.fill('#card', CARD.number);
  await page.fill('#expiry-date', CARD.expiry);
  await page.fill('#cvv', CARD.cvv);
  await page.fill('#cardHolderName', CARD.holder);
  await page.fill('#emailInput', CARD.email);
  if (await page.locator('#phoneNumber').isVisible()) {
    await page.fill('#phoneNumber', CARD.phone);
  }
}

async function clickRecaptchaCheckbox(page: Page): Promise<void> {
  await page.waitForSelector('iframe[src*="recaptcha/enterprise/anchor"]', { state: 'attached', timeout: 15000 });
  const frame = page.frames().find(
    (f) => f.url().includes('recaptcha/enterprise/anchor') && f.url().includes('6LdlWF8p'),
  );
  if (!frame) throw new Error('Could not find reCAPTCHA anchor iframe');
  await frame.locator('.recaptcha-checkbox-border').click();
}

async function solveChallenge(page: Page): Promise<boolean> {
  const bframe = page.frames().find((f) => f.url().includes('recaptcha/enterprise/bframe'));
  if (!bframe) return false;

  const challenge = await bframe.evaluate(() => {
    const el = document.querySelector('#rc-imageselect');
    if (!el) return null;
    const desc = el.querySelector('.rc-imageselect-desc, .rc-imageselect-desc-no-canonical');
    const target = desc?.querySelector('strong')?.textContent?.trim() || '';
    const tileCount = el.querySelectorAll('.rc-imageselect-tile').length;
    const imgs = el.querySelectorAll<HTMLImageElement>('.rc-image-tile-33, .rc-image-tile-44');
    return { target, tileCount, spritesheetUrl: imgs[0]?.src };
  });
  if (!challenge || !challenge.target || !challenge.spritesheetUrl) return false;

  const is3x3 = challenge.tileCount === 9;
  console.log(`\nChallenge: find "${challenge.target}" in ${is3x3 ? '3x3' : '4x4'}`);

  // Download spritesheet
  const res = await fetch(challenge.spritesheetUrl);
  if (!res.ok) return false;
  const spriteBuf = Buffer.from(await res.arrayBuffer());
  const b64 = spriteBuf.toString('base64');

  // Classify with both services in parallel
  const [nocaptchaTiles, gptTiles] = await Promise.all([
    classifyWithNoCaptcha(b64, challenge.target, is3x3),
    classifyWithGPT4(b64, challenge.target, challenge.tileCount),
  ]);

  console.log(`  NoCaptcha tiles: ${nocaptchaTiles?.join(', ') || 'none'}`);
  console.log(`  GPT-4.1 tiles:   ${gptTiles?.join(', ') || 'none'}`);

  // Consensus: only click tiles BOTH agree on
  let consensus: number[];
  if (nocaptchaTiles && gptTiles) {
    consensus = intersect(nocaptchaTiles, gptTiles);
  } else if (nocaptchaTiles) {
    consensus = nocaptchaTiles;
  } else if (gptTiles) {
    consensus = gptTiles;
  } else {
    return false;
  }

  consensus = consensus.filter((n) => n >= 0 && n < challenge.tileCount);
  console.log(`  Consensus tiles: ${consensus.join(', ') || 'none (skipping round)'}`);

  if (consensus.length === 0) return false;

  // Click consensus tiles with human-like timing
  const tiles = bframe.locator('.rc-imageselect-tile');
  for (const idx of consensus) {
    await page.waitForTimeout(800 + Math.random() * 1200);
    try { await tiles.nth(idx).hover(); } catch { break; }
    await page.waitForTimeout(200 + Math.random() * 400);
    try { await tiles.nth(idx).click(); } catch { break; }
  }

  // Click Verify
  await page.waitForTimeout(2000);
  try {
    const verify = bframe.locator('#recaptcha-verify-button');
    if (await verify.isVisible().catch(() => false)) {
      console.log('  → clicking Verify');
      await verify.click();
    }
  } catch {}

  await page.waitForTimeout(5000);
  return !page.frames().some((f) => f.url().includes('recaptcha/enterprise/bframe'));
}

// ─── Test ────────────────────────────────────────────────────────────────────

test('reCAPTCHA v2 Enterprise solver — GPT-4.1 + NoCaptcha consensus', async ({ page }) => {
  test.setTimeout(600_000);

  // Hide automation traces
  await page.addInitScript(() => {
    // @ts-ignore
    delete navigator.__proto__.webdriver;
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    (window as any).chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] as any });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  console.log('Opening payment page...');
  await page.goto(PAGE_URL, { waitUntil: 'load', timeout: 30_000 });
  await fillForm(page);

  await clickRecaptchaCheckbox(page);
  console.log('Waiting for challenge...');
  await page.waitForTimeout(5000);

  let solved = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`\n─── Attempt ${attempt} ───`);
    solved = await solveChallenge(page);
    if (solved) {
      console.log('\n✅ SOLVED!');
      break;
    }
  }

  await page.screenshot({ path: 'final.png', fullPage: true });
  const payDisabled = await page.locator('#pay').isDisabled();
  console.log(`\nResult: ${solved ? '✅ Solved' : '❌ Failed'}, Pay button disabled: ${payDisabled}`);

  // await page.pause();
});
