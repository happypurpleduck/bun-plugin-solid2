import type { Buffer } from "node:buffer";
import type { ChildProcess } from "node:child_process";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

const URL_REGEX = /http:\/\/localhost:(\d+)/;

export interface DevServer {
	url: string;
	stop: () => Promise<void>;
}

export class HMRTestHarness {
	private server?: ChildProcess;
	private originalContent: Map<string, string> = new Map();
	private outputBuffer: string = "";

	constructor(private fixturePath: string) {}

	async start(): Promise<DevServer> {
		return new Promise((resolve, reject) => {
			this.server = spawn("bun", ["run", "--hot", "index.html"], {
				cwd: this.fixturePath,
				env: {
					...process.env,
					NODE_ENV: "development",
				},
				stdio: ["pipe", "pipe", "pipe"],
			});

			let url = "";
			const startTime = Date.now();
			const timeout = 60000;

			const checkTimeout = () => {
				if (Date.now() - startTime > timeout && !url) {
					cleanup();
					this.stop();
					reject(new Error(`Timeout waiting for server to start. Output: ${this.outputBuffer}`));
				}
			};

			const timeoutInterval = setInterval(checkTimeout, 1000);

			const onData = (data: Buffer) => {
				const text = data.toString();
				this.outputBuffer += text;

				const match = text.match(URL_REGEX);
				if (match && !url) {
					url = `http://localhost:${match[1]}`;
					clearInterval(timeoutInterval);
					cleanup();
					setTimeout(() => {
						resolve({
							url,
							stop: async () => this.stop(),
						});
					}, 500);
				}

				if (text.toLowerCase().includes("error") && !url) {
					console.error("Server error:", text);
				}
			};

			function cleanup(server?: ChildProcess) {
				server?.stdout?.off("data", onData);
				server?.stderr?.off("data", onData);
			};

			this.server.stdout?.on("data", onData);
			this.server.stderr?.on("data", onData);

			this.server.on("error", (err: Error) => {
				if (!url) {
					clearInterval(timeoutInterval);
					cleanup();
					reject(err);
				}
			});

			this.server.on("exit", (code) => {
				if (!url) {
					clearInterval(timeoutInterval);
					cleanup();
					reject(new Error(`Server exited with code ${code}. Output: ${this.outputBuffer}`));
				}
			});
		});
	}

	async stop(): Promise<void> {
		if (this.server) {
			this.server.kill();
			this.server = undefined;
			await new Promise(resolve => setTimeout(resolve, 500));
		}
	}

	async modifyComponent(relativePath: string, newContent: string): Promise<void> {
		const fullPath = join(this.fixturePath, relativePath);

		if (!this.originalContent.has(fullPath)) {
			this.originalContent.set(fullPath, await readFile(fullPath, "utf-8"));
		}

		await writeFile(fullPath, newContent, "utf-8");
	}

	async restoreComponent(relativePath: string): Promise<void> {
		const fullPath = join(this.fixturePath, relativePath);
		const original = this.originalContent.get(fullPath);
		if (original) {
			await writeFile(fullPath, original, "utf-8");
		}
	}

	async restoreAll(): Promise<void> {
		for (const [path, content] of this.originalContent) {
			await writeFile(path, content, "utf-8");
		}
		this.originalContent.clear();
	}
}

export function createAppVariant(options: {
	title?: string;
	buttonText?: string;
	showCounter?: boolean;
}): string {
	const title = options.title ?? "Hello from SolidJS!";
	const buttonText = options.buttonText ?? "Increment";
	const showCounter = options.showCounter ?? true;

	return `import { createSignal } from "solid-js";

export function App() {
	const [count, setCount] = createSignal(0);

	return (
		<div data-testid="app">
			<h1 data-testid="title">${title}</h1>
			${showCounter ? `<p data-testid="count-display">Count: {count()}</p>` : ""}
			<button
				data-testid="increment-btn"
				onClick={() => setCount(c => c + 1)}
				type="button"
			>
				${buttonText}
			</button>
		</div>
	);
}`;
}

export async function waitForHMR(timeout = 2000): Promise<void> {
	await new Promise(resolve => setTimeout(resolve, timeout));
}
