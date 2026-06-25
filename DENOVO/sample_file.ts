/**
 * reCAPTCHA v2 Enterprise solver using GPT-4.1 Vision
 *
 * Reads config from:
 *   - .env           → API keys
 *   - tests/test_data.json → page URL & card details
 */

import { test, Page } from '@playwright/test';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

// ─── Load config ────────────────────────────────────────────────────────────

// Parse .env file
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

// Parse test_data.json (supports KEY=VALUE lines, ignores { } and # comments)
const dataPath = path.resolve('tests/test_data.json');
const config: Record<string, string> = {};
for (const line of fs.readFileSync(dataPath, 'utf-8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed === '{' || trimmed === '}') continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  config[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

// ─── Constants ──────────────────────────────────────────────────────────────

const GPT4_URL = env['AZURE_OPENAI_GPT4_URL'];
const GPT4_KEY = env['AZURE_OPENAI_GPT4_KEY'];
const RECAPTCHA_STRATEGY = env['RECAPTCHA_STRATEGY'] || 'vision-llm';
const PAGE_URL = config['PAYMENT_PAGE_URL'];
const CARD = {
  number: config['CARD_NUMBER'] || '4111111111111111',
  expiry: config['CARD_EXPIRY'] || '12/28',
  cvv: config['CARD_CVV'] || '123',
  holder: config['CARD_HOLDER'] || 'Test User',
  email: config['CARD_EMAIL'] || 'test@example.com',
  phone: config['CARD_PHONE'] || '8122812418',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Sends a base64 image + prompt to GPT-4.1 Vision and returns the answer text */
async function askGPT4Vision(base64: string, prompt: string): Promise<string | null> {
  try {
    const res = await fetch(GPT4_URL, {
      method: 'POST',
      headers: { 'api-key': GPT4_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
          ],
        }],
        max_tokens: 10,
        temperature: 0,
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) return null;
    return data?.choices?.[0]?.message?.content?.trim().toUpperCase() || null;
  } catch {
    return null;
  }
}

/** Fills the payment form fields */
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

/** Clicks the reCAPTCHA checkbox inside the anchor iframe */
async function clickRecaptchaCheckbox(page: Page): Promise<void> {
  await page.waitForSelector('iframe[src*="recaptcha/enterprise/anchor"]', { state: 'attached', timeout: 15000 });
  const frame = page.frames().find(
    (f) => f.url().includes('recaptcha/enterprise/anchor') && f.url().includes('6LdlWF8p')
  );
  if (!frame) throw new Error('Could not find reCAPTCHA anchor iframe');
  await frame.locator('.recaptcha-checkbox-border').click();
}

/**
 * Solves the image-grid challenge by:
 * 1. Downloading the tile spritesheet
 * 2. Cropping each tile individually with sharp
 * 3. Asking GPT-4.1 if each tile contains the target
 * 4. Clicking matching tiles with human-like delays
 */
async function solveChallenge(page: Page): Promise<boolean> {
  // Locate the challenge iframe (bframe)
  const bframe = page.frames().find((f) => f.url().includes('recaptcha/enterprise/bframe'));
  if (!bframe) return false;

  // Read challenge info from the page
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
  const cols = is3x3 ? 3 : 4;
  const rows = is3x3 ? 3 : 4;
  console.log(`\nChallenge: find "${challenge.target}" in ${cols}x${rows} grid`);

  // Download & crop the spritesheet
  const res = await fetch(challenge.spritesheetUrl);
  if (!res.ok) return false;
  const spriteBuf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(spriteBuf).metadata();
  const tileW = Math.floor((meta.width || 300) / cols);
  const tileH = Math.floor((meta.height || 300) / rows);

  // Classify each tile
  const matches: number[] = [];
  for (let i = 0; i < challenge.tileCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const tile = await sharp(spriteBuf)
      .extract({ left: col * tileW, top: row * tileH, width: tileW, height: tileH })
      .png()
      .toBuffer();
    const b64 = tile.toString('base64');

    const answer = await askGPT4Vision(b64, `Does this image contain "${challenge.target}"? Answer ONLY YES or NO.`);
    console.log(`  Tile ${i + 1}: ${answer}`);
    if (answer === 'YES') matches.push(i);
  }

  if (matches.length === 0) {
    console.log('  No matching tiles found');
    return false;
  }
  console.log(`  Matching tiles: ${matches.map((i) => i + 1).join(', ')}`);

  // Click matches with human-like timing
  const tiles = bframe.locator('.rc-imageselect-tile');
  for (const idx of matches) {
    await page.waitForTimeout(800 + Math.random() * 1200); // pause before selecting
    try { await tiles.nth(idx).hover(); } catch { break; }
    await page.waitForTimeout(200 + Math.random() * 400);  // hover duration
    try { await tiles.nth(idx).click(); } catch { break; }
  }

  // Click Verify button
  await page.waitForTimeout(2000);
  try {
    const verify = bframe.locator('#recaptcha-verify-button');
    if (await verify.isVisible().catch(() => false)) {
      console.log('  → clicking Verify');
      await verify.click();
    }
  } catch {}

  // Wait and check if challenge is solved
  await page.waitForTimeout(5000);
  return !page.frames().some((f) => f.url().includes('recaptcha/enterprise/bframe'));
}

// ─── Test ────────────────────────────────────────────────────────────────────

test('reCAPTCHA v2 Enterprise solver via GPT-4.1 Vision', async ({ page }) => {
  test.setTimeout(600_000);

  // 1. Open payment page & fill form
  console.log('Opening payment page...');
  await page.goto(PAGE_URL, { waitUntil: 'load', timeout: 30_000 });
  await fillForm(page);

  // 2. Trigger reCAPTCHA
  await clickRecaptchaCheckbox(page);
  console.log('Waiting for challenge to appear...');
  await page.waitForTimeout(5000);

  // 3. Solve (up to 5 attempts)
  let solved = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`\n─── Attempt ${attempt} ───`);
    solved = await solveChallenge(page);
    if (solved) {
      console.log('\n✅ SOLVED!');
      break;
    }
  }

  // 4. Report result
  await page.screenshot({ path: 'final.png', fullPage: true });
  const payDisabled = await page.locator('#pay').isDisabled();
  console.log(`\nResult: ${solved ? '✅ Solved' : '❌ Failed'}, Pay button disabled: ${payDisabled}`);

  // Keep browser open for inspection
  await page.pause();
});
