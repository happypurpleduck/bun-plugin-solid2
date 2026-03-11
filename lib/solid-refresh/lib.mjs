/**
 * @import { StateContext, Options, SolidRefreshPluginState } from "./types.ts"
 */

import path from "node:path";
import process from "node:process";
import * as t from "@babel/types";
import { is_componentish_name } from "./checks.mjs";
import { IMPORT_COMPONENT, IMPORT_SPECIFIERS } from "./constants.mjs";
import { create_registry } from "./create-registry.mjs";
import { generate_code } from "./generator.mjs";
import { get_foreign_bindings } from "./get-foreign-bindings.mjs";
import { get_hmr_decline_call } from "./get-hmr-decline-call.mjs";
import { get_hot_identifier } from "./get-hot-identifier.mjs";
import { get_import_identifier } from "./get-import-identifier.mjs";
import { get_statement_path } from "./get-statement-path.mjs";
import { is_statement_top_level } from "./is-statement-top-level.mjs";
import { is_valid_callee } from "./is-valid-callee.mjs";
import { register_import_specifiers } from "./register-import-specifiers.mjs";
import { transform_jsx } from "./transform-jsx.mjs";
import { unwrap_node } from "./unwrap.mjs";
import { xxhash32 } from "./xxhash32.mjs";

const CWD = process.cwd();

/**
 * @param {string} filename
 * @returns {string}
 */
function get_file(filename) {
	return path.relative(CWD, filename);
}

/**
 * @param {babel.types.Node} node
 * @returns {string}
 */
function create_signature_value(node) {
	const code = generate_code(node);
	const result = xxhash32(code).toString(16);
	return result;
}

/**
 * @param {StateContext} state
 * @param {babel.NodePath} path
 */
function capture_identifiers(state, path) {
	path.traverse({
		ImportDeclaration(p) {
			if (
				!(
					p.node.importKind === "type"
					|| p.node.importKind === "typeof"
				)
			) {
				register_import_specifiers(state, p, state.specifiers);
			}
		},
	});
}

/**
 * @param {babel.NodePath} path
 * @returns {boolean}
 */
function check_valid_render_call(path) {
	/** @type {babel.NodePath | null | undefined} */
	let current_path = path.parentPath;

	while (current_path) {
		if (t.isProgram(current_path.node)) {
			return true;
		}
		if (!t.isStatement(current_path.node)) {
			return false;
		}
		current_path = current_path.parentPath;
	}

	return false;
}

/**
 * @param {StateContext} state
 * @param {babel.NodePath<babel.types.Program>} path
 */
function fix_render_calls(state, path) {
	path.traverse({
		ExpressionStatement(p) {
			const true_call_expr = unwrap_node(p.node.expression, t.isCallExpression);
			if (
				true_call_expr
				&& check_valid_render_call(p)
				&& is_valid_callee(state, p, true_call_expr, "render")
			) {
				// Replace with variable declaration
				const id = p.scope.generateUidIdentifier("cleanup");
				p.replaceWith(
					t.variableDeclaration("const", [
						t.variableDeclarator(id, p.node.expression),
					]),
				);
				const path_to_hot = get_hot_identifier();
				p.insertAfter(
					t.ifStatement(
						path_to_hot,
						t.expressionStatement(
							t.callExpression(
								t.memberExpression(
									path_to_hot,
									t.identifier("dispose"),
								),
								[id],
							),
						),
					),
				);
				p.skip();
			}
		},
	});
}

/**
 * @param {StateContext} state
 * @param {babel.NodePath} path
 * @param {babel.types.Identifier} identifier
 * @param {babel.types.FunctionExpression | babel.types.ArrowFunctionExpression} component
 * @param {babel.types.Node} [original]
 * @returns {babel.types.Expression}
 */
