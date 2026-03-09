/**
 *  @import { ImportDefinition, ImportIdentifierSpecifier } from "./types.ts"
 */

// Source of solid-refresh (for import)
const SOLID_REFRESH_MODULE = "solid-refresh";

/** @type {ImportDefinition } */
export const IMPORT_PATCH_REGISTRY = {
	kind: "named",
	name: "$$patch_registry",
	source: SOLID_REFRESH_MODULE,
};

// Exported names from solid-refresh that will be imported
/** @type {ImportDefinition} */
export const IMPORT_REGISTRY = {
	kind: "named",
	name: "$$registry",
	source: SOLID_REFRESH_MODULE,
};

/** @type {ImportDefinition} */
export const IMPORT_REFRESH = {
	kind: "named",
	name: "$$refresh",
	source: SOLID_REFRESH_MODULE,
};

/** @type {ImportDefinition} */
export const IMPORT_COMPONENT = {
	kind: "named",
	name: "$$component",
	source: SOLID_REFRESH_MODULE,
};

/** @type {ImportDefinition} */
export const IMPORT_CONTEXT = {
	kind: "named",
	name: "$$context",
	source: SOLID_REFRESH_MODULE,
};

/** @type {ImportDefinition} */
export const IMPORT_DECLINE = {
	kind: "named",
	name: "$$decline",
	source: SOLID_REFRESH_MODULE,
};

/** @type {ImportIdentifierSpecifier[]} */
export const IMPORT_SPECIFIERS = [
	{
		type: "render",
		definition: { name: "render", kind: "named", source: "@solidjs/web" },
	},
	{
		type: "render",
		definition: { name: "hydrate", kind: "named", source: "@solidjs/web" },
	},
	{
		type: "createContext",
		definition: {
			name: "createContext",
			kind: "named",
			source: "solid-js",
		},
	},
	{
		type: "createContext",
		definition: {
			name: "createContext",
			kind: "named",
			source: "@solidjs/web",
		},
	},
];
