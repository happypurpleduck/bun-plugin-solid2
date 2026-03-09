import type * as babel from "@babel/core";
import type { BunPlugin } from "bun";

export interface ExtensionOptions {
	typescript?: boolean;
}

export interface BunSolidPluginOptions {
	include?: string | string[];
	exclude?: string | string[];
	dev?: boolean;
	ssr?: boolean;
	hot?: boolean;
	extensions?: (string | [string, ExtensionOptions])[];
	babel?:
		| babel.TransformOptions
		| ((source: string, id: string, ssr: boolean) => babel.TransformOptions)
		| ((
			source: string,
			id: string,
			ssr: boolean,
		) => Promise<babel.TransformOptions>);
	solid?: {
		omitNestedClosingTags?: boolean;
		omitLastClosingTag?: boolean;
		omitQuotes?: boolean;
		moduleName?: string;
		generate?: "ssr" | "dom" | "universal";
		hydratable?: boolean;
		delegateEvents?: boolean;
		wrapConditionals?: boolean;
		contextToCustomElements?: boolean;
		builtIns?: string[];
	};
}

export function solid_plugin(options?: Partial<BunSolidPluginOptions>): BunPlugin;

export default BunPlugin;
