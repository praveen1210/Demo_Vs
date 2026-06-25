# Playwright & Automation Testing - Interview Questions & Coding Challenges

## Table of Contents
1. [Interview Questions](#interview-questions)
2. [Coding Questions](#coding-questions)

---

## Interview Questions

### Playwright Fundamentals

1. **What is Playwright and what are its key advantages over Selenium?**
   - Explain the architecture and benefits (speed, multi-browser support, debugging capabilities)

2. **What are the different browsers supported by Playwright?**
   - Chromium, Firefox, and WebKit

3. **Explain the difference between Page, Context, and Browser in Playwright.**
   - Browser: Instance of the browser application
   - Context: An isolated session within a browser
   - Page: A tab or window within a context

4. **What is the BrowserContext in Playwright and why is it useful?**
   - Isolated browser sessions that don't share cookies, cache, or local storage
   - Useful for simulating multiple users or testing in isolation

5. **How does Playwright handle waits? What are the different wait strategies?**
   - Auto-waiting for elements
   - Explicit waits (waitForNavigation, waitForFunction, waitForLoadState)
   - Implicit waits using timeout configuration

6. **What is the difference between locators and selectors in Playwright?**
   - Selectors are strings used to identify elements
   - Locators are objects with built-in waiting and retry logic

7. **Explain the concept of "auto-waiting" in Playwright.**
   - Playwright automatically waits for elements to be actionable before performing actions
   - This reduces flaky tests caused by timing issues

8. **What are fixtures in Playwright Test?**
   - Reusable test setup and teardown code
   - Can be used to initialize pages, browsers, and custom data

9. **How do you handle network requests in Playwright?**
   - Using `page.route()` for mocking/intercepting
   - Using `page.waitForResponse()` to wait for responses
   - Using `page.on('response')` to listen to responses

10. **What is test parallelization and how does Playwright Test handle it?**
    - Running multiple tests simultaneously to improve speed
    - Playwright Test parallelizes tests by default using workers

### Automation Testing Best Practices

11. **What are the principles of good test automation?**
    - Maintainability, reliability, speed, clarity, independence
    - DRY (Don't Repeat Yourself) principle

12. **How do you structure a scalable test automation framework?**
    - Page Object Model (POM)
    - Base classes
    - Test utilities and helpers
    - Configuration management

13. **Explain the Page Object Model (POM) pattern.**
    - Create separate classes for each page
    - Encapsulate page elements and interactions
    - Reduces code duplication and improves maintainability

14. **What is the difference between end-to-end (E2E) testing and unit testing?**
    - E2E: Tests complete user workflows across the entire application
    - Unit: Tests individual functions or components in isolation

15. **How do you handle test data management?**
    - External data files (JSON, CSV)
    - Test fixtures
    - Database seeding
    - Environment-specific configurations

16. **What strategies do you use to make tests more reliable and reduce flakiness?**
    - Use explicit waits instead of sleep
    - Avoid hardcoded wait times
    - Use proper locators (stable, specific selectors)
    - Run tests in isolation
    - Retry failed tests

17. **How do you implement continuous integration with Playwright tests?**
    - CI/CD pipelines (GitHub Actions, Jenkins, GitLab CI)
    - Headless mode execution
    - Parallel execution
    - Report generation

18. **What is cross-browser testing and why is it important?**
    - Testing on multiple browsers (Chrome, Firefox, Safari)
    - Ensures consistent behavior across platforms
    - Playwright supports this natively

19. **How do you handle dynamic elements and AJAX calls in tests?**
    - Wait for network idle
    - Wait for specific responses
    - Wait for DOM changes
    - Use proper wait strategies

20. **Explain the difference between hard assertions and soft assertions.**
    - Hard: Stops test execution on failure
    - Soft: Continues test execution and reports all failures at the end

---

## Coding Questions

### Basic Level

1. **Write a Playwright test to verify page title.**
   ```javascript
   test('Verify page title', async ({ page }) => {
     await page.goto('https://example.com');
     await expect(page).toHaveTitle('Example Domain');
   });
   ```

2. **Write a test to fill a form and submit it.**
   ```javascript
   test('Fill and submit form', async ({ page }) => {
     await page.goto('https://example.com/form');
     await page.fill('input[name="email"]', 'test@example.com');
     await page.fill('input[name="password"]', 'password123');
     await page.click('button[type="submit"]');
   });
   ```

3. **Write a test to verify an element is visible on the page.**
   ```javascript
   test('Verify element visibility', async ({ page }) => {
     await page.goto('https://example.com');
     const element = page.locator('.header');
     await expect(element).toBeVisible();
   });
   ```

4. **Write a test to take a screenshot of the page.**
   ```javascript
   test('Take screenshot', async ({ page }) => {
     await page.goto('https://example.com');
     await page.screenshot({ path: 'screenshot.png' });
   });
   ```

5. **Write a test to handle dropdown selection.**
   ```javascript
   test('Select dropdown option', async ({ page }) => {
     await page.goto('https://example.com');
     await page.selectOption('select#country', 'USA');
     await expect(page.locator('select#country')).toHaveValue('USA');
   });
   ```

### Intermediate Level

6. **Write a test that intercepts and verifies API requests.**
   ```javascript
   test('Intercept API request', async ({ page }) => {
     const requestPromise = page.waitForResponse(
       response => response.url().includes('/api/data') && response.status() === 200
     );
     await page.goto('https://example.com');
     const response = await requestPromise;
     const data = await response.json();
     expect(data.length).toBeGreaterThan(0);
   });
   ```

7. **Write a test using fixtures for page object setup.**
   ```javascript
   const test = base.extend({
     loginPage: async ({ page }, use) => {
       const loginPage = new LoginPage(page);
       await loginPage.navigate();
       await use(loginPage);
     },
   });
   
   test('Login with valid credentials', async ({ loginPage }) => {
     await loginPage.login('user@example.com', 'password');
     await expect(loginPage.page).toHaveURL('/dashboard');
   });
   ```

8. **Write a Page Object Model class for a login page.**
   ```javascript
   class LoginPage {
     constructor(page) {
       this.page = page;
       this.emailInput = page.locator('input[id="email"]');
       this.passwordInput = page.locator('input[id="password"]');
       this.loginButton = page.locator('button:has-text("Login")');
     }
     
     async navigate() {
       await this.page.goto('/login');
     }
     
     async login(email, password) {
       await this.emailInput.fill(email);
       await this.passwordInput.fill(password);
       await this.loginButton.click();
     }
   }
   ```

9. **Write a test with soft assertions to check multiple conditions.**
   ```javascript
   test('Verify multiple elements with soft assertions', async ({ page }) => {
     await page.goto('https://example.com');
     
     await expect.soft(page.locator('.header')).toBeVisible();
     await expect.soft(page.locator('.footer')).toBeVisible();
     await expect.soft(page.locator('.navigation')).toBeVisible();
     
     // Test continues even if assertions fail
   });
   ```

10. **Write a test to handle multiple windows/tabs.**
    ```javascript
    test('Handle multiple windows', async ({ context, page }) => {
      await page.goto('https://example.com');
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        page.click('a[target="_blank"]')
      ]);
      
      await popup.waitForLoadState();
      expect(popup.url()).toContain('newsite.com');
      await popup.close();
    });
    ```

### Advanced Level

11. **Write a parameterized test with multiple test cases.**
    ```javascript
    const testData = [
      { username: 'user1', password: 'pass1', expected: true },
      { username: 'user2', password: 'pass2', expected: true },
      { username: 'invalid', password: 'wrong', expected: false }
    ];
    
    testData.forEach(({ username, password, expected }) => {
      test(`Login with ${username}`, async ({ page }) => {
        // Test implementation
      });
    });
    ```

12. **Write a test with network mocking and response manipulation.**
    ```javascript
    test('Mock API response', async ({ page }) => {
      await page.route('**/api/users', route => {
        route.abort('failed');
      });
      
      await page.goto('https://example.com');
      // Verify error handling
    });
    
    test('Override API response', async ({ page }) => {
      await page.route('**/api/data', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 1, name: 'Mocked Data' })
        });
      });
    });
    ```

13. **Write a test to upload a file.**
    ```javascript
    test('Upload file', async ({ page }) => {
      await page.goto('https://example.com/upload');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('path/to/file.txt');
      
      await page.click('button[type="submit"]');
      await expect(page.locator('.success-message')).toBeVisible();
    });
    ```

14. **Write a test for visual regression testing.**
    ```javascript
    test('Visual regression test', async ({ page }) => {
      await page.goto('https://example.com');
      
      // Full page screenshot
      await expect(page).toHaveScreenshot('homepage.png');
      
      // Specific element screenshot
      await expect(page.locator('.header')).toHaveScreenshot('header.png');
    });
    ```

15. **Write a test with custom retry logic and error handling.**
    ```javascript
    test.describe.configure({ retries: 2 });
    
    test('Test with custom retry', async ({ page }) => {
      try {
        await page.goto('https://example.com');
        await page.waitForLoadState('networkidle');
      } catch (error) {
        console.error('Navigation failed:', error);
        throw error;
      }
    });
    ```

16. **Write a test for keyboard interactions.**
    ```javascript
    test('Keyboard interactions', async ({ page }) => {
      await page.goto('https://example.com');
      await page.click('input[type="text"]');
      await page.keyboard.type('Hello World');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
    });
    ```

17. **Write a test for hover and mouse interactions.**
    ```javascript
    test('Hover interactions', async ({ page }) => {
      await page.goto('https://example.com');
      await page.hover('.menu-item');
      await expect(page.locator('.submenu')).toBeVisible();
    });
    ```

18. **Write a test to validate form validation messages.**
    ```javascript
    test('Form validation', async ({ page }) => {
      await page.goto('https://example.com/form');
      await page.click('button[type="submit"]');
      
      const errorMessages = await page.locator('.error-message').allTextContents();
      expect(errorMessages.length).toBeGreaterThan(0);
    });
    ```

19. **Write a test with custom wait conditions.**
    ```javascript
    test('Custom wait condition', async ({ page }) => {
      await page.goto('https://example.com');
      
      // Wait for element count to change
      await page.waitForFunction(() => {
        return document.querySelectorAll('.item').length === 10;
      });
      
      const itemCount = await page.locator('.item').count();
      expect(itemCount).toBe(10);
    });
    ```

20. **Write a comprehensive test suite with setup and teardown.**
    ```javascript
    test.describe('User Management Suite', () => {
      let userId;
      
      test.beforeEach(async ({ page }) => {
        await page.goto('https://example.com/login');
        // Perform login
      });
      
      test('Create user', async ({ page }) => {
        await page.goto('https://example.com/users/create');
        // Create user logic
        // Store userId
      });
      
      test('Edit user', async ({ page }) => {
        await page.goto(`https://example.com/users/${userId}/edit`);
        // Edit logic
      });
      
      test.afterEach(async ({ page }) => {
        // Cleanup - delete created user
      });
    });
    ```

---

## Configuration Example

**playwright.config.js**
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Tips for Success

- **Use locators with stable selectors** (data-testid, aria-labels)
- **Avoid hardcoded delays** - use Playwright's built-in wait mechanisms
- **Implement Page Object Model** for better maintainability
- **Run tests in headless mode** in CI/CD pipelines
- **Use fixtures** to set up common test prerequisites
- **Implement proper error handling** and logging
- **Run tests in parallel** to save execution time
- **Use soft assertions** when checking multiple conditions
- **Take screenshots on failure** for debugging
- **Mock external APIs** for reliable and fast tests

