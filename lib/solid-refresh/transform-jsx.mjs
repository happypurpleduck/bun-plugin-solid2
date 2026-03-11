import * as t from "@babel/types";
import { is_componentish_name } from "./checks.mjs";
import { generate_unique_name } from "./generate-unique-name.mjs";
import { get_descriptive_name } from "./get-descriptive-name.mjs";
import { get_root_statement_path } from "./get-root-statement-path.mjs";
import { is_statement_top_level } from "./is-statement-top-level.mjs";
import { is_path_valid, unwrap_node } from "./unwrap.mjs";

const REFRESH_JSX_SKIP = /^\s*@refresh jsx-skip\s*$/;

/**
 * Determine if a node should skip JSX transformation based on its leading comments.
 *
 * @param {babel.Node} node
 * @returns {boolean}
 */
function should_skip_jsx(node) {
	// Node without leading comments shouldn't be skipped
	if (node.leadingComments) {
		for (let i = 0, len = node.leadingComments.length; i < len; i++) {
			if (REFRESH_JSX_SKIP.test(node.leadingComments[i].value)) {
				return true;
			}
		}
	}
	return false;
}

/**
 * @template {babel.types.Node} T
 * @param {T} node
 * @returns {T}
 */
function skippable_jsx(node) {
	return t.addComment(node, "leading", "@refresh jsx-skip");
}

/**
 * @typedef JSXState
 * @property {babel.types.Identifier} props
 * @property {babel.types.JSXAttribute[]} attributes
 * @property {babel.types.VariableDeclarator[]} vars
 */

/**
 * @param {JSXState} state
 * @param {babel.types.Expression} replacement
 * @returns {string}
 */
function push_attribute(state, replacement) {
	const key = `v${state.attributes.length}`;
	state.attributes.push(
		t.jsxAttribute(
			t.jsxIdentifier(key),
			t.jsxExpressionContainer(replacement),
		),
	);
	return key;
}

/**
 * @param {JSXState} state
 * @param {babel.NodePath} target
 * @param {babel.types.Expression} replacement
 */
function push_attribute_and_replace(state, target, replacement) {
	const key = push_attribute(state, replacement);
	target.replaceWith(t.memberExpression(state.props, t.identifier(key)));
}

/**
 * @param {JSXState} state
 * @param {babel.NodePath} attr
 */
function extract_jsx_expression_from_normal_attribute(state, attr) {
	const value = attr.get("value");
	if (
		is_path_valid(value, t.isJSXElement)
		|| is_path_valid(value, t.isJSXFragment)
	) {
		value.replaceWith(t.jsxExpressionContainer(value.node));
	}
	if (is_path_valid(value, t.isJSXExpressionContainer)) {
		extract_jsx_expressions_from_jsx_expression_container(state, value);
	}
}

/**
 * @param {JSXState} state
 * @param {babel.NodePath} attr
 */
function extract_jsx_expression_from_ref(state, attr) {
	const value = attr.get("value");

	if (is_path_valid(value, t.isJSXExpressionContainer)) {
		const expr = value.get("expression");
		if (is_path_valid(expr, t.isExpression)) {
			const unwrapped_identifier = unwrap_node(expr.node, t.isIdentifier);
			/** @type {babel.types.Expression} */
			let replacement;
			if (unwrapped_identifier) {
				const arg = expr.scope.generateUidIdentifier("arg");
				const binding = expr.scope.getBinding(unwrapped_identifier.name);
				const cannot_assign_kind = ["const", "module"];
				const is_const
					= binding && cannot_assign_kind.includes(binding.kind);

				replacement = t.arrowFunctionExpression(
					[arg],
					t.blockStatement([
						t.ifStatement(
							t.binaryExpression(
								"===",
								t.unaryExpression(
									"typeof",
									unwrapped_identifier,
								),
								t.stringLiteral("function"),
							),
							t.blockStatement([
								t.expressionStatement(
									t.callExpression(unwrapped_identifier, [
										arg,
									]),
								),
							]),
							// fix the new usage of `ref` attribute,
							// if use `Signals as refs`, the `else` branch will throw an error with `Cannot assign to "setter" because it is a constant` message
							// issue: https://github.com/solidjs/solid-refresh/issues/66
							// docs: https://docs.solidjs.com/concepts/refs#signals-as-refs
							is_const
								? null
								: t.blockStatement([
										t.expressionStatement(
											t.assignmentExpression(
												"=",
												unwrapped_identifier,
												arg,
											),
										),
									]),
						),
					]),
				);
			}
			else {
				replacement = expr.node;
			}
			push_attribute_and_replace(state, expr, replacement);
		}
	}
}

