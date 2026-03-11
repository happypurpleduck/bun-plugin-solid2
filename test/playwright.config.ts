import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

const IS_CI = !!process.env.CI;

export default defineConfig({
	testDir: "./tests",
	fullyParallel: false,
	forbidOnly: IS_CI,
	retries: IS_CI ? 2 : 0,
	workers: 1,
	reporter: "list",
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		actionTimeout: 10000,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
