# Playwright Assessment - Payment & reCAPTCHA Automation Framework

End-to-end test automation framework built with **Playwright** and **TypeScript** for payment processing with **reCAPTCHA v2 Enterprise** solving via a multi-strategy AI consensus (NoCaptcha API + Azure GPT-4.1 Vision).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Test Data](#test-data)
- [Key Features](#key-features)
  - [reCAPTCHA Solving Pipeline](#recaptcha-solving-pipeline)
  - [GPay Popup Handling](#gpay-popup-handling)
- [Usage](#usage)
  - [Run Tests](#run-tests)
  - [Reports](#reports)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Dependency | Version |
|-----------|---------|
| Node.js | >= 18 |
| npm | >= 9 |
| Chrome (Google Chrome) | Latest (for GPay tests) |
| Java 8+ | (for Allure CLI) |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
# Edit .env.qa with your API keys (see Configuration section)

# 3. Run tests
npm test

# 4. View HTML report
npm run report
```

---

## Project Structure

```
├── .env.qa                      # Environment variables (QA)
├── config/
│   └── env.ts                   # Env loader (dotenv)
├── data/
│   └── test_data.json           # All test data (URLs, card info, credentials)
├── pages/
│   └── RecaptchaPage.ts         # Page Object Model for payment + reCAPTCHA
├── utils/
│   └── recaptcha.ts             # reCAPTCHA solvers (NoCaptcha + GPT-4.1)
├── tests/
│   ├── payment.spec.ts          # Payment flow test (GPay)
│   └── recaptcha.spec.ts        # reCAPTCHA solving test
├── playwright.config.ts         # Playwright configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Scripts & dependencies
├── allure-results/              # Allure raw results (generated)
├── playwright-report/           # HTML report (generated)
└── test-results/                # Test artifacts (videos, traces, screenshots)
```

---

## Configuration

### Environment Variables

Edit `.env.qa`:

```env
# reCAPTCHA solving strategy
RECAPTCHA_STRATEGY=2captcha

# NoCaptcha AI API key (https://nocaptchaai.com)
NOCAPTCHA_KEY=your_nocaptcha_key_here

# Azure OpenAI GPT-4.1 endpoint (Vision-based solver)
AZURE_OPENAI_GPT4_URL=https://your-resource.openai.azure.com/...
AZURE_OPENAI_GPT4_KEY=your_azure_api_key_here

# 2Captcha (alternative provider)
2CAPTCHA_KEY=your_2captcha_key_here
```

> **Note**: At least one AI solver key (`NOCAPTCHA_KEY` or `AZURE_OPENAI_GPT4_KEY`) must be configured.

### Test Data

Edit `data/test_data.json`:

```json
{
  "PAYMENT_PAGE_URL": "https://payment.denovosystem.tech/api/v2/merchantPay?t=...",
  "CARD_AMOUNT": "10.00",
  "CARD_NUMBER": "4242424242424242",
  "CARD_EXPIRY": "26/27",
  "CARD_CVV": "999",
  "CARD_HOLDER": "Test User",
  "CARD_EMAIL": "user@gmail.com",
  "CARD_PHONE": "8122812418",
  "CARD_CUSTOMER_NAME": "Test User",
  "CARD_ZIP_CODE": "12345",
  "CARD_GMAIL_PASSWORD": "your_gmail_password",
  "CHROME_USER_DATA_DIR": "C:\\Users\\YourUser\\AppData\\Local\\Google\\Chrome\\User Data",
  "BROWSER_CHANNEL": "chrome"
}
```

| Field | Description |
|-------|-------------|
| `PAYMENT_PAGE_URL` | Merchant payment page URL (encoded JWT in query) |
| `CARD_*` | Test credit card details |
| `CARD_GMAIL_PASSWORD` | Gmail password for GPay popup login |
| `CHROME_USER_DATA_DIR` | Local Chrome profile path (for persistent context) |
| `BROWSER_CHANNEL` | Browser channel (`chrome`, `msedge`, etc.) |

---

## Key Features

### reCAPTCHA Solving Pipeline

The solver uses a **dual-strategy consensus** approach:

1. **NoCaptcha AI** (`classifyWithNoCaptcha`) - Proprietary API for reCAPTCHA v2 classification
2. **GPT-4.1 Vision** (`classifyWithGPT4`) - Azure OpenAI vision analysis of challenge images
3. **Consensus** (`intersect`) - Common tiles from both providers are clicked; falls back to NoCaptcha if disagreement

Flow: `Click checkbox → Wait for challenge → For each round (max 5) → Fetch spritesheet → Classify (dual API) → Intersect → Click tiles → Verify`

### GPay Popup Handling

The framework detects and interacts with Google Pay popups:
- Listens for `popup` / `page` events after clicking the GPay button
- Fills Google email & password on the accounts.google.com popup
- Supports keyboard-based navigation when DOM selectors fail
- Detects Google's "This browser may not be secure" block

> **Note:** GPay popup interception is only reliable in **headless mode**. In headed mode, the popup cannot be consistently controlled due to browser security restrictions. See [Known Limitations](#known-limitations).

---

## Usage

### Run Tests

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (headless) |
| `npm run test:headed` | Run tests with browser visible (note: GPay tests may not work in headed mode) |
| `npx playwright test --grep "reCAPTCHA"` | Run specific test by name |
| `npx playwright test --project chromium` | Run on specific browser |
| `npx playwright test --debug` | Run with Playwright Inspector |

### Reports

```bash
# Open HTML report
npm run report

# Generate & open Allure report
npm run allure
```

Reports are generated automatically after each run:
- **HTML**: `playwright-report/index.html`
- **JSON**: `playwright-report/report.json`
- **Allure**: `allure-results/` (run `allure generate` to view)
- **Artifacts**: Screenshots, videos, and traces in `test-results/`

---

## Known Limitations

1. **GPay Popup – Headless Only** – The Google Pay popup interaction is only reliable in **headless mode**. In headed mode, the popup cannot be consistently intercepted or controlled due to browser security restrictions and Google's anti-automation measures. As an alternative, the GPay payment flow can be handled via **backend API calls** if direct payment gateway access is available.

2. **reCAPTCHA v2 Enterprise – External Dependency Required** – Automating reCAPTCHA v2 challenges is **not possible natively** without third-party services. This framework uses a consensus-based approach combining:
   - **NoCaptcha AI** (nocaptchaai.com) – Proprietary image classification API
   - **Azure OpenAI GPT-4.1 Vision** – Vision-based tile analysis
   - **2Captcha** (alternative, configurable via `.env.qa`)
   
   At least one external solver service must be configured for reCAPTCHA tests to function.

3. **Google Login Blocking** – Google may block automated login attempts with the message *"This browser or app may not be secure"*. Mitigation strategies include:
   - Using a persistent Chrome profile (`CHROME_USER_DATA_DIR`) with an already-authenticated session
   - Running in headless mode for GPay popup interception

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **GPay popup not intercepted in headed mode** | Run in headless mode (`npx playwright test`); or handle payment via backend APIs |
| **Google blocks automated login** | Use a persistent Chrome profile (`CHROME_USER_DATA_DIR` in `data/test_data.json`) |
| **NoCaptcha API error** | Verify `NOCAPTCHA_KEY` in `.env.qa` and check account balance |
| **GPT-4.1 API error** | Verify `AZURE_OPENAI_GPT4_URL` and `AZURE_OPENAI_GPT4_KEY` |
| **Chrome profile not found** | Update `CHROME_USER_DATA_DIR` in `data/test_data.json` to your local Chrome user data path |
| **reCAPTCHA always fails** | Ensure at least one external solver (NoCaptcha / GPT-4.1 / 2Captcha) is configured |
| **Test timeout** | Increase `test.setTimeout()` in the spec file (default: 600s for reCAPTCHA) |
