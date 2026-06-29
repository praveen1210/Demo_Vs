import { test, chromium, BrowserContext } from '@playwright/test';
import { RecaptchaPage } from '../pages/RecaptchaPage';
import { PAGE_URL, CHROME_USER_DATA_DIR, readImageText, CARD } from '../utils/recaptcha';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// ------------------------------------------------------------------
// Helper to kill all Chrome processes (clean start)
// ------------------------------------------------------------------
function killChrome(): void {
  try {
    execSync('taskkill /F /IM chrome.exe', { stdio: 'pipe', timeout: 5000 });
    console.log('→ Chrome killed');
  } catch {
    // Ignore if no Chrome running
  }
}

// ------------------------------------------------------------------
// Copy Chrome profile while excluding heavy/cache folders
// ------------------------------------------------------------------
function copyProfile(src: string, dest: string): void {
  const skip = new Set([
    'Cache', 'Code Cache', 'Service Worker', 'File System',
    'IndexedDB', 'Local Storage', 'Session Storage', 'extensions',
    'ShaderCache', 'GPUCache', 'safe_browsing', 'downloads',
    'grShaderCache', 'graphite-dawn-cache',
  ]);

  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!skip.has(entry.name)) {
        copyProfile(s, d);
      }
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// ------------------------------------------------------------------
// Main test
// ------------------------------------------------------------------
test('Complete Payment with Google Pay', async () => {
  test.setTimeout(600000); // 10 minutes

  // 1. Clean up any existing Chrome instances
  killChrome();

  // 2. Create a temporary copy of the Chrome profile
  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-payment-'));
  console.log('Copying Chrome profile to:', tempProfile);
  copyProfile(CHROME_USER_DATA_DIR, tempProfile);

  // 3. Launch persistent context with the copied profile
  console.log('Launching browser...');
  const context: BrowserContext = await chromium.launchPersistentContext(tempProfile, {
    channel: 'chrome',
    headless: false,          // Set to true if you want headless (but popup handling may differ)
    viewport: null,           // Maximized window
    ignoreHTTPSErrors: true,
    args: [
      '--start-maximized',
      '--disable-popup-blocking',
      '--disable-blink-features=AutomationControlled', // Avoid detection
    ],
  });

  try {
    // Get or create the main page
    // const page = await context.newPage();
   const page = context.pages()[0] || (await context.newPage());
    await page.goto(CARD.gSignIn, { waitUntil: 'domcontentloaded' });

  await page.waitForTimeout(2000);

    await page.locator('#identifierId').waitFor({ state: 'visible', timeout: 15_000 });
  
          const currentValue = await page.locator('#identifierId').inputValue();
          if (!currentValue) {
              await page.locator('#identifierId').click();
              await page.locator('#identifierId').fill('praveenkumarrmuckpk@gmail.com');
          } else {
              console.log('  → email pre-filled from profile');
          }
  await page.click("//span[text()='Next']");
  await page.waitForTimeout(5000);
console.log("Going to handle the captcha");
  // ── Handle Google CAPTCHA if present (with retry loop) ─────────────────
  let captchaAttempts = 0;
  const MAX_CAPTCHA_ATTEMPTS = 5;
  while (await page.locator('#captchaimg').isVisible({ timeout: 3_000 }).catch(() => false)) {
    captchaAttempts++;
    if (captchaAttempts > MAX_CAPTCHA_ATTEMPTS) {
      console.log('  Max CAPTCHA attempts reached, proceeding...');
      break;
    }
    console.log(` CAPTCHA attempt ${captchaAttempts}/${MAX_CAPTCHA_ATTEMPTS}...`);
    const captchaBuffer = await page.locator('#captchaimg').screenshot();
    const captchaText = await readImageText(captchaBuffer.toString('base64'));
    console.log('  → CAPTCHA text read:', captchaText);
    await page.locator('#ca').type(captchaText);
    
    await page.waitForTimeout(2000);
  await page.click("//span[text()='Next']");
    await page.waitForTimeout(4000);
  }
  if (captchaAttempts === 0) {
    console.log('  → No CAPTCHA detected, proceeding directly to password');
  }

  // ── Enter password ───────────────────────────────────────────────────────
  const pwField = page.locator('input[type="password"]');
  if (await pwField.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await pwField.fill(CARD.gmailPassword);
    await page.locator('#passwordNext').click();
    await page.waitForTimeout(5000);
  }


  // 4. Navigate to your payment page
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded' });

    // 5. Fill payment form (example fields – adjust to your page)
    await page.locator('#inputAmt').type('10.00');
    await page.locator('#cxName').type('Praveen');

    console.log('  Clicking Pay button...');

    // Click the Pay button – clickPayButton() handles the popup & Google login internally
    // try {
    //   await recaptcha.clickPayButton();
    // } catch (error) {
    //   await page.waitForTimeout(1500)
    //   await page.click("//span[text()='Pay']");
    // }

      await page.waitForTimeout(1500)
    // Wait for the payment to complete on the main page
    // e.g. await page.locator('#successMessage').waitFor({ timeout: 30000 });


const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.locator('#gpay-button-online-api-id').click()
]);

      await page.waitForTimeout(1500)
await popup.click('#pay');
console.log("Pay Button has been clicked");

await page.waitForTimeout(1500);
    await page.locator('#cvv').fill(CARD.cvv, { timeout: 5_000 });
await page.waitForTimeout(1500);
    await page.click('#pay');
console.log('Payment flow completed.');

      await page.waitForTimeout(1500)
    // Take a final screenshot of the main page
    await page.screenshot({ path: 'main-page-final.png', fullPage: true });

  } catch (error) {
    console.error(' Test failed:', error);
    // Take a screenshot on failure for debugging
    const pages = context.pages();
    for (let i = 0; i < pages.length; i++) {
      await pages[i].screenshot({ path: `error-page-${i}.png`, fullPage: true });
    }
    throw error;
  } finally {
    // 11. Clean up
    // await context.close();
    // fs.rmSync(tempProfile, { recursive: true, force: true });
    console.log(' Profile cleaned up.');
  }
});

