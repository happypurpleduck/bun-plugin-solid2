import * as t from "@babel/types";

/**
 * Find the statement path that is a direct child of the program node.
 *
 * @param {babel.NodePath} path
 * @returns {babel.NodePath}
 */
export function get_root_statement_path(path) {
	let current = path.parentPath;
	while (current) {
		const next = current.parentPath;
		if (next && t.isProgram(next.node)) {
			return current;
		}
		current = next;
	}
	return path;
}
