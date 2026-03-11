import { createSignal } from "solid-js";

export function Counter() {
	const [count, setCount] = createSignal(0);

	return (
		<div data-testid="counter">
			<p data-testid="count">
				Count:
				{count()}
			</p>
			<button
				data-testid="increment"
				onClick={() => setCount(c => c + 1)}
				type="button"
			>
				Increment
			</button>
		</div>
	);
}
