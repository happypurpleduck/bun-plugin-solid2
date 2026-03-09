import * as t from "@babel/types";

/**
 * This is just a Pascal heuristic: we only assume a function is a component
 * if the first character is in uppercase.
 *
 * @param {string} name
 * @returns {boolean}
 */
export function is_componentish_name(name) {
	return name[0] >= "A" && name[0] <= "Z";
}

/**
 * Get the imported name of an import specifier.
 *
 * @param {babel.types.ImportSpecifier} specifier
 * @returns {string}
 */
export function get_import_specifier_name(specifier) {
	if (t.isIdentifier(specifier.imported)) {
		return specifier.imported.name;
	}
	return specifier.imported.value;
}
