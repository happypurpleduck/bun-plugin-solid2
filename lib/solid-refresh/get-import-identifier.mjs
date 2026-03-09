/**
 * @import {ImportDefinition, StateContext} from "./types.ts";
 */

import * as t from "@babel/types";

/**
 * Get or create an identifier for an imported helper based on the given registration.
 *
 * @param {StateContext} state
 * @param {babel.NodePath} path
 * @param {ImportDefinition} registration
 * @returns {babel.types.Identifier}
 */
export function get_import_identifier(state, path, registration) {
	const name = registration.kind === "named" ? registration.name : "default";
	const target = `${registration.source}[${name}]`;
	const current = state.imports.get(target);
	if (current) {
		return current;
	}
	const program_parent = path.scope.getProgramParent();
	const uid = program_parent.generateUidIdentifier(name);
	program_parent.registerDeclaration(
		/** @type {babel.NodePath<t.Program>} */ (
			program_parent.path
		).unshiftContainer(
			"body",
			t.importDeclaration(
				[
					registration.kind === "named"
						? t.importSpecifier(
								uid,
								t.identifier(registration.name),
							)
						: t.importDefaultSpecifier(uid),
				],
				t.stringLiteral(registration.source),
			),
		)[0],
	);
	state.imports.set(target, uid);
	return uid;
}
