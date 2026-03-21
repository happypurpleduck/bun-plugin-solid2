/* eslint-disable ts/no-unsafe-return */
/* eslint-disable ts/no-unsafe-call */
/* eslint-disable ts/no-unsafe-argument */
/* eslint-disable ts/no-unsafe-assignment */
/* eslint-disable ts/no-unsafe-member-access */

import { $DEVCOMP, createMemo, createSignal, DEV, untrack } from "solid-js";

// src/runtime/create-proxy.ts

/**
 * @template P
 * @typedef {(props: P) => import("solid-js").JSX.Element} BaseComponent
 */

/**
 * @template P
 * @param {BaseComponent<P>} component
 * @param {string} key
 * @param {string} value
 */
function set_component_property(component, key, value) {
	const descriptor = Object.getOwnPropertyDescriptor(component, key);
	if (descriptor) {
		Object.defineProperty(component, key, {
			...descriptor,
			value,
		});
	}
	else {
		Object.defineProperty(component, key, {
			value,
			writable: false,
			enumerable: false,
			configurable: true,
		});
	}
}

/**
 * @template {BaseComponent<P>} C
 * @template P
 * @param {import("solid-js").Accessor<C>} source
 * @param {string} name
 * @param {string} [location]
 * @returns {(props: P) => import("solid-js").JSX.Element}
 */
function create_proxy(source, name, location) {
	const refresh_name = `[solid-refresh]${name}`;

	/** @param {P} props */
	function HMRComp(props) {
		const s = untrack(source);
		if (s == null || $DEVCOMP in s) {
			return createMemo(
				() => {
					const c = source();
						if (c != null) {
							return (
								// @ts-ignore - untrack accepts label in dev mode

								untrack
							)(
								() => c(props),
								// @ts-ignore - $DEVCOMP is symbol

								c[$DEVCOMP] && `<${name}>`,
							);
						}
					return undefined;
				},
				undefined,
				{
					name: refresh_name,
					transparent: true,
				},
			);
		}
		// no $DEVCOMP means it did not go through devComponent so source() is a regular function, not a component
		return s(props);
	}

	set_component_property(HMRComp, "name", refresh_name);
	if (location !== undefined) {
		set_component_property(HMRComp, "location", location);
	}

	return new Proxy(HMRComp, {
		get(_target, property) {
			if (property === "location" || property === "name") {
				// @ts-expect-error

				return (HMRComp)[property];
			}
			return untrack(source)[/** @type {keyof C} */ (property)];
		},
		set(_target, property, value) {
			// @ts-expect-error

			untrack(source)[property] = value;
			return true;
		},
	});
}

// src/runtime/is-list-updated.ts

/**
 * @param {Record<string, any>} a
 * @param {Record<string, any>} b
 * @returns {boolean}
 */
function is_list_updated_internal(a, b) {
	const a_keys = Object.keys(a);
	const b_keys = Object.keys(b);
	// Check if both objects has the same amount of keys
	if (a_keys.length !== b_keys.length) {
		return true;
	}
	// Merge keys
	const keys = new Set([...a_keys, ...b_keys]);
	// Now check if merged keys has the same amount of keys as the other two
	// for example: { a, b } and { a, c } produces { a, b, c }
	if (keys.size !== a_keys.length) {
		return true;
	}
	// Now compare each items
	for (const key of keys) {
		// This covers NaN. No need for Object.is since it's extreme for -0
		// eslint-disable-next-line no-self-compare
		if (a[key] !== b[key] || (a[key] !== a[key] && b[key] !== b[key])) {
			return true;
		}
	}
	return false;
}

/**
 * @param {Record<string, any> | undefined} a
 * @param {Record<string, any> | undefined} b
 * @returns {boolean}
 */
function is_list_updated(a, b) {
	if (a && b) {
		return is_list_updated_internal(a, b);
	}
	if (a == null && b != null) {
		return true;
	}
	if (a != null && b == null) {
		return true;
	}
	return false;
}

// src/runtime/index.ts

/**
 * @typedef {object} ComponentOptions
 * @property {string} [location]
 * @property {string} [signature] - In granular mode. This signature is a hash generated from the component's JS string
 * @property {() => Record<string, any>} [dependencies] - An array of foreign bindings (values that aren't locally declared in the component)
 */

/**
 * The registration data for the components
 * @template P
 * @typedef {object} ComponentRegistrationData
 * @property {string} id - A compile-time ID generated for the component, usually derived from the component's name
 * @property {(props: P) => import("solid-js").JSX.Element} component - The component itself
 * @property {(props: P) => import("solid-js").JSX.Element} proxy
 * @property {(action: () => (props: P) => import("solid-js").JSX.Element) => void} update - Replaces the previous component with the new one
 * @property {string} [location]
 * @property {string} [signature]
 * @property {() => Record<string, any>} [dependencies]
 */

/**
 * @typedef {object} Registry
 * @property {Map<string, ComponentRegistrationData<any>>} components
 */

