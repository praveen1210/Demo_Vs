import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import users from '../data/user_details.json';

test.describe('Cart Tests', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard_user.username, users.standard_user.password);
    await loginPage.verifyLoginSuccess();
  });

  test('Add multiple products and verify badge count', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addProductToCart(0);
    await inventoryPage.addProductToCart(1);

    const badgeCount = await inventoryPage.getCartBadgeCount();
    expect(badgeCount).toBe(2);
  });

  test('Remove product from inventory and verify badge decreases', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addProductToCart(0);
    await inventoryPage.addProductToCart(1);
    let badgeCount = await inventoryPage.getCartBadgeCount();
    expect(badgeCount).toBe(2);

    await inventoryPage.removeProductFromCart(0);
    badgeCount = await inventoryPage.getCartBadgeCount();
    expect(badgeCount).toBe(1);
  });

  test('Verify product name and price in cart', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const expectedName = (await inventoryPage.getProductNames())[0];
    const expectedPrice = (await inventoryPage.getProductPrices())[0];
    await inventoryPage.addProductToCart(0);
    await inventoryPage.openCart();

    const cartPage = new CartPage(page);
    const cartName = await cartPage.getItemName(0);
    const cartPrice = await cartPage.getItemPrice(0);
    expect(cartName).toBe(expectedName);
    expect(cartPrice).toBe(expectedPrice);
  });

  test('Remove product from cart and verify cart becomes empty', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addProductToCart(0);
    await inventoryPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.removeItem(0);
    const itemCount = await cartPage.getCartItemCount();
    expect(itemCount).toBe(0);
  });
});
