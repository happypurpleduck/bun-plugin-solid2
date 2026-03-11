# HMR Testing Environment

This directory contains Playwright-based end-to-end tests for the HMR (Hot Module Replacement) functionality of the Bun SolidJS plugin.

## Structure

```
test/
├── fixtures/           # Test fixture applications
│   ├── basic-app/      # Simple single-component test app
│   └── nested-components/  # Multi-component test app
├── tests/              # Playwright test files
│   ├── hmr.spec.ts     # Basic HMR tests
│   └── nested-hmr.spec.ts  # Nested component HMR tests
├── utils/              # Test utilities
│   └── hmr.ts          # HMR test harness
├── package.json        # Test dependencies
└── playwright.config.ts # Playwright configuration
```

## Fixtures

### basic-app
A minimal SolidJS application with a single component to test basic HMR functionality.

### nested-components
A SolidJS application with nested components (Header, Counter) to test HMR with component hierarchies.

## Running Tests

### Install dependencies
```bash
bun install
```

This will automatically install test dependencies via the `postinstall` script.

### Run all tests
```bash
bun run test:e2e
```

### Run tests with UI mode
```bash
bun run test:e2e:ui
```

### Run tests in specific browser

Note: Currently only Chromium is configured. Firefox and WebKit can be added by installing the browsers with `bunx playwright install` and updating `playwright.config.ts`.

```bash
cd test && bunx playwright test --project=chromium
```

## Test Utilities

### HMRTestHarness

The `HMRTestHarness` class provides utilities for controlling the dev server and making file changes:

```typescript
const harness = new HMRTestHarness(fixturePath);
const server = await harness.start();

// Modify a component
await harness.modifyComponent("src/App.tsx", newContent);

// Restore original content
await harness.restoreComponent("src/App.tsx");
await harness.restoreAll();

// Stop the server
await harness.stop();
```

## Writing New Tests

1. Create a new test file in `test/tests/`
2. Use the `HMRTestHarness` to control the dev server
3. Use Playwright's page API to interact with the browser
4. Make file changes and verify HMR updates

Example:

```typescript
import { expect, test } from "@playwright/test";
import { HMRTestHarness, waitForHMR } from "../utils/hmr";

test("my hmr test", async ({ browser }) => {
	const harness = new HMRTestHarness(FIXTURE_PATH);
	const server = await harness.start();

	const page = await browser.newPage();
	await page.goto(server.url);

	// Make a change
	await harness.modifyComponent("src/App.tsx", newContent);
	await waitForHMR();

	// Verify update
	await expect(page.getByTestId("title")).toHaveText("Updated!");

	await harness.stop();
});
```

## How HMR Tests Work

1. Each test starts a Bun dev server with the solid plugin and HMR enabled
2. Playwright loads the page in a browser
3. The test modifies a component file
4. Bun detects the change and triggers HMR via `import.meta.hot`
5. The solid-refresh runtime patches the component without reloading the page
6. The test verifies the UI updated correctly

## Known Limitations

- **State Preservation**: While the solid-refresh runtime supports state preservation, the current test setup may reset component state on HMR updates. This is being investigated.
