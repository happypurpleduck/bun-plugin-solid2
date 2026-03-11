import type { Browser } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { HMRTestHarness, waitForHMR } from "../utils/hmr.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURE_PATH = join(__dirname, "..", "fixtures", "nested-components");

async function modifyFile(filePath: string, content: string): Promise<void> {
	await writeFile(filePath, content, "utf-8");
}

async function readOriginalFile(filePath: string): Promise<string> {
	return readFile(filePath, "utf-8");
}

test.describe("Nested Components HMR", () => {
	let harness: HMRTestHarness;
	const originalFiles: Map<string, string> = new Map();

	test.beforeAll(async () => {
		originalFiles.set(
			join(FIXTURE_PATH, "src/components/Header.tsx"),
			await readOriginalFile(join(FIXTURE_PATH, "src/components/Header.tsx")),
		);
		originalFiles.set(
			join(FIXTURE_PATH, "src/components/Counter.tsx"),
			await readOriginalFile(join(FIXTURE_PATH, "src/components/Counter.tsx")),
		);
	});

	test.beforeEach(async ({ browser }: { browser: Browser }) => {
		harness = new HMRTestHarness(FIXTURE_PATH);
		const server = await harness.start();

		const context = await browser.newContext();
		const page = await context.newPage();

		await page.goto(server.url);
		await expect(page.getByTestId("app")).toBeVisible();

		return { page, server };
	});

	test.afterEach(async () => {
		for (const [path, content] of originalFiles) {
			await writeFile(path, content, "utf-8");
		}
		await harness.stop();
	});

	test("should update child component independently", async ({ browser }: { browser: Browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		await harness.start().then(async s => page.goto(s.url));
		await expect(page.getByTestId("header")).toContainText("Nested Components Test");

		await modifyFile(
			join(FIXTURE_PATH, "src/components/Header.tsx"),
			`export function Header() {
	return (
		<header data-testid="header">
			<h1>Updated Header</h1>
		</header>
	);
}`,
		);

		await waitForHMR();

		await expect(page.getByTestId("header")).toContainText("Updated Header");
	});

	test("should update sibling component independently", async ({ browser }: { browser: Browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		await harness.start().then(async s => page.goto(s.url));

		await page.getByTestId("increment").click();
		await page.getByTestId("increment").click();
		await expect(page.getByTestId("count")).toHaveText("Count: 2");

		await modifyFile(
			join(FIXTURE_PATH, "src/components/Header.tsx"),
			`export function Header() {
	return (
		<header data-testid="header">
			<h1>Header Modified</h1>
		</header>
	);
}`,
		);

		await waitForHMR();

		await expect(page.getByTestId("header")).toContainText("Header Modified");
		await expect(page.getByTestId("counter")).toBeVisible();
	});
});
