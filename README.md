# WP Agent Suite — Dev Cabin Technologies

> **5 AI-powered WordPress agents** that generate recurring income from your WordPress client base.
> Built with Next.js 16 + GPT-4o. Each agent ships as both a **Next.js web app page** and a **standalone WordPress plugin**.

---

## Table of Contents

1. [Overview](#overview)
2. [The 5 Agents](#the-5-agents)
3. [Project Structure](#project-structure)
4. [Quick Start — Next.js App](#quick-start--nextjs-app)
5. [Quick Start — WordPress Plugins](#quick-start--wordpress-plugins)
6. [WordPress Integration Tests](#wordpress-integration-tests)
7. [Running the Test Suite](#running-the-test-suite)
8. [Building Plugin Zips](#building-plugin-zips)
9. [Monetization Playbook](#monetization-playbook)
10. [Environment Variables](#environment-variables)
11. [Tech Stack](#tech-stack)
12. [Roadmap](#roadmap)

---

## Overview

WP Agent Suite is a two-part product:

| Part | What it is | Who uses it |
|------|-----------|-------------|
| **Next.js App** | A branded SaaS dashboard at your own domain. Streaming GPT-4o output in the browser. | You / your clients via a web login |
| **WordPress Plugins** | Self-contained plugins clients install in their own WP Dashboard. Calls OpenAI directly with their (or your) API key. | Clients / white-label resellers |

Both parts use the **same 5 agents** and the **same GPT-4o prompts**.

---

## The 5 Agents

| # | Agent | WP Plugin Slug | Income Model |
|---|-------|---------------|--------------|
| 1 | 🛡️ **Plugin Vulnerability Scanner** | `dc-vulnerability-scanner` | $49–99 audit reports · $97/mo security plan |
| 2 | 🔌 **Plugin Recommender** | `dc-plugin-recommender` | $299–799 setup projects · $49/mo plugin mgmt |
| 3 | ⚡ **Speed Optimizer** | `dc-speed-optimizer` | $499 one-time optimization · $97/mo monitoring |
| 4 | 📊 **Maintenance Report** | `dc-maintenance-report` | $97–297/mo care plan reports · white-label PDF |
| 5 | 🎨 **Child Theme Builder** | `dc-child-theme-builder` | $199–499 theme work · $97/mo design retainer |

### Agent Details

#### 🛡️ Plugin Vulnerability Scanner
- **Input:** WordPress site URL
- **Output:** CVE-style security audit — risk rating, detected plugins, vulnerability findings (severity icons 🔴🟠🟡🟢), recommended actions, monitoring upsell
- **Ideal client pitch:** "I ran a free scan on your site. Here are 4 vulnerabilities I found. Want me to fix them for $299?"

#### 🔌 Plugin Recommender
- **Input:** Business type + goals (e.g. "WooCommerce store selling handmade jewelry")
- **Output:** Curated plugin stack with rationale, free vs. premium options, implementation timeline, quote range
- **Ideal client pitch:** Include recommended plugin list + your setup quote in every discovery call

#### ⚡ Speed Optimizer
- **Input:** WordPress site URL
- **Output:** Core Web Vitals audit (LCP, FID, CLS), plugin bloat analysis, image/caching/hosting recommendations, prioritized fix list, $499 proposal
- **Ideal client pitch:** Show the report during onboarding. Close a speed optimization project before the care plan starts.

#### 📊 Maintenance Report
- **Input:** Monthly stats (updates run, uptime %, backups, security scans, support tickets)
- **Output:** White-label client-ready monthly report with performance summary, work completed, next-month plan, care plan renewal prompt
- **Ideal client pitch:** Send this report on the 1st of every month. Clients who see the work stay on care plans longer.

#### 🎨 Child Theme Builder
- **Input:** Design requirements (colors, fonts, layout, custom functionality)
- **Output:** Ready-to-use `functions.php`, `style.css`, custom CSS snippets, PHP snippets, file structure, implementation notes
- **Ideal client pitch:** Use the output as a starting scaffold. Bill for customization time instead of starting from scratch.

---

## Project Structure

```
wp-agent-suite/
├── app/
│   ├── page.tsx                        # Dashboard — 5 agent cards
│   ├── layout.tsx
│   ├── globals.css
│   ├── agents/
│   │   ├── vulnerability-scanner/page.tsx
│   │   ├── plugin-recommender/page.tsx
│   │   ├── speed-optimizer/page.tsx
│   │   ├── maintenance-report/page.tsx
│   │   └── child-theme-builder/page.tsx
│   └── api/
│       ├── vulnerability-scanner/route.ts   # Streaming GPT-4o route
│       ├── plugin-recommender/route.ts
│       ├── speed-optimizer/route.ts
│       ├── maintenance-report/route.ts
│       └── child-theme-builder/route.ts
├── components/
│   └── AgentLayout.tsx                 # Shared agent UI wrapper
├── lib/
│   └── utils.ts
├── __tests__/
│   ├── setup/
│   │   ├── env.ts                      # TextEncoder / ReadableStream polyfills
│   │   ├── mockOpenAI.ts               # Global OpenAI mock (setupFilesAfterEnv)
│   │   └── jest-dom.d.ts
│   ├── api/                            # 5 API route test files (30 tests)
│   └── ui/                             # 5 UI component test files (38 tests)
├── scripts/
│   └── build-plugins.js               # Zips all 5 WP plugins
├── wordpress-plugins/
│   ├── dc-integration-tests.php        # Drop-in WP integration test runner
│   ├── dc-vulnerability-scanner/
│   │   ├── dc-vulnerability-scanner.php
│   │   ├── assets/admin.css
│   │   ├── assets/admin.js
│   │   ├── readme.txt
│   │   └── uninstall.php
│   ├── dc-plugin-recommender/          # (same structure)
│   ├── dc-speed-optimizer/             # (same structure)
│   ├── dc-maintenance-report/          # (same structure)
│   ├── dc-child-theme-builder/         # (same structure)
│   └── zips/
│       ├── dc-vulnerability-scanner.zip   (7.4 KB)
│       ├── dc-plugin-recommender.zip      (5.2 KB)
│       ├── dc-speed-optimizer.zip         (5.1 KB)
│       ├── dc-maintenance-report.zip      (5.6 KB)
│       └── dc-child-theme-builder.zip     (5.6 KB)
├── jest.config.ts
├── package.json
├── tsconfig.json
└── .env.local
```

---

## Quick Start — Next.js App

### Prerequisites

- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/api-keys) with GPT-4o access

### 1. Install dependencies

```bash
cd wp-agent-suite
npm install
```

### 2. Set your OpenAI API key

Edit `.env.local`:

```env
OPENAI_API_KEY=sk-your-key-here
```

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the dashboard with all 5 agent cards.

### 4. Use an agent

1. Click **Launch Agent →** on any card
2. Fill in the form (URL, business type, etc.)
3. Click **Generate** — output streams in real time via GPT-4o
4. Use **Copy to Clipboard** to paste into a client email, Notion doc, or PDF

### 5. Deploy to production

Deploy to [Vercel](https://vercel.com) (recommended — zero config for Next.js):

```bash
npx vercel --prod
```

Set the `OPENAI_API_KEY` environment variable in the Vercel dashboard under **Settings → Environment Variables**.

---

## Quick Start — WordPress Plugins

Each plugin is a self-contained `.zip` file ready to install in any WordPress site.

### Install a plugin

1. Log into your WordPress admin dashboard
2. Go to **Plugins → Add New → Upload Plugin**
3. Choose the `.zip` file from `wordpress-plugins/zips/`
4. Click **Install Now**, then **Activate**
5. Find the new menu item in the WP admin sidebar
6. Go to the **Settings** tab and enter your OpenAI API key
7. Switch to the **Agent** tab and start using it

### Plugin admin UI

Each plugin features:
- **Dark gradient header** with the plugin name and version
- **Two tabs:** Agent (the tool) · Settings (API key)
- **Results box** with copy-to-clipboard button
- **Monetization tips** panel with pricing ideas
- Input validation with inline error messages
- Loading spinner during API calls

### Plugin requirements

| Requirement | Version |
|-------------|---------|
| WordPress | 6.0+ |
| PHP | 8.0+ |
| OpenAI API key | GPT-4o access |

### Security

- All AJAX calls use `check_ajax_referer()` with per-page nonces
- All actions require `current_user_can('manage_options')` (admin-only)
- API keys stored via `get_option()` / `update_option()` (WP options table)
- All inputs sanitized with `sanitize_text_field()` / `sanitize_url()`
- `uninstall.php` removes all plugin options on deletion (no orphaned data)

---

## WordPress Integration Tests

`wordpress-plugins/dc-integration-tests.php` is a drop-in PHP test runner for live WordPress installs.

### What it tests

1. All 5 plugins are active
2. All AJAX action hooks are registered
3. Options API read/write for each plugin's API key setting
4. Input validation fires correctly on missing required fields
5. OpenAI endpoint reachability (HTTPS only — no real API call)
6. PHP version ≥ 8.0

### How to run

**Option A — Browser (easiest):**

```bash
# Copy the file to your WP root (same folder as wp-load.php)
cp wordpress-plugins/dc-integration-tests.php /path/to/wordpress/

# Visit in browser while logged in as admin:
# https://yoursite.com/dc-integration-tests.php
```

**Option B — WP-CLI:**

```bash
wp eval-file dc-integration-tests.php
```

> ⚠️ Run on **staging only**. Delete the file when done — it's a test runner, not a permanent install.

---

## Running the Test Suite

All 68 Jest tests run in under 2 seconds.

```bash
# Run all tests
npm test

# Run only API route tests (30 tests)
npm run test:api

# Run only UI component tests (38 tests)
npm run test:ui

# Watch mode
npm run test:watch
```

### Test architecture

| Project | Environment | Files | Tests |
|---------|-------------|-------|-------|
| `api` | Node (no DOM) | `__tests__/api/*.test.ts` | 30 |
| `ui` | jsdom + React Testing Library | `__tests__/ui/*.test.tsx` | 38 |

#### API tests (per agent, 6 tests each)
- Returns `400` when required input is missing
- Returns `400` when URL/input is invalid
- Returns a streaming `ReadableStream` on valid input
- OpenAI is called with the correct model (`gpt-4o`)
- OpenAI is called with the correct system prompt keywords
- Response content type is correct

#### UI tests (per agent, ~8 tests each)
- Page renders without errors
- Form inputs render correctly
- Generate button is disabled when inputs are empty
- Generate button is enabled when inputs are filled
- Clicking Generate calls the correct API endpoint
- Loading state is shown during fetch
- Streamed output is displayed in the results area
- Copy button appears after output is received

### Test setup files

| File | Purpose |
|------|---------|
| `__tests__/setup/env.ts` | Polyfills `TextEncoder`, `TextDecoder`, `ReadableStream` for jsdom |
| `__tests__/setup/mockOpenAI.ts` | Global `jest.mock('openai')` — prevents real API calls in all tests |
| `__tests__/setup/jest-dom.d.ts` | TypeScript types for `@testing-library/jest-dom` matchers |

---

## Building Plugin Zips

```bash
npm run build:plugins
```

This runs `scripts/build-plugins.js`, which:

1. Validates each plugin directory has the required files (`{plugin}.php`, `assets/admin.css`, `assets/admin.js`)
2. Removes any existing `.zip` for that plugin
3. Creates a new `.zip` from within `wordpress-plugins/` (so the archive root is the plugin folder name)
4. Reports file size for each zip
5. Exits with code `1` if any plugin fails validation

Output: `wordpress-plugins/zips/*.zip`

---

## Monetization Playbook

### Pricing tiers

| Offer | Price | Agent Used |
|-------|-------|-----------|
| One-time security audit report | $49–$99 | Vulnerability Scanner |
| Monthly security monitoring care plan | $97/mo | Vulnerability Scanner |
| Plugin setup & configuration project | $299–$799 | Plugin Recommender |
| Monthly plugin management add-on | $49/mo | Plugin Recommender |
| One-time speed optimization | $499 | Speed Optimizer |
| Monthly Core Web Vitals monitoring | $97/mo | Speed Optimizer |
| Monthly WordPress care plan | $97–$297/mo | Maintenance Report |
| Child theme / design project | $199–$499 | Child Theme Builder |
| Monthly design retainer | $97/mo | Child Theme Builder |

### Sales workflow

```
Lead → Free Scan (Vulnerability or Speed) → Report reveals problems → Propose fix → Upsell care plan
```

1. **Lead magnet:** Offer a free vulnerability or speed audit to any WordPress site owner
2. **Run the agent:** Takes 10–30 seconds. Output is professional, specific, and scary enough to act on
3. **Send the report:** Copy output into a branded PDF or Notion page
4. **Quote the fix:** The report ends with a natural upsell into your service
5. **Recurring revenue:** Close the care plan — use Maintenance Report agent every month to justify the fee

### White-label option

The WordPress plugins can be rebranded:
1. Change `Author` and `Plugin URI` in the plugin header
2. Update the header title in `admin.css` (`.dc-header h1`)
3. Rebuild the zip: `npm run build:plugins`
4. Sell to agencies who want to offer AI-powered reports under their own brand

---

## Environment Variables

### Next.js App (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | Your OpenAI API key. Get one at [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |

> The API key is only ever used server-side in the `app/api/*/route.ts` files. It is never exposed to the browser.

### WordPress Plugins

Each plugin stores its own API key in the WordPress options table:

| Plugin | Option Name |
|--------|------------|
| DC Vulnerability Scanner | `dc_vuln_openai_key` |
| DC Plugin Recommender | `dc_recommender_openai_key` |
| DC Speed Optimizer | `dc_speed_openai_key` |
| DC Maintenance Report | `dc_maintenance_openai_key` |
| DC Child Theme Builder | `dc_theme_openai_key` |

Keys are entered per-plugin in the **Settings** tab of each plugin's admin page.

---

## Tech Stack

### Next.js App

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| AI | OpenAI SDK + GPT-4o (streaming) |
| UI Components | Radix UI (Tabs, Dialog), Lucide React icons |
| Testing | Jest 30, ts-jest, React Testing Library, jest-environment-jsdom |

### WordPress Plugins

| Layer | Technology |
|-------|-----------|
| Language | PHP 8.0+ |
| WP APIs | `wp_remote_post`, `admin_menu`, `wp_enqueue_*`, `register_setting`, AJAX |
| AI | OpenAI Chat Completions API (GPT-4o, non-streaming) |
| Styling | Vanilla CSS (dark gradient, modern admin UI) |
| JS | Vanilla JS (fetch, DOM manipulation, clipboard API) |
| Security | Nonces, capability checks, input sanitization, `uninstall.php` |

---

## Roadmap

### Near-term

- [ ] **PDF export** — Generate branded PDF reports from the Next.js app (react-pdf or Puppeteer)
- [ ] **WP-CLI commands** — Run agents from the terminal: `wp dc-vuln scan https://example.com`
- [ ] **Plugin update checker** — Auto-notify users of new versions without the WordPress.org repo

### Medium-term

- [ ] **Per-report history/logging** — Store past reports in WP custom post type or database table
- [ ] **Client portal** — Next.js app with auth, per-client report history, and download links
- [ ] **Webhook delivery** — Send completed reports to Slack, email, or Zapier
- [ ] **Bulk scanning** — Run vulnerability or speed scans across an entire client portfolio

### Long-term

- [ ] **Real vulnerability data** — Integrate WPScan API or Patchstack API for actual CVE lookups
- [ ] **Real Core Web Vitals** — Pull live PageSpeed Insights data via Google API
- [ ] **Stripe billing** — Charge per report or subscription directly in the Next.js app
- [ ] **White-label SaaS** — Multi-tenant version for agencies to resell under their brand

---

## License

GPL v2 or later — same license as WordPress core.

---

*Built by [Dev Cabin Technologies](https://products.devcabin.tech)*
