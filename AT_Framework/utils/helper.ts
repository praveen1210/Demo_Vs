import { Page, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

export async function loginAsStandardUser(page: Page) {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  await expect(page).toHaveURL(/inventory.html/);
}