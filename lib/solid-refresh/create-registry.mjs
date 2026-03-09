/**
 * @import { StateContext } from "./types.ts"
 */

import * as t from "@babel/types";
import { IMPORT_PATCH_REGISTRY, IMPORT_REFRESH, IMPORT_REGISTRY } from "./constants.mjs";
import { get_hot_identifier } from "./get-hot-identifier.mjs";
import { get_import_identifier } from "./get-import-identifier.mjs";
import { get_root_statement_path } from "./get-root-statement-path.mjs";

const REGISTRY = "REGISTRY";
const SOLID_REFRESH = "solid-refresh";
const SOLID_REFRESH_PREV = "solid-refresh-prev";

// toggle between vite-like HMR and https://github.com/solidjs/solid-refresh/pull/82 (probably not as exactly the same)
/** @type {boolean} */
const bun_inline_hmr = false;

// TODO: Bun Inline HMR does not work as expected

/**
 * @param {StateContext} state
 * @param {babel.NodePath} path
 * @param {babel.types.Identifier} registry_id
 * @returns {babel.types.Statement[]}
 */
function create_bun_inline_hmr(state, path, registry_id) {
	const hot_meta = get_hot_identifier();
	const patch_registry_id = get_import_identifier(
		state,
		path,
		IMPORT_PATCH_REGISTRY,
	);
	const hot_data = t.memberExpression(hot_meta, t.identifier("data"));
	const hot_data_refresh = t.memberExpression(
		hot_data,
		t.stringLiteral(SOLID_REFRESH),
		true,
	);
	const hot_data_prev = t.memberExpression(
		hot_data,
		t.stringLiteral(SOLID_REFRESH_PREV),
		true,
	);
	const assign_refresh = t.expressionStatement(
		t.assignmentExpression(
			"=",
			hot_data_refresh,
			t.logicalExpression("||", hot_data_refresh, registry_id),
		),
	);
	const assign_prev = t.expressionStatement(
		t.assignmentExpression("=", hot_data_prev, registry_id),
	);
	const mod_param = t.identifier("mod");
	const accept_callback = t.arrowFunctionExpression(
		[mod_param],
		t.blockStatement([
			t.ifStatement(
				t.logicalExpression(
					"||",
					t.binaryExpression("==", mod_param, t.nullLiteral()),
					t.callExpression(patch_registry_id, [hot_data_refresh, hot_data_prev]),
				),
				t.blockStatement([
					t.expressionStatement(
						t.callExpression(
							t.memberExpression(
								t.memberExpression(
									t.identifier("window"),
									t.identifier("location"),
								),
								t.identifier("reload"),
							),
							[],
						),
					),
				]),
			),
		]),
	);
	const accept_call = t.expressionStatement(
		t.callExpression(t.memberExpression(hot_meta, t.identifier("accept")), [
			accept_callback,
		]),
	);
	return [assign_refresh, assign_prev, accept_call];
}

/**
 * Create (or reuse) a registry identifier for the given path and wire up HMR calls.
 *
 * @param {StateContext} state
 * @param {babel.NodePath} path
 * @returns {babel.types.Identifier}
 */
export function create_registry(state, path) {
	const current = state.imports.get(REGISTRY);
	if (current) {
		return current;
	}
	const root = get_root_statement_path(path);
	const identifier = path.scope.generateUidIdentifier(REGISTRY);

	root.scope.registerDeclaration(
		root.insertBefore(
			t.variableDeclaration("const", [
				t.variableDeclarator(
					identifier,
					t.callExpression(
						get_import_identifier(state, path, IMPORT_REGISTRY),
						[],
					),
				),
			]),
		)[0],
	);
	const path_to_hot = get_hot_identifier();
	const program_path = /** @type {babel.NodePath<t.Program>} */ (path.scope.getProgramParent().path);

	if (bun_inline_hmr) {
		program_path.pushContainer("body", [
			t.expressionStatement(
				t.callExpression(
					t.memberExpression(path_to_hot, t.identifier("accept")),
					[],
				),
			),
			t.expressionStatement(
				t.callExpression(get_import_identifier(state, path, IMPORT_REFRESH), [
					identifier,
				]),
			),
			t.ifStatement(
				path_to_hot,
				t.blockStatement([
					t.expressionStatement(
						t.callExpression(get_import_identifier(state, path, IMPORT_REFRESH), [
							identifier,
						]),
					),
				]),
			),
		]);
	}
	else {
		program_path.pushContainer("body", [
			t.ifStatement(
				path_to_hot,
				t.blockStatement(create_bun_inline_hmr(state, path, identifier)),
			),
		]);
	}

	state.imports.set(REGISTRY, identifier);
	return identifier;
}
