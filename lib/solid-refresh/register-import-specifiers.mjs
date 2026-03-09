/**
 * @import { StateContext, ImportIdentifierSpecifier } from "./types.ts"
 */

import * as t from "@babel/types";
import { get_import_specifier_name } from "./checks.mjs";

/**
 * Register a single import specifier against the given identifier mapping.
 *
 * @param {StateContext} state
 * @param {ImportIdentifierSpecifier} id
 * @param {babel.types.ImportDefaultSpecifier | t.ImportNamespaceSpecifier | t.ImportSpecifier} specifier
 */
function register_import_specifier(state, id, specifier) {
	if (t.isImportDefaultSpecifier(specifier)) {
		if (id.definition.kind === "default") {
			state.registrations.identifiers.set(specifier.local, id);
		}
		return;
	}
	if (t.isImportSpecifier(specifier)) {
		if (
			specifier.importKind === "type"
			|| specifier.importKind === "typeof"
		) {
			return;
		}
		const name = get_import_specifier_name(specifier);
		if (
			(id.definition.kind === "named" && name === id.definition.name)
			|| (id.definition.kind === "default" && name === "default")
		) {
			state.registrations.identifiers.set(specifier.local, id);
		}
		return;
	}
	let current = state.registrations.namespaces.get(specifier.local);
	if (!current) {
		current = [];
	}
	current.push(id);
	state.registrations.namespaces.set(specifier.local, current);
}

/**
 * Register all import specifiers on a given import declaration.
 *
 * @param {StateContext} state
 * @param {babel.NodePath<babel.types.ImportDeclaration>} path
 * @param {ImportIdentifierSpecifier[]} definitions
 */
export function register_import_specifiers(state, path, definitions) {
	for (let i = 0, len = definitions.length; i < len; i++) {
		const id = definitions[i];
		if (path.node.source.value === id.definition.source) {
			for (let k = 0, klen = path.node.specifiers.length; k < klen; k++) {
				register_import_specifier(state, id, path.node.specifiers[k]);
			}
		}
	}
}
