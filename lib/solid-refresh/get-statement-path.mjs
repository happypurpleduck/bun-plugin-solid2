import * as t from "@babel/types";

/**
 * Walk up the AST to find the nearest statement path.
 *
 * @param {babel.NodePath} path
 * @returns {babel.NodePath | null}
 */
export function get_statement_path(path) {
	if (t.isStatement(path.node)) {
		return path;
	}
	if (path.parentPath) {
		return get_statement_path(path.parentPath);
	}
	return null;
}
