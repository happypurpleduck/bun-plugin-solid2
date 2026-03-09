/**
 * @import { StateContext, ImportIdentifierType, ImportIdentifierSpecifier } from "./types.ts"
 */

import * as t from "@babel/types";
import { unwrap_node } from "./unwrap.mjs";

/**
 * Check if a bare identifier is a valid callee for the given target import type.
 *
 * @param {StateContext} state
 * @param {babel.NodePath} path
 * @param {babel.types.Identifier} callee
 * @param {ImportIdentifierType} target
 * @returns {boolean}
 */
function is_identifier_valid_callee(state, path, callee, target) {
	const binding = path.scope.getBindingIdentifier(callee.name);
	if (binding != null) {
		const result = state.registrations.identifiers.get(binding);
		if (result && result.type === target) {
			return true;
		}
	}
	return false;
}

/**
 * Check if a property access on a namespace import is a valid callee.
 *
 * @param {ImportIdentifierSpecifier[]} result
 * @param {ImportIdentifierType} target
 * @param {string} prop_name
 * @returns {boolean}
 */
function is_property_valid_callee(result, target, prop_name) {
	for (let i = 0, len = result.length; i < len; i++) {
		const registration = result[i];
		if (registration.type === target) {
			if (registration.definition.kind === "named") {
				if (registration.definition.name === prop_name) {
					return true;
				}
			}
			else if (prop_name === "default") {
				return true;
			}
		}
	}
	return false;
}

/**
 * Check if a member expression is a valid callee for the given target import type.
 *
 * @param {StateContext} state
 * @param {babel.NodePath} path
 * @param {babel.types.MemberExpression} member
 * @param {ImportIdentifierType} target
 * @returns {boolean}
 */
function is_member_expression_valid_callee(state, path, member, target) {
	if (!t.isIdentifier(member.property)) {
		return false;
	}
	const true_object = unwrap_node(member.object, t.isIdentifier);
	if (!true_object) {
		return false;
	}
	const binding = path.scope.getBindingIdentifier(true_object.name);
	if (binding == null) {
		return false;
	}
	const result = state.registrations.namespaces.get(binding);
	if (!result) {
		return false;
	}
	return is_property_valid_callee(result, target, member.property.name);
}

/**
 * Determine whether a call expression is for a tracked import (render/createContext).
 *
 * @param {StateContext} state
 * @param {babel.NodePath} path
 * @param {babel.types.CallExpression} param2
 * @param {ImportIdentifierType} target
 * @returns {boolean}
 */
export function is_valid_callee(state, path, { callee }, target) {
	if (t.isV8IntrinsicIdentifier(callee)) {
		return false;
	}
	const true_callee = unwrap_node(callee, t.isIdentifier);
	if (true_callee) {
		return is_identifier_valid_callee(state, path, true_callee, target);
	}
	const true_member = unwrap_node(callee, t.isMemberExpression);
	if (true_member && !true_member.computed) {
		return is_member_expression_valid_callee(state, path, true_member, target);
	}

	return false;
}
