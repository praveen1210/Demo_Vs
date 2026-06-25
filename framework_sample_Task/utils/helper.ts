import { Page } from '@playwright/test';

export async function loginAsStandardUser(page: Page) {
  const { LoginPage } = await import('../pages/LoginPage');
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');
  await loginPage.verifyLoginSuccess();
}
