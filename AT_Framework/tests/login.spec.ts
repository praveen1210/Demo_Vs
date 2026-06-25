import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import users from '../data/user_details.json';
import { errorMessages } from '../utils/validation';
import { loginAsStandardUser } from '@utils/helper';


test.describe('Login Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStandardUser(page);
});

  test('Valid Login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard_user.username, users.standard_user.password);
 await expect(page).toHaveURL(/inventory.html/);

  });

  test('Locked User', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.locked_user.username, users.locked_user.password);
    const message = await loginPage.getErrorMessage();
    expect(message).toBe(errorMessages.lockedUser);
  });

  test('Empty Username', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('', users.standard_user.password);
    const message = await loginPage.getErrorMessage();
    expect(message).toBe(errorMessages.emptyUsername);
  });

  test('Empty Password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard_user.username, '');
    const message = await loginPage.getErrorMessage();
    expect(message).toBe(errorMessages.emptyPassword);
  });

  test('Empty Username & Password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('', '');
    const message = await loginPage.getErrorMessage();
    expect(message).toBe(errorMessages.emptyCredentials);
  });

  test('Invalid Password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.invalid_user.username, users.invalid_user.password);
    const message = await loginPage.getErrorMessage();
    expect(message).toBe(errorMessages.invalidCredentials);
  });

  test('Logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard_user.username, users.standard_user.password);
     await expect(page).toHaveURL(/inventory.html/);

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.logout();
 await expect(page).toHaveURL(/saucedemo/);
  });
});
