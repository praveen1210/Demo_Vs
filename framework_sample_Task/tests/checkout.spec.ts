import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import users from '../data/user_details.json';
import { generateCheckoutData, errorMessages } from '../utils/validation';

test.describe('Checkout Tests', () => {
  test('End-to-end checkout flow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard_user.username, users.standard_user.password);
    await loginPage.verifyLoginSuccess();

    const inventoryPage = new InventoryPage(page);
    const product1Price = (await inventoryPage.getProductPrices())[0];
    const product2Price = (await inventoryPage.getProductPrices())[1];
    await inventoryPage.addProductToCart(0);
    await inventoryPage.addProductToCart(1);
    await inventoryPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.proceedToCheckout();

    const checkoutPage = new CheckoutPage(page);
    const checkoutData = generateCheckoutData();
    await checkoutPage.fillCheckoutInfo(checkoutData.firstName, checkoutData.lastName, checkoutData.zipCode);
    await checkoutPage.continue();

    const price1 = parseFloat(product1Price.replace('$', ''));
    const price2 = parseFloat(product2Price.replace('$', ''));
    const expectedSubtotal = price1 + price2;

    const subtotal = await checkoutPage.getSubtotal();
    const tax = await checkoutPage.getTax();
    const total = await checkoutPage.getTotal();

    expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
    expect(total).toBeCloseTo(subtotal + tax, 2);

    await checkoutPage.finish();

    const confirmation = await checkoutPage.getConfirmationMessage();
    expect(confirmation).toBe(errorMessages.checkoutComplete);

    const badgeCount = await inventoryPage.getCartBadgeCount();
    expect(badgeCount).toBe(0);
  });

  test('Checkout without first name shows validation error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard_user.username, users.standard_user.password);
    await loginPage.verifyLoginSuccess();

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addProductToCart(0);
    await inventoryPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.proceedToCheckout();

    const checkoutPage = new CheckoutPage(page);
    const checkoutData = generateCheckoutData();
    await checkoutPage.fillCheckoutInfo('', checkoutData.lastName, checkoutData.zipCode);
    await checkoutPage.continue();

    const error = await checkoutPage.getErrorMessage();
    expect(error).toBe(errorMessages.checkoutFirstNameRequired);
  });
});
