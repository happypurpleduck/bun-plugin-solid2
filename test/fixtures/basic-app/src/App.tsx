import { createSignal } from "solid-js";

export function App() {
	const [count, setCount] = createSignal(0);

	return (
		<div data-testid="app">
			<h1 data-testid="title">Hello from SolidJS!</h1>
			<p data-testid="count-display">
				Count:
				{count()}
			</p>
			<button
				data-testid="increment-btn"
				onClick={() => setCount(c => c + 1)}
				type="button"
			>
				Increment
			</button>
		</div>
	);
}
