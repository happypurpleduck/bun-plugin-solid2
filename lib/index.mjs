/**
 * @import { BunPlugin } from "bun";
 * @import { BunSolidPluginOptions } from "./index.ts"
 */

import process from "node:process";
import * as babel from "@babel/core";
// @ts-expect-error
import solid from "babel-preset-solid";
import { file, fileURLToPath } from "bun";
import { mergeAndConcat } from "merge-anything";
import picomatch from "picomatch";
import { solid_refresh_plugin } from "./solid-refresh/lib.mjs";

const RUNTIME_ID = "solid-refresh";
const RUNTIME_ID_REGEX = new RegExp(`^${RUNTIME_ID}$`);
const RUNTIME_NAMESPACE = "solid-refresh-runtime";

const EXTENSION_REGEX = /\?.+$/;
const COMPILE_FILE_FILTER_REGEX = /\.[mc]?[tj]sx$/i;
const COMPILE_FILE_TYPESCRIPT_REGEX = /\.[mc]?tsx$/i;
const ID_CLEAN_REGEX = /\?.*$/;
const NODE_MODULES_REGEX = /node_modules/;

/**
 * @param {string} filename
 * @returns {string} extension
 */
function get_extension(filename) {
	const index = filename.lastIndexOf(".");
	return index < 0 ? "" : filename.substring(index).replace(EXTENSION_REGEX, "");
}

/** @type {string | null} */
let runtime_code = null;

/**
 * @returns {Promise<string>} runtime code
 */
async function get_runtime_code() {
	if (runtime_code !== null) {
		return runtime_code;
	}

	return (runtime_code = await file(fileURLToPath(import.meta.resolve("./solid-refresh/runtime.mjs"))).text());
}

/**
 * @param {Partial<BunSolidPluginOptions>} [options]
 * @returns {BunPlugin} bun plugin
 */
export function solid_plugin(options = {}) {
	const filter = options.include !== undefined || options.exclude !== undefined
		? picomatch(
				Array.isArray(options.include)
					? options.include
					: options.include !== undefined
						? [options.include]
						: ["**/*"],
				{
					ignore: Array.isArray(options.exclude)
						? options.exclude
						: options.exclude !== undefined
							? [options.exclude]
							: undefined,
				},
			)
		: () => true;

	return {
		name: "solid",

		async setup(build) {
			const project_root = build.config?.root ?? process.cwd();

			build.onResolve(
				{ filter: RUNTIME_ID_REGEX },
				() => {
					return {
						path: RUNTIME_ID,
						namespace: RUNTIME_NAMESPACE,
					};
				},
			);

			build.onLoad(
				{ filter: RUNTIME_ID_REGEX, namespace: RUNTIME_NAMESPACE },
				async () => {
					return {
						contents: await get_runtime_code(),
						loader: "js",
					};
				},
			);

			build.onLoad(
				{ filter: COMPILE_FILE_FILTER_REGEX },
				async (args) => {
					if (!filter(args.path)) {
						return;
					}

					const id = args.path.replace(ID_CLEAN_REGEX, "");
					const current_file_extension = get_extension(id);

					const extensions_to_watch = options.extensions || [];
					const all_extensions = extensions_to_watch.map(extension =>
						typeof extension === "string" ? extension : extension[0],
					);

					if (!(COMPILE_FILE_FILTER_REGEX.test(id) || all_extensions.includes(current_file_extension))) {
						return;
					}

					const is_in_node_modules = NODE_MODULES_REGEX.test(id);

					/** @type {{ generate: "ssr" | "dom"; hydratable: boolean }} */
					const solid_options = options.ssr
						? { generate: "ssr", hydratable: true }
						: { generate: "dom", hydratable: false };

					const should_be_processed_with_typescript
						= COMPILE_FILE_TYPESCRIPT_REGEX.test(id)
							|| extensions_to_watch.some((extension) => {
								if (typeof extension === "string") {
									return extension.includes("tsx");
								}

								const [extension_name, extension_options] = extension;
								if (extension_name !== current_file_extension) {
									return false;
								}

								return extension_options.typescript;
							});

					/** @type {NonNullable<babel.TransformOptions['parserOpts']>['plugins']} */
					const plugins = ["jsx"];

					if (should_be_processed_with_typescript) {
						plugins.push("typescript");
					}

					/** @type {babel.TransformOptions} */
					const opts = {
						root: project_root,
						filename: id,
						sourceFileName: id,
						presets: [[
							solid,
							{ ...solid_options, ...(options.solid || {}) },
						]],
						plugins: options.hot === true && !options.ssr && !is_in_node_modules
							? [[solid_refresh_plugin]]
							: [],
						ast: false,
						sourceMaps: true,
						configFile: false,
						babelrc: false,
						parserOpts: {
							plugins,
						},
					};

					/** @type {babel.TransformOptions} */
					let babel_user_options = {};

					if (options.babel) {
						if (typeof options.babel === "function") {
							const babel_options = options.babel("", id, false);
							babel_user_options = babel_options instanceof Promise ? await babel_options : babel_options;
						}
						else {
							babel_user_options = options.babel;
						}
					}

					const babel_options = mergeAndConcat(babel_user_options, opts); /** @as babel.TransformOptions */

					const source_code = await file(args.path).text();
					const result = await babel.transformAsync(source_code, babel_options);
					if (!result) {
						throw new Error(`babel.transformAsync returned undefined for ${id}`);
					}
					if (result.code == null) {
						throw new Error(`babel.transformAsync returned code as undefined for ${id}`);
					}

					return {
						loader: "js",
						contents: result.code,
						sourcemap: result.map?.mappings,
					};
				},
			);
		},
	};
}

export default solid_plugin({
	dev: process.env.NODE_ENV !== "production",
	hot: process.env.NODE_ENV !== "production",
	ssr: false,
});