function wrap_component(
	state,
	path,
	identifier,
	component,
	original = component,
) {
	const statement_path = get_statement_path(path);
	if (statement_path) {
		const registry = create_registry(state, statement_path);
		const hot_name = t.stringLiteral(identifier.name);
		const component_call = get_import_identifier(
			state,
			statement_path,
			IMPORT_COMPONENT,
		);
		/** @type {babel.types.ObjectProperty[]} */
		const properties = [];
		if (state.filename != null && original.loc) {
			const file_path = get_file(state.filename);
			properties.push(
				t.objectProperty(
					t.identifier("location"),
					t.stringLiteral(
						`${file_path}:${original.loc.start.line}:${original.loc.start.column}`,
					),
				),
			);
		}
		if (state.granular) {
			properties.push(
				t.objectProperty(
					t.identifier("signature"),
					t.stringLiteral(create_signature_value(component)),
				),
			);
			const dependencies = get_foreign_bindings(path);
			if (dependencies.length) {
				/** @type {babel.types.ObjectProperty[]} */
				const dependency_keys = [];
				/** @type {babel.types.Identifier} */
				let id;
				for (let i = 0, len = dependencies.length; i < len; i++) {
					id = dependencies[i];
					dependency_keys.push(t.objectProperty(id, id, false, true));
				}
				properties.push(
					t.objectProperty(
						t.identifier("dependencies"),
						t.arrowFunctionExpression(
							[],
							t.objectExpression(dependency_keys),
						),
					),
				);
			}
		}
		return t.callExpression(component_call, [
			registry,
			hot_name,
			component,
			t.objectExpression(properties),
		]);
	}
	return component;
}

/**
 * @param {StateContext} state
 * @param {babel.NodePath} path
 * @param {babel.types.Identifier} identifier
 * @param {babel.types.CallExpression} context
 * @returns {babel.types.CallExpression}
 */
function wrap_context(state, path, identifier, context) {
	const statement_path = get_statement_path(path);
	if (statement_path) {
		const registry = create_registry(state, statement_path);
		const hot_name = t.stringLiteral(identifier.name);
		const component_call = get_import_identifier(
			state,
			statement_path,
			IMPORT_COMPONENT,
		);

		return t.callExpression(component_call, [registry, hot_name, context]);
	}
	return context;
}

const SKIP_PATTERN = /^\s*@refresh skip\s*$/;
const RELOAD_PATTERN = /^\s*@refresh reload\s*$/;

/**
 * @param {StateContext} state
 * @param {babel.NodePath<babel.types.Program>} path
 * @param {babel.types.Comment[] | undefined | null} comments
 * @returns {boolean}
 */
function setup_program(state, path, comments) {
	let should_skip = false;
	let is_done = false;
	if (comments) {
		for (const { value: comment } of comments) {
			if (SKIP_PATTERN.test(comment)) {
				is_done = true;
				should_skip = true;
				break;
			}
			if (RELOAD_PATTERN.test(comment)) {
				is_done = true;
				path.pushContainer("body", get_hmr_decline_call(state, path));
				break;
			}
		}
	}

	if (!should_skip && state.fixRender) {
		capture_identifiers(state, path);
		fix_render_calls(state, path);
	}
	return is_done;
}

/**
 * @param {babel.Node} node
 * @returns {node is babel.types.ArrowFunctionExpression | babel.types.FunctionExpression}
 */
function is_valid_function(node) {
	return t.isArrowFunctionExpression(node) || t.isFunctionExpression(node);
}

/**
 * @param {StateContext} state
 * @param {babel.NodePath<babel.types.VariableDeclarator>} path
 */
function transform_variable_declarator(state, path) {
	if (
		path.parentPath.isVariableDeclaration()
		&& !is_statement_top_level(path.parentPath)
	) {
		return;
	}
	const identifier = path.node.id;
	const init = path.node.init;
	if (!(init && t.isIdentifier(identifier))) {
		return;
	}
	if (is_componentish_name(identifier.name)) {
		const true_func_expr = unwrap_node(init, is_valid_function);
		// Check for valid FunctionExpression or ArrowFunctionExpression
		if (
			true_func_expr
			// Must not be async or generator
			&& !(true_func_expr.async || true_func_expr.generator)
			// Might be component-like, but the only valid components
			// have zero or one parameter
			&& true_func_expr.params.length < 2
		) {
			path.node.init = wrap_component(
				state,
				path,
				identifier,
				true_func_expr,
			);
		}
	}
	// For `createContext` calls
	const true_call_expr = unwrap_node(init, t.isCallExpression);
	if (
		true_call_expr
		&& is_valid_callee(state, path, true_call_expr, "createContext")
	) {
		path.node.init = wrap_context(state, path, identifier, true_call_expr);
	}
	path.skip();
}

