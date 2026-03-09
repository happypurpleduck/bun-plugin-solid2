import * as t from "@babel/types";

/**
 * Get the expression that refers to the current HMR runtime hook.
 *
 * @returns {babel.types.MemberExpression}
 */
export function get_hot_identifier() {
	return t.memberExpression(
		t.memberExpression(
			t.identifier("import"),
			t.identifier("meta"),
		),
		t.identifier("hot"),
	);
}
