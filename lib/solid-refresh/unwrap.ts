export type TypeFilter<V extends babel.types.Node> = (
	node: babel.types.Node,
) => node is V;

export type NestedExpression
	= | babel.types.ParenthesizedExpression
		| babel.types.TypeCastExpression
		| babel.types.TSAsExpression
		| babel.types.TSSatisfiesExpression
		| babel.types.TSNonNullExpression
		| babel.types.TSInstantiationExpression
		| babel.types.TSTypeAssertion;

export type TypeCheck<K> = K extends TypeFilter<infer U> ? U : never;
