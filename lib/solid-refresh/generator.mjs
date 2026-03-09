import { generate } from "@babel/generator";

/**
 * Generate code for a Babel AST node.
 *
 * @param {babel.types.Node} node
 * @returns {string}
 */
export function generate_code(node) {
	return generate(node).code;
}
