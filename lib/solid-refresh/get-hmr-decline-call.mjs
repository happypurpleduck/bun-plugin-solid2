/**
 * @import { StateContext } from "./types.ts"
 */

import * as t from "@babel/types";
import { IMPORT_DECLINE } from "./constants.mjs";
import { get_hot_identifier } from "./get-hot-identifier.mjs";
import { get_import_identifier } from "./get-import-identifier.mjs";

/**
 * Create an AST node that performs an HMR decline call for the current bundler.
 *
 * @param {StateContext} state
 * @param {babel.NodePath} path
 * @returns {import('@babel/types').IfStatement}
 */
export function get_hmr_decline_call(state, path) {
	const path_to_hot = get_hot_identifier();

	return t.ifStatement(
		path_to_hot,
		t.blockStatement([
			t.expressionStatement(
				t.callExpression(
					get_import_identifier(state, path, IMPORT_DECLINE),
					[path_to_hot],
				),
			),
		]),
	);
}
