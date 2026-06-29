import { test } from '@playwright/test';
import { RecaptchaPage } from '../pages/RecaptchaPage';
import { PAGE_URL } from '../utils/recaptcha';

test('reCAPTCHA v2 Enterprise solver — GPT-4.1 + NoCaptcha consensus', async ({ page }) => {
  test.setTimeout(600_000);

  await page.addInitScript(() => {
    delete (navigator as any).__proto__.webdriver;
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    (window as any).chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] as any });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });

  const recaptcha = new RecaptchaPage(page);

  console.log('Opening payment page...');
  await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  console.log('  → page loaded');
  await recaptcha.fillForm();

  await recaptcha.clickRecaptchaCheckbox();
  console.log('Waiting for challenge...');
  await page.waitForTimeout(5000);

  let solved = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`\n─── Attempt ${attempt} ───`);
    solved = await recaptcha.solveChallenge();
    if (solved) {
      console.log('\n✅ reCAPTCHA solved!');
      break;
    }
  }

  await page.screenshot({ path: 'recaptcha-result.png', fullPage: true });
  console.log(`\nResult: ${solved ? '✅ Solved' : '❌ Failed'}`);
});
