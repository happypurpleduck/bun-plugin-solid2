import { Counter } from "./components/Counter";
import { Header } from "./components/Header";

export function App() {
	return (
		<div data-testid="app">
			<Header />
			<main>
				<Counter />
			</main>
		</div>
	);
}
