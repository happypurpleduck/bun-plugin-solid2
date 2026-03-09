import * as t from "@babel/types";
import { is_path_valid } from "./unwrap.mjs";

/**
 * Determine whether a binding is foreign to the given source path.
 *
 * @param {babel.NodePath} source
 * @param {babel.NodePath} current
 * @param {string} name
 * @returns {boolean}
 */
function is_foreign_binding(source, current, name) {
	if (source === current) {
		return true;
	}
	if (current.scope.hasOwnBinding(name)) {
		return false;
	}
	if (current.parentPath) {
		return is_foreign_binding(source, current.parentPath, name);
	}

	return true;
}

/**
 * Check whether the given path is inside a TypeScript-only construct.
 *
 * @param {babel.NodePath} path
 * @returns {boolean}
 */
function is_in_typescript(path) {
	let parent = path.parentPath;
	while (parent) {
		if (t.isTypeScript(parent.node) && !t.isExpression(parent.node)) {
			return true;
		}
		parent = parent.parentPath;
	}

	return false;
}

/**
 * Collect foreign bindings referenced from the given path.
 *
 * @param {babel.NodePath} path
 * @returns {babel.types.Identifier[]}
 */
export function get_foreign_bindings(path) {
	/** @type {Set<string>} */
	const identifiers = new Set();
	path.traverse({
		ReferencedIdentifier(p) {
			// Check identifiers that aren't in a TS expression
			if (!is_in_typescript(p) && is_foreign_binding(path, p, p.node.name)) {
				if (
					is_path_valid(p, t.isIdentifier)
					|| is_path_valid(p.parentPath, t.isJSXMemberExpression)
				) {
					identifiers.add(p.node.name);
				}
			}
		},
	});

	const collected = [];
	for (const identifier of identifiers) {
		collected.push(t.identifier(identifier));
	}

	return collected;
}
