/**
 * Determine whether the given statement path is at the top level of the program.
 *
 * @param {babel.NodePath<babel.types.Statement>} path
 * @returns {boolean}
 */
export function is_statement_top_level(path) {
	let block_parent = path.scope.getBlockParent();
	const program_parent = path.scope.getProgramParent();
	// a FunctionDeclaration binding refers to itself as the block parent
	if (block_parent.path === path) {
		block_parent = block_parent.parent;
	}

	return program_parent === block_parent;
}