/**
 * @param {JSXState} state
 * @param {babel.types.JSXIdentifier} id
 * @param {babel.NodePath} attr
 */
function extract_jsx_expression_from_use_directive(state, id, attr) {
	const value = attr.get("value");

	if (is_path_valid(value, t.isJSXExpressionContainer)) {
		extract_jsx_expressions_from_jsx_expression_container(state, value);
	}

	const key = push_attribute(state, t.identifier(id.name));
	state.vars.push(
		t.variableDeclarator(
			t.identifier(id.name),
			t.memberExpression(state.props, t.identifier(key)),
		),
	);
}

/**
 * @param {JSXState} state
 * @param {babel.NodePath} attr
 */
function extract_jsx_expression_from_attribute(state, attr) {
	const key = attr.get("name");
	if (is_path_valid(key, t.isJSXIdentifier)) {
		if (key.node.name === "ref") {
			extract_jsx_expression_from_ref(state, attr);
		}
		else {
			extract_jsx_expression_from_normal_attribute(state, attr);
		}
	}
	else if (is_path_valid(key, t.isJSXNamespacedName)) {
		if (key.node.namespace.name === "use") {
			extract_jsx_expression_from_use_directive(state, key.node.name, attr);
		}
		else {
			extract_jsx_expression_from_normal_attribute(state, attr);
		}
	}
}

/**
 * @param {JSXState} state
 * @param {babel.NodePath} path
 */
function extract_jsx_expressions_from_attributes(state, path) {
	const opening_element = path.get("openingElement");
	const attrs = opening_element.get("attributes");
	for (let i = 0, len = attrs.length; i < len; i++) {
		const attr = attrs[i];

		if (is_path_valid(attr, t.isJSXAttribute)) {
			extract_jsx_expression_from_attribute(state, attr);
		}
		if (is_path_valid(attr, t.isJSXSpreadAttribute)) {
			const arg = attr.get("argument");
			push_attribute_and_replace(state, arg, arg.node);
		}
	}
}

/**
 * @param {babel.types.JSXIdentifier | babel.types.JSXMemberExpression} node
 * @returns {babel.types.Identifier | babel.types.MemberExpression | babel.types.NullLiteral}
 */
function convert_jsx_opening_to_expression(node) {
	if (t.isJSXIdentifier(node)) {
		return t.identifier(node.name);
	}
	return t.memberExpression(
		convert_jsx_opening_to_expression(node.object),
		convert_jsx_opening_to_expression(node.property),
	);
}

const COMPONENT_PATTERN = /^[A-Z_]/;

/**
 * @param {JSXState} state
 * @param {babel.NodePath} path
 */