/** @returns {Registry} */
export function $$registry() {
	return {
		components: new Map(),
	};
}

/**
 * @template P
 * @param {Registry} registry
 * @param {string} id
 * @param {(props: P) => import("solid-js").JSX.Element} component
 * @param {ComponentOptions} [options]
 * @returns {(props: P) => import("solid-js").JSX.Element}
 */
export function $$component(registry, id, component, options = {}) {
	let current = component;
	const [comp, set_comp] = createSignal(() => current);
	/** @param {() => (props: P) => import("solid-js").JSX.Element} fn */
	const update = (fn) => {
		current = fn();
		set_comp(() => current);
	};
	const proxy = /** @type {ReturnType<typeof create_proxy<(props: P) => import("solid-js").JSX.Element, P>>} */ (
		create_proxy(comp, id, options.location)
	);
	registry.components.set(id, {
		id,
		component,
		proxy,
		update,
		...options,
	});
	return proxy;
}

/**
 * @template P
 * @param {ComponentRegistrationData<P>} old_data
 * @param {ComponentRegistrationData<P>} new_data
 */
function patch_component(old_data, new_data) {
	// Preserve context identity: contexts (createContext) are components in Solid 2.0
	// but useContext relies on a stable Symbol .id for lookups
	const old_comp = /** @type {any} */ (old_data.component);
	const new_comp = /** @type {any} */ (new_data.component);

	if (old_comp.id != null && typeof old_comp.id === "symbol") {
		new_comp.id = old_comp.id;
	}

	// Check if incoming module has signature
	if (new_data.signature !== undefined) {
		// Compare signatures
		const old_deps = old_data.dependencies?.();
		const new_deps = new_data.dependencies?.();
		if (
			new_data.signature !== old_data.signature
			|| is_list_updated(new_deps, old_deps)
		) {
			// Replace signatures and dependencies
			old_data.dependencies = new_deps ? () => new_deps : undefined;
			old_data.signature = new_data.signature;
			// Remount
			old_data.update(() => new_data.component);
		}
	}
	else {
		// No granular update, remount
		old_data.update(() => new_data.component);
	}

	// Always rely on the first proxy
	// This is to allow modules newly importing
	// the updated version to still be able
	// to render the latest version despite
	// not receiving the first proxy
	new_data.update(() => old_data.proxy);
}

/**
 * @param {Registry} old_data
 * @param {Registry} new_data
 * @returns {boolean}
 */
function patch_components(old_data, new_data) {
	const components = new Set([
		...old_data.components.keys(),
		...new_data.components.keys(),
	]);
	for (const key of components) {
		const old_component = old_data.components.get(key);
		const new_component = new_data.components.get(key);

		if (old_component) {
			if (new_component) {
				patch_component(old_component, new_component);
			}
			else {
				// Component was deleted - remove from registry gracefully
				old_data.components.delete(key);
				// Continue without triggering full page reload
			}
		}
		else if (new_component) {
			old_data.components.set(key, new_component);
		}
	}
	return false;
}

/**
 * @param {Registry} old_registry
 * @param {Registry} new_registry
 * @returns {boolean}
 */
export function $$patch_registry(old_registry, new_registry) {
	return patch_components(old_registry, new_registry);
}

const SOLID_REFRESH = "solid-refresh";
const SOLID_REFRESH_PREV = "solid-refresh-prev";

/**
 * @param {boolean} [inline]
 */
export function $$decline(inline) {
	// Vite is no-op on decline, just call invalidate
	if (inline) {
		// @ts-expect-error ...

		import.meta.hot.invalidate();
	}
	else {
		import.meta.hot.accept(() => {
			// @ts-expect-error ...

			import.meta.hot.invalidate();
		});
	}
}

let warned = false;

/** @returns {boolean} */
function should_warn_and_decline() {
	const result = DEV && Object.keys(DEV).length;

	if (result !== undefined) {
		return false;
	}

	if (!warned) {
		console.warn(
			"To use solid-refresh, you need to use the dev build of SolidJS. Make sure your build system supports package.json conditional exports and has the 'development' condition turned on.",
		);
		warned = true;
	}
	return true;
}

/**
 * @param {Registry} registry
 */
export function $$refresh(registry) {
	if (should_warn_and_decline()) {
		$$decline();
	}
	else if (import.meta.hot.data != null) {
		import.meta.hot.data[SOLID_REFRESH] = import.meta.hot.data[SOLID_REFRESH] ?? registry;
		import.meta.hot.data[SOLID_REFRESH_PREV] = registry;

		import.meta.hot.accept((mod) => {
			if (
				mod == null
				|| $$patch_registry(import.meta.hot.data[SOLID_REFRESH], import.meta.hot.data[SOLID_REFRESH_PREV])
			) {
				// @ts-expect-error ...
				import.meta.hot.invalidate();
			}
		});
	}
	else {
		// I guess just decline if hot.data doesn't exist
		$$decline();
	}
}
