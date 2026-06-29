import { Page } from '@playwright/test';
import { CARD, classifyWithNoCaptcha, classifyWithGPT4, intersect } from '../utils/recaptcha';

export class RecaptchaPage {
  constructor(private page: Page) {}

  async fillForm() {
    await this.page.locator('#inputAmt').waitFor({ state: 'visible', timeout: 10_000 });
    await this.page.locator('#inputAmt').pressSequentially(CARD.amount, { timeout: 5_000 });
    await this.page.locator('#card').fill(CARD.number, { timeout: 5_000 });
    await this.page.locator('#expiry-date').fill(CARD.expiry, { timeout: 5_000 });
    await this.page.locator('#cvv').fill(CARD.cvv, { timeout: 5_000 });
    await this.page.locator('#cardHolderName').fill(CARD.holder, { timeout: 5_000 });
    await this.page.locator('#emailInput').fill(CARD.email, { timeout: 5_000 });
    if (await this.page.locator('#phoneNumber').isVisible()) {
      await this.page.locator('#phoneNumber').fill(CARD.phone, { timeout: 5_000 });
    }
    await this.page.locator('#cxName').pressSequentially(CARD.customerName, { timeout: 5_000 });

    if (await this.page.locator('#zip-code').isVisible()) {
      await this.page.locator('#zip-code').fill(CARD.zipCode, { timeout: 5_000 });
    }
  }
  
async clickPayButton() {
    await this.page.waitForTimeout(4000);
    const btn = this.page.locator('#gpay-button-online-api-id');
    const btnCount = await btn.count();
    console.log(`  → GPay button count: ${btnCount}`);

    if (btnCount === 0) {
        console.log('  → GPay button not found, filling card directly');
        return this.fillCardFields();
    }

    this.page.on('console', msg => {
        if (msg.type() === 'error') console.log(`  [console.error] ${msg.text()}`);
    });

    // const pagePromise = this.page.context().waitForEvent('page', { timeout: 30_000 });
    // console.log('  → clicking GPay button...');
    // await btn.click();

    // const gpayPage = await pagePromise.catch(() => null);

    const popupPromise = Promise.race([
    this.page.waitForEvent('popup').catch(() => null),
    this.page.context().waitForEvent('page').catch(() => null)
]);

await btn.click();

const gpayPage = await popupPromise;

    if (gpayPage) {
        console.log('  → GPay popup opened');
        await this.fillGoogleSignIn(gpayPage);
        return;
    }

    await this.page.waitForTimeout(6000);
    console.log(`  → page URL after GPay click: ${this.page.url()}`);
    console.log(`  → frames count: ${this.page.frames().length}`);
    for (const f of this.page.frames()) {
        console.log(`  → frame: ${f.url().substring(0, 100)}`);
    }

    const overlayBtns = await this.page.locator('button, [role="button"], .gpay-iframe').all();
    console.log(`  → interactive elements after click: ${overlayBtns.length}`);

    console.log('  → no GPay popup opened, filling card directly');
}

async fillGoogleSignIn(pageOrPopup: Page) {
    await pageOrPopup.waitForLoadState('networkidle');

    console.log('  → Popup title:', await pageOrPopup.title());
    console.log('  → Popup URL:', await pageOrPopup.url());

    try {
        await pageOrPopup.locator('#identifierId').waitFor({ state: 'visible', timeout: 15_000 });

        const currentValue = await pageOrPopup.locator('#identifierId').inputValue();
        if (!currentValue) {
            await pageOrPopup.locator('#identifierId').click();
            await pageOrPopup.locator('#identifierId').fill(CARD.email);
        } else {
            console.log('  → email already pre-filled from profile');
        }
    } catch {
        console.log('  → #identifierId not found, trying Tab + paste');
        await this.fillGoogleSignInViaKeyboard(pageOrPopup);
        return;
    }

    await pageOrPopup.screenshot({ path: 'gpay_mail_filled.png', fullPage: true });
    console.log('  → email entered, clicking Next...');

    await pageOrPopup.locator('#identifierNext').waitFor({ state: 'visible', timeout: 10_000 });
    await pageOrPopup.locator('#identifierNext').click();

    // Wait briefly for either password field or blocking screen to appear
    await pageOrPopup.waitForTimeout(2000);

    const bodyText = await pageOrPopup.locator('body').innerText().catch(() => '');
    if (bodyText.includes('This browser or app may not be secure')) {
        console.log('  ⚠️  Google blocked automated login.');
        await pageOrPopup.screenshot({ path: 'google-blocked.png', fullPage: true });
        return;
    }

    await pageOrPopup.screenshot({ path: 'gpay_Next.png', fullPage: true });

    if (CARD.gmailPassword) {
        const pwField = pageOrPopup.locator('input[type="password"]');
        if (await pwField.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await pwField.fill(CARD.gmailPassword, { timeout: 10_000 });
            await pageOrPopup.waitForTimeout(1000);
            await pageOrPopup.screenshot({ path: 'gpay_password.png', fullPage: true });

            const pwNext = pageOrPopup.locator('#passwordNext').first();
            await pwNext.waitFor({ state: 'visible', timeout: 10_000 });
            await pwNext.click();
            console.log('  → password submitted');
            await pageOrPopup.waitForTimeout(3000);
            await pageOrPopup.screenshot({ path: 'gpay_after_password.png', fullPage: true });
        }
    }

    console.log('  → GPay popup URL after login:', await pageOrPopup.url());
}

async fillGoogleSignInViaKeyboard(target: Page) {
    for (let i = 0; i < 30; i++) {
        await target.keyboard.press('Tab');
        await target.waitForTimeout(150);
        const focused = await target.evaluate(() => {
            const el = document.activeElement;
            if (!el) return null;
            const input = el as HTMLInputElement;
            return input.id || input.type || input.className || input.tagName;
        });
        if (focused === 'identifierId') {
            console.log('  → Tab navigated to #identifierId');
            break;
        }
    }

    await target.waitForTimeout(500);
    const currentValue = await target.evaluate(() => {
        const el = document.getElementById('identifierId') as HTMLInputElement;
        return el?.value || '';
    });
    if (!currentValue) {
        await target.keyboard.insertText(CARD.email);
        console.log('  → email pasted via keyboard');
    } else {
        console.log('  → email already pre-filled');
    }
    await target.keyboard.press('Enter');
    await target.waitForTimeout(5000);

    if (CARD.gmailPassword) {
        const pwField = target.locator('input[type="password"]');
        if (await pwField.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await pwField.fill(CARD.gmailPassword, { timeout: 10_000 });
            await target.waitForTimeout(1000);
            const pwNext = target.locator('#passwordNext').first();
            await pwNext.waitFor({ state: 'visible', timeout: 10_000 });
            await pwNext.click();
            console.log('  → password submitted');
            await target.waitForTimeout(3000);
        }
    }

    console.log('  → GPay popup URL:', await target.url());
}

