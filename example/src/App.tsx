import { createSignal } from "solid-js";

export function App() {
	const [count, set_count] = createSignal(0);

	return (
		<div>
			<h1>Hello from SolidJS!</h1>
			<p>
				Count:
				{count()}
			</p>
			<button onClick={() => set_count(c => c + 1)}>Increment</button>
		</div>
	);
}