function extract_jsx_expressions_from_jsx_element(state, path) {
	const opening_element = path.get("openingElement");
	const opening_name = opening_element.get("name");
	if (
		(is_path_valid(opening_name, t.isJSXIdentifier)
			&& COMPONENT_PATTERN.test(opening_name.node.name))
		|| is_path_valid(opening_name, t.isJSXMemberExpression)
	) {
		if (is_path_valid(opening_name, t.isJSXIdentifier)) {
			const binding = path.scope.getBinding(opening_name.node.name);
			if (binding) {
				const statement_path = binding.path.getStatementParent();
				if (statement_path && is_statement_top_level(statement_path)) {
					return;
				}
			}
		}
		const key = push_attribute(
			state,
			convert_jsx_opening_to_expression(opening_name.node),
		);
		const replacement = t.jsxMemberExpression(
			t.jsxIdentifier(state.props.name),
			t.jsxIdentifier(key),
		);
		opening_name.replaceWith(replacement);

		const closing_element = path.get("closingElement");
		if (is_path_valid(closing_element, t.isJSXClosingElement)) {
			closing_element.get("name").replaceWith(replacement);
		}
	}
}

/**
 * @param {JSXState} state
 * @param {babel.NodePath} child
 */
function extract_jsx_expressions_from_jsx_expression_container(state, child) {
	const expr = child.get("expression");
	if (is_path_valid(expr, t.isExpression)) {
		push_attribute_and_replace(state, expr, expr.node);
	}
}

/**
 * @param {JSXState} state
 * @param {babel.NodePath<babel.types.JSXSpreadChild>} child
 */
function extract_jsx_expressions_from_jsx_spread_child(state, child) {
	const arg = child.get("expression");
	push_attribute_and_replace(state, arg, arg.node);
}

/**
 * @param {JSXState} state
 * @param {babel.NodePath<babel.types.JSXElement | babel.types.JSXFragment>} path
 */
function extract_jsx_expressions(state, path) {
	if (is_path_valid(path, t.isJSXElement)) {
		extract_jsx_expressions_from_jsx_element(state, path);
		extract_jsx_expressions_from_attributes(state, path);
	}
	const children = path.get("children");
	for (let i = 0, len = children.length; i < len; i++) {
		const child = children[i];

		if (
			is_path_valid(child, t.isJSXElement)
			|| is_path_valid(child, t.isJSXFragment)
		) {
			extract_jsx_expressions(state, child);
		}
		else if (is_path_valid(child, t.isJSXExpressionContainer)) {
			extract_jsx_expressions_from_jsx_expression_container(state, child);
		}
		else if (is_path_valid(child, t.isJSXSpreadChild)) {
			extract_jsx_expressions_from_jsx_spread_child(state, child);
		}
	}
}

/**
 * Transform a JSX element or fragment into a call to a generated component
 * with hoisted props/state.
 *
 * @param {babel.NodePath<babel.types.JSXElement | babel.types.JSXFragment>} path
 */
export function transform_jsx(path) {
	if (should_skip_jsx(path.node)) {
		return;
	}

	/** @type {JSXState} */
	const state = {
		props: path.scope.generateUidIdentifier("props"),
		attributes: [],
		vars: [],
	};

	extract_jsx_expressions(state, path);

	const descriptive_name = get_descriptive_name(path, "template");
	const id = generate_unique_name(
		path,
		is_componentish_name(descriptive_name)
			? descriptive_name
			: `JSX_${descriptive_name}`,
	);

	const root_path = get_root_statement_path(path);

	/** @type {babel.types.Expression | babel.types.BlockStatement} */
	let template = skippable_jsx(t.cloneNode(path.node));

	if (state.vars.length) {
		template = t.blockStatement([
			t.variableDeclaration("const", state.vars),
			t.returnStatement(template),
		]);
	}

	const template_comp = t.arrowFunctionExpression([state.props], template);

	if (path.node.loc) {
		template_comp.loc = path.node.loc;
	}

	root_path.scope.registerDeclaration(
		root_path.insertBefore(
			t.variableDeclaration("const", [
				t.variableDeclarator(id, template_comp),
			]),
		)[0],
	);

	path.replaceWith(
		skippable_jsx(
			t.jsxElement(
				t.jsxOpeningElement(
					t.jsxIdentifier(id.name),
					[...state.attributes],
					true,
				),
				t.jsxClosingElement(t.jsxIdentifier(id.name)),
				[],
				true,
			),
		),
	);
}
