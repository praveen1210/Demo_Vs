import { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly cartItemName: Locator;
  readonly cartItemPrice: Locator;
  readonly removeButton: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('.cart_item');
    this.cartItemName = page.locator('.inventory_item_name');
    this.cartItemPrice = page.locator('.inventory_item_price');
    this.removeButton = page.locator('[data-test^="remove"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  async getCartItemCount() {
    return await this.cartItems.count();
  }

  async getItemName(index: number) {
    return await this.cartItemName.nth(index).textContent();
  }

  async getItemPrice(index: number) {
    return await this.cartItemPrice.nth(index).textContent();
  }

  async removeItem(index: number) {
    await this.removeButton.nth(index).click();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}
