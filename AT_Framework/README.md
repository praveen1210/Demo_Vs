# Playwright Automation Framework

## Overview

This project is a Playwright + TypeScript automation framework developed for testing the SauceDemo application and ReqRes REST APIs.

The framework follows the Page Object Model (POM) design pattern and is organized with reusable utilities, environment-based configuration, API testing support, retry mechanism, parallel execution, and HTML reporting.

---

# Tech Stack

* Playwright
* TypeScript
* Node.js
* Dotenv

---

# Framework Structure

```
playwright-assessment
│
├── config
│   └── env.ts
│
├── data
│   └── user_details.json
│
├── pages
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   └── CheckoutPage.ts
│
├── tests
│   ├── api.spec.ts
│   ├── login.spec.ts
│   ├── inventory.spec.ts
│   ├── cart.spec.ts
│   └── checkout.spec.ts
│
├── utils
│   ├── helper.ts
│   └── validation.ts
│
├── .env.qa
├── .env.uat
├── playwright.config.ts
├── package.json
└── README.md
```

---

# Features

* Page Object Model (POM)
* API Testing using Playwright Request Context
* Environment-based configuration
* Parallel execution support
* Retry mechanism for flaky tests
* HTML and JSON reports
* Reusable utilities
* Cross-browser support (configurable)

---

# Environment Configuration

QA Environment

```
BASE_URL=https://www.saucedemo.com
API_BASE_URL=https://reqres.in
API_KEY=<your_api_key>
ENV=qa
```

UAT Environment

```
BASE_URL=https://www.saucedemo.com
API_BASE_URL=https://reqres.in
ENV=uat
```

Run a specific environment:

```
ENV=qa npm test
```

or

```
ENV=uat npm test
```

---

# Installation

Clone the repository

```
git clone <repository-url>
```

Navigate to the project

```
cd playwright-assessment
```

Install dependencies

```
npm install
```

Install Playwright browsers

```
npx playwright install
```

---

# Execute Tests

Run all tests

```
npm test
```

Run UI tests

```
npm run test:ui
```

Run API tests

```
npm run test:api
```

Run tests in headed mode

```
npm run test:headed
```

---

# Reports

Generate HTML report

```
npm run report
```

Custom report

```
npm run generate-report
```

Reports are generated under

```
playwright-report/
```

---

# Test Coverage

## Login

* Valid Login
* Locked User
* Empty Username
* Empty Password
* Invalid Password
* Logout

## Product & Inventory

* Verify products
* Product details
* Product sorting
* Product information validation

## Cart

* Add multiple products
* Remove product
* Cart badge validation
* Product validation inside cart

## Checkout

* End-to-End checkout
* Order confirmation
* Subtotal, tax and total validation
* Empty First Name validation

## API Testing

* GET User
* POST User
* PUT User
* DELETE User
* Login (Positive)
* Login (Negative)

---

# Framework Highlights

* Clean Page Object Model implementation
* Reusable page methods
* Environment-based configuration using `.env`
* Retry support for flaky tests
* Parallel execution support
* HTML and JSON reporting
* Easy to maintain and extend

---

# Author

Praveenkumar Raj
