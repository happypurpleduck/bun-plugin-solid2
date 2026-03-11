import type { Browser, Page } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { createAppVariant, HMRTestHarness, waitForHMR } from "../utils/hmr.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_PATH = join(__dirname, "..", "fixtures", "basic-app");

test.describe("HMR (Hot Module Replacement)", () => {
	let harness: HMRTestHarness;
	let page: Page;

	test.beforeEach(async ({ browser }: { browser: Browser }) => {
		harness = new HMRTestHarness(FIXTURE_PATH);
		const server = await harness.start();

		const context = await browser.newContext();
		page = await context.newPage();

		await page.goto(server.url);
		await page.waitForSelector("[data-testid=\"app\"]", { timeout: 10000 });
	});

	test.afterEach(async () => {
		await harness.restoreAll();
		await harness.stop();
	});

	test("should render initial app", async () => {
		await expect(page.getByTestId("title")).toHaveText("Hello from SolidJS!");
		await expect(page.getByTestId("count-display")).toHaveText("Count: 0");
		await expect(page.getByTestId("increment-btn")).toHaveText("Increment");
	});

	test("should update component on HMR without page reload", async () => {
		const initialTitle = await page.getByTestId("title").textContent();
		expect(initialTitle).toBe("Hello from SolidJS!");

		await harness.modifyComponent(
			"src/App.tsx",
			createAppVariant({ title: "Updated via HMR!" }),
		);

		await waitForHMR();

		await expect(page.getByTestId("title")).toHaveText("Updated via HMR!");
	});

	test("should update component while maintaining DOM structure", async () => {
		await page.getByTestId("increment-btn").click();
		await page.getByTestId("increment-btn").click();
		await expect(page.getByTestId("count-display")).toHaveText("Count: 2");

		await harness.modifyComponent(
			"src/App.tsx",
			createAppVariant({ title: "State Preserved!" }),
		);

		await waitForHMR();

		await expect(page.getByTestId("title")).toHaveText("State Preserved!");
		await expect(page.getByTestId("count-display")).toBeVisible();
		await expect(page.getByTestId("increment-btn")).toBeVisible();
	});

	test("should update button text on HMR", async () => {
		await harness.modifyComponent(
			"src/App.tsx",
			createAppVariant({ buttonText: "Add +1" }),
		);

		await waitForHMR();

		await expect(page.getByTestId("increment-btn")).toHaveText("Add +1");
	});

	test("should handle multiple HMR updates", async () => {
		await harness.modifyComponent(
			"src/App.tsx",
			createAppVariant({ title: "Update 1" }),
		);
		await expect(page.getByTestId("title")).toHaveText("Update 1", { timeout: 10000 });

		await harness.modifyComponent(
			"src/App.tsx",
			createAppVariant({ title: "Update 2" }),
		);
		await expect(page.getByTestId("title")).toHaveText("Update 2", { timeout: 10000 });

		await harness.modifyComponent(
			"src/App.tsx",
			createAppVariant({ title: "Update 3" }),
		);
		await expect(page.getByTestId("title")).toHaveText("Update 3", { timeout: 10000 });
	});

	test("should handle component structure changes", async () => {
		await page.getByTestId("increment-btn").click();
		await expect(page.getByTestId("count-display")).toHaveText("Count: 1");

		await harness.modifyComponent(
			"src/App.tsx",
			createAppVariant({ showCounter: false }),
		);

		await waitForHMR();

		await expect(page.getByTestId("title")).toBeVisible();
		await expect(page.getByTestId("count-display")).not.toBeVisible();
	});
});
