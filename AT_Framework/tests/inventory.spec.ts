import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { loginAsStandardUser } from '../utils/helper';
import users from '../data/user_details.json';

test.describe('Inventory Tests', () => {
test.beforeEach(async ({ page }) => {
    await loginAsStandardUser(page);
});

  test('All products are displayed', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const count = await inventoryPage.inventoryItems.count();
    expect(count).toBeGreaterThan(0);
  });

  // test('Product name exists', async ({ page }) => {
  //   const inventoryPage = new InventoryPage(page);
  //   const names = await inventoryPage.getProductNames();
  //   for (const name of names) {
  //     expect(name.trim()).toBeTruthy();
  //   }
  // });

  // test('Product price exists', async ({ page }) => {
  //   const inventoryPage = new InventoryPage(page);
  //   const prices = await inventoryPage.getProductPrices();
  //   for (const price of prices) {
  //     expect(price.trim()).toMatch(/^\$\d+\.\d{2}$/);
  //   }
  // });

  // test('Add to Cart button exists', async ({ page }) => {
  //   const inventoryPage = new InventoryPage(page);
  //   const count = await inventoryPage.addToCartButton.count();
  //   expect(count).toBeGreaterThan(0);
  // });

  test('Verify all products', async ({ page }) => {

    const inventory = new InventoryPage(page);

    expect(await inventory.inventoryItems.count()).toBeGreaterThan(0);

    const names = await inventory.getProductNames();
    const prices = await inventory.getProductPrices();

    expect(names.length).toBe(prices.length);
    expect(await inventory.addToCartButton.count()).toBe(names.length);

});

  test('Sort A to Z', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortProducts('az');
    const names = await inventoryPage.getProductNames();
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  test('Sort Z to A', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortProducts('za');
    const names = await inventoryPage.getProductNames();
    const sorted = [...names].sort().reverse();
    expect(names).toEqual(sorted);
  });

  test('Sort Price Low to High', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortProducts('lohi');
    const prices = await inventoryPage.getProductPrices();
    const numericPrices = prices.map((p) => parseFloat(p.replace('$', '')));
    const sorted = [...numericPrices].sort((a, b) => a - b);
    expect(numericPrices).toEqual(sorted);
  });

  test('Sort Price High to Low', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortProducts('hilo');
    const prices = await inventoryPage.getProductPrices();
    const numericPrices = prices.map((p) => parseFloat(p.replace('$', '')));
    const sorted = [...numericPrices].sort((a, b) => b - a);
    expect(numericPrices).toEqual(sorted);
  });

  test('Product details match inventory page', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const expectedName = (await inventoryPage.getProductNames())[0];
    const expectedPrice = (await inventoryPage.getProductPrices())[0];
    const expectedDescription = await page.locator('.inventory_item_desc').first().textContent();

    await inventoryPage.openProductDetails(0);

    const detailName = await inventoryPage.getProductDetailName();
    const detailPrice = await inventoryPage.getProductDetailPrice();
    const detailDescription = await inventoryPage.getProductDetailDescription();

    expect(detailName).toBe(expectedName);
    expect(detailPrice).toBe(expectedPrice);
    expect(detailDescription).toBe(expectedDescription);
  });
});