/**
 * @param {StateContext} state
 * @param {babel.NodePath<babel.types.FunctionDeclaration>} path
 */
function transform_function_declaration(state, path) {
	if (is_statement_top_level(path)) {
		const decl = path.node;
		// Check if declaration is FunctionDeclaration
		if (
			// Check if the declaration has an identifier, and then check
			decl.id
			// if the name is component-ish
			&& is_componentish_name(decl.id.name)
			&& !(decl.generator || decl.async)
			// Might be component-like, but the only valid components
			// have zero or one parameter
			&& decl.params.length < 2
		) {
			path.scope.registerDeclaration(
				path.replaceWith(
					t.variableDeclaration("const", [
						t.variableDeclarator(
							decl.id,
							wrap_component(
								state,
								path,
								decl.id,
								t.functionExpression(
									decl.id,
									decl.params,
									decl.body,
								),
								decl,
							),
						),
					]),
				)[0],
			);
			path.skip();
		}
	}
}

/**
 * @param {babel.NodePath<babel.types.Program>} program
 * @param {babel.NodePath<babel.types.FunctionDeclaration>} path
 */
function bubble_function_declaration(program, path) {
	if (is_statement_top_level(path)) {
		const decl = path.node;
		// Check if declaration is FunctionDeclaration
		if (
			// Check if the declaration has an identifier, and then check
			decl.id
			// if the name is component-ish
			&& is_componentish_name(decl.id.name)
			&& !(decl.generator || decl.async)
			// Might be component-like, but the only valid components
			&& decl.params.length < 2
		) {
			if (path.parentPath.isExportNamedDeclaration()) {
				path.parentPath.replaceWith(
					t.exportNamedDeclaration(undefined, [
						t.exportSpecifier(decl.id, decl.id),
					]),
				);
			}
			else if (path.parentPath.isExportDefaultDeclaration()) {
				path.replaceWith(decl.id);
			}
			else {
				path.remove();
			}
			const [tmp] = program.unshiftContainer("body", [decl]);
			program.scope.registerDeclaration(tmp);
			tmp.skip();
		}
	}
}

/**
 * Babel plugin entry for solid-refresh.
 *
 * @returns {babel.PluginObj<SolidRefreshPluginState>}
 */
export function solid_refresh_plugin() {
	return {
		name: "solid-refresh",
		visitor: {
			Program(program_path, context) {
				/** @type {StateContext} */
				const state = {
					jsx: context.opts.jsx ?? true,
					granular: context.opts.granular ?? true,
					opts: /** @type {Options} */ (context.opts),
					specifiers: [...IMPORT_SPECIFIERS],
					imports: new Map(),
					registrations: {
						identifiers: new Map(),
						namespaces: new Map(),
					},
					filename: context.filename,
					// bundler: context.opts.bundler || "standard",
					fixRender: context.opts.fixRender ?? true,
				};
				if (
					setup_program(state, program_path, context.file.ast.comments)
				) {
					return;
				}
				program_path.traverse({
					FunctionDeclaration(path) {
						bubble_function_declaration(program_path, path);
					},
				});
				program_path.scope.crawl();
				if (state.jsx) {
					program_path.traverse({
						JSXElement(path) {
							transform_jsx(path);
						},
						JSXFragment(path) {
							transform_jsx(path);
						},
					});
					program_path.scope.crawl();
				}
				program_path.traverse({
					VariableDeclarator(path) {
						transform_variable_declarator(state, path);
					},
					FunctionDeclaration(path) {
						transform_function_declaration(state, path);
					},
				});
				// TODO anything simpler than this?
				// This is to fix an issue with webpack
				program_path.scope.crawl();
			},
		},
	};
}