  async fillCardFields() {
    await this.page.locator('#card').fill(CARD.number, { timeout: 5_000 });
    await this.page.locator('#expiry-date').fill(CARD.expiry, { timeout: 5_000 });
    await this.page.locator('#cvv').fill(CARD.cvv, { timeout: 5_000 });
    await this.page.locator('#cardHolderName').fill(CARD.holder, { timeout: 5_000 });
    console.log('  → card fields filled directly (skipped GPay)');
  }


  async clickRecaptchaCheckbox(){
    await this.page.waitForSelector('iframe[src*="recaptcha/enterprise/anchor"]', { state: 'attached', timeout: 15000 });
    const frame = this.page.frames().find(
      (f) => f.url().includes('recaptcha/enterprise/anchor') && f.url().includes('6LdlWF8p'),
    );
    if (!frame) throw new Error('Could not find reCAPTCHA anchor iframe');
    await frame.locator('.recaptcha-checkbox-border').click();
  }

  async solveChallenge() {
    for (let round = 0; round < 5; round++) {
      const bframe = this.page.frames().find((f) => f.url().includes('recaptcha/enterprise/bframe'));
      if (!bframe) return round > 0;

      await this.page.waitForTimeout(1000);

      const challenge = await bframe.evaluate(() => {
        const el = document.querySelector('#rc-imageselect');
        if (!el) return null;
        const desc = el.querySelector('.rc-imageselect-desc, .rc-imageselect-desc-no-canonical');
        const target = desc?.querySelector('strong')?.textContent?.trim() || '';
        const tileCount = el.querySelectorAll('.rc-imageselect-tile').length;
        const imgs = el.querySelectorAll<HTMLImageElement>('.rc-image-tile-33, .rc-image-tile-44');
        const allLoaded = [...imgs].every((img) => img.complete && img.naturalWidth > 0);
        if (!allLoaded) return null;
        return { target, tileCount, spritesheetUrl: imgs[0]?.src };
      });
      if (!challenge || !challenge.target || !challenge.spritesheetUrl) {
        if (round > 0) return true;
        return false;
      }

      const is3x3 = challenge.tileCount === 9;
      const isFirst = round === 0;
      console.log(`\n${isFirst ? 'Challenge' : 'Next round'}: find "${challenge.target}" in ${is3x3 ? '3x3' : '4x4'}`);

      const res = await fetch(challenge.spritesheetUrl);
      if (!res.ok) continue;
      const spriteBuf = Buffer.from(await res.arrayBuffer());
      const b64 = spriteBuf.toString('base64');

      const [nocaptchaTiles, gptTiles] = await Promise.all([
        classifyWithNoCaptcha(b64, challenge.target, is3x3),
        classifyWithGPT4(b64, challenge.target, challenge.tileCount),
      ]);

      console.log(`  NoCaptcha tiles: ${nocaptchaTiles?.join(', ') || 'none'}`);
      console.log(`  GPT-4.1 tiles:   ${gptTiles?.join(', ') || 'none'}`);

      let consensus: number[];
      if (nocaptchaTiles && gptTiles) {
        consensus = intersect(nocaptchaTiles, gptTiles);
        if (consensus.length === 0) {
          consensus = nocaptchaTiles;
          console.log('  → Intersection empty, falling back to NoCaptcha');
        }
      } else if (nocaptchaTiles) {
        consensus = nocaptchaTiles;
      } else if (gptTiles) {
        consensus = gptTiles;
      } else {
        continue;
      }

      consensus = consensus.filter((n) => n >= 0 && n < challenge.tileCount);
      console.log(`  Consensus tiles: ${consensus.join(', ') || 'none (skipping round)'}`);

      if (consensus.length === 0) continue;

      const tiles = bframe.locator('.rc-imageselect-tile');
      for (const idx of consensus) {
        await this.page.waitForTimeout(800 + Math.random() * 1200);
        try { await tiles.nth(idx).hover(); } catch { continue; }
        await this.page.waitForTimeout(200 + Math.random() * 400);
        try { await tiles.nth(idx).click(); } catch { continue; }
      }

      await this.page.waitForTimeout(2000);
      try {
        const verify = bframe.locator('#recaptcha-verify-button');
        if (await verify.isVisible().catch(() => false)) {
          console.log('  → clicking Verify');
          await verify.click();
        }
      } catch {}

      await this.page.waitForTimeout(5000);
    }
    return false;
  }
}