// test('As a user i should be able to complete the payment', async ({ page, context  }) => {
//   await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 50_000 });

  
//       await page.locator('#inputAmt').type('10.00');

// await page.locator('#cxName').type('Praveen');

//  await page.waitForTimeout(4000);
// //  const btn = page.locator('#gpay-button-online-api-id');
// //  await btn.click();
// const [popup] = await Promise.all([
//   page.waitForEvent('popup'),
//   page.getByRole('button', { name: /gpay|google pay/i }).click()
// ]);

// await page.waitForTimeout(1500);
// await popup.keyboard.type('praveenkumarrmuckpk@gmail.com');

// await page.waitForTimeout(1500);
// await popup.keyboard.press('Enter');

// await page.waitForTimeout(1500);
// await popup.keyboard.press('Enter');

// await page.waitForTimeout(1500);
// await popup.keyboard.press('Tab');

// await page.waitForTimeout(1500);
// await popup.keyboard.press('Tab');
// await page.waitForTimeout(1500);
// await popup.keyboard.press('Enter');

// await page.waitForTimeout(1500);
// await popup.keyboard.type('praveenkumarrmuckpk@gmail.com');

// await page.waitForTimeout(1500);
// await popup.keyboard.press('Enter');
// // await popup.waitForLoadState('domcontentloaded');
// // await popup.waitForTimeout(6000);
// // // await popup.screenshot({ path: 'gpay-popup.png', fullPage: true });
// // await popup.bringToFront();
// // await popup.keyboard.press('Tab');
// // await popup.keyboard.press('Tab');
// // await popup.keyboard.type('praveen@gmail.com');
// // await popup.keyboard.press('Enter');

  
//   // Click the G Pay button
//   // await page.click('#gpay-button-online-api-id');

//   // Wait for the Google iframe to appear
//   // const frame = await page.waitForSelector('iframe[src*="accounts.google.com"]');
//   // const popupFrame = await frame.contentFrame();

//   // Fill email field inside iframe
//   // await popupFrame?.fill('#identifierId', 'your-test-email@gmail.com');

//   // Click Next
//   // await popupFrame?.click('button:has-text("Next")');

// // await gpayFrame.locator('#identifierId').fill(process.env.GOOGLE_EMAIL!);
// // await gpayFrame.locator('#identifierNext').click();
// // await gpayFrame.locator('#identifierId').fill('praveenkumarrmcukpk@gmail.com');

// // const popupPromise = page.waitForEvent('popup');
// // await page.getByRole('button', { name: 'Google Pay' }).click();
// // const popup = await popupPromise;

// // await popup.waitForLoadState();
// // await expect(popup).toHaveTitle(/Google Pay|Pay/);

//  await page.waitForTimeout(3000);
// });