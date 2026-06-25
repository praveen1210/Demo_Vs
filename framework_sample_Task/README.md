# Playwright TypeScript Testing Framework

A production-ready Playwright automation framework built with TypeScript using the Page Object Model pattern. Designed for the SauceDemo web application and Reqres API.

## Installation

```bash
npm install
npx playwright install
```

## Execution Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests in headless mode |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run test:api` | Run API tests only |
| `npm run test:headed` | Run tests with browser visible |
| `npm run report` | Open HTML report |

## Folder Structure

```
project
├── config
│   ├── env.ts              # Environment config loader
│   ├── .env.qa             # QA environment variables
│   ├── .env.uat            # UAT environment variables
├── pages
│   ├── LoginPage.ts        # Login page object
│   ├── InventoryPage.ts    # Inventory page object
│   ├── CartPage.ts         # Cart page object
│   ├── CheckoutPage.ts     # Checkout page object
├── tests
│   ├── login.spec.ts       # Login test scenarios
│   ├── inventory.spec.ts   # Inventory test scenarios
│   ├── cart.spec.ts        # Cart test scenarios
│   ├── checkout.spec.ts    # Checkout test scenarios
│   ├── api.spec.ts         # API test scenarios
├── utils
│   ├── testData.ts         # Dynamic test data (Faker)
│   ├── helper.ts           # Shared helper functions
├── data
│   └── users.json          # Static user credentials
├── playwright.config.ts    # Playwright configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Reporting

The framework generates an HTML report with:
- Screenshots captured on failure
- Video recording retained on failure
- Trace files available on first retry

View the report with: `npm run report`

## Environment Configuration

Set the active environment via the `ENV` variable:

```bash
ENV=qa npm test
ENV=uat npm test
```

Default environment is `qa`. Environment files are located in `config/`.

## Assumptions

- SauceDemo UI is stable and selectors use `data-test` attributes
- Reqres API is available at `https://reqres.in`
- Tests run against the standard_user account unless testing locked/invalid scenarios
- Faker generates unique data per test execution for checkout and API tests
- All waits are dynamic (Playwright auto-waiting) — no `waitForTimeout` used
