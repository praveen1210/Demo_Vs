import { Page, Locator } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly inventoryItems: Locator;
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly addToCartButton: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly sortDropdown: Locator;
  readonly menuButton: Locator;
  readonly logoutButton: Locator;
readonly removeButton: Locator;
  constructor(page: Page) {
    this.page = page;
    this.inventoryItems = page.locator('.inventory_item');
    this.productName = page.locator('.inventory_item_name');
    this.productPrice = page.locator('.inventory_item_price');
    this.addToCartButton = page.locator('[data-test^="add-to-cart"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.menuButton = page.locator('#react-burger-menu-btn');
    this.logoutButton = page.locator('[data-test="logout-sidebar-link"]');
  this.removeButton = page.locator('[data-test^="remove"]');
  }

  async addProductToCart(productIndex: number) {
    const button = this.addToCartButton.nth(productIndex);
    await button.click();
  }

async removeProduct(productIndex: number) {
    await this.removeButton.nth(productIndex).click();
}

async getCartBadgeCount() {
    if (await this.cartBadge.isVisible()) {
        return Number(await this.cartBadge.textContent());
    }
    return 0;
}

  async openCart() {
    await this.cartLink.click();
  }

  async sortProducts(option: string) {
    await this.sortDropdown.selectOption(option);
  }

  async getProductNames(): Promise<string[]> {
    return await this.productName.allTextContents();
  }

  async getProductPrices(): Promise<string[]> {
    return await this.productPrice.allTextContents();
  }

  async openProductDetails(index: number) {
    await this.productName.nth(index).click();
  }

  async getProductDetailName() {
    return await this.page.locator('.inventory_details_name').textContent();
  }

  async getProductDetailPrice() {
    return await this.page.locator('.inventory_details_price').textContent();
  }

  async getProductDetailDescription() {
    return await this.page.locator('.inventory_details_desc').textContent();
  }

  async logout() {
    await this.menuButton.click();
    await this.logoutButton.click();
  }
}
