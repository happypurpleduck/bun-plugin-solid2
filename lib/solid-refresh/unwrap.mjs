/** @import { NestedExpression, TypeCheck, TypeFilter } from "./unwrap.ts" */

/**
 * Check whether the given path is a valid NodePath for the provided type guard.
 *
 * @template {babel.types.Node} V
 * @param {unknown} path
 * @param {TypeFilter<V>} key
 * @returns {path is babel.NodePath<V>}
 */
export function is_path_valid(path, key) {
	return key(/** @type {babel.NodePath} */ (path).node);
}

/**
 * Determine whether the given node is a nested expression that can wrap another expression.
 *
 * @param {babel.Node} node
 * @returns {node is NestedExpression}
 */
export function is_nested_expression(node) {
	switch (node.type) {
		case "ParenthesizedExpression":
		case "TypeCastExpression":
		case "TSAsExpression":
		case "TSSatisfiesExpression":
		case "TSNonNullExpression":
		case "TSTypeAssertion":
		case "TSInstantiationExpression":
			return true;

		case "AnyTypeAnnotation":
		case "ArgumentPlaceholder":
		case "ArrayExpression":
		case "ArrayPattern":
		case "ArrayTypeAnnotation":
		case "ArrowFunctionExpression":
		case "AssignmentExpression":
		case "AssignmentPattern":
		case "AwaitExpression":
		case "BigIntLiteral":
		case "BinaryExpression":
		case "BindExpression":
		case "BlockStatement":
		case "BooleanLiteral":
		case "BooleanLiteralTypeAnnotation":
		case "BooleanTypeAnnotation":
		case "BreakStatement":
		case "CallExpression":
		case "CatchClause":
		case "ClassAccessorProperty":
		case "ClassBody":
		case "ClassDeclaration":
		case "ClassExpression":
		case "ClassImplements":
		case "ClassMethod":
		case "ClassPrivateMethod":
		case "ClassPrivateProperty":
		case "ClassProperty":
		case "ConditionalExpression":
		case "ContinueStatement":
		case "DebuggerStatement":
		case "DecimalLiteral":
		case "DeclareClass":
		case "DeclareExportAllDeclaration":
		case "DeclareExportDeclaration":
		case "DeclareFunction":
		case "DeclareInterface":
		case "DeclareModule":
		case "DeclareModuleExports":
		case "DeclareOpaqueType":
		case "DeclareTypeAlias":
		case "DeclareVariable":
		case "DeclaredPredicate":
		case "Decorator":
		case "Directive":
		case "DirectiveLiteral":
		case "DoExpression":
		case "DoWhileStatement":
		case "EmptyStatement":
		case "EmptyTypeAnnotation":
		case "EnumBooleanBody":
		case "EnumBooleanMember":
		case "EnumDeclaration":
		case "EnumDefaultedMember":
		case "EnumNumberBody":
		case "EnumNumberMember":
		case "EnumStringBody":
		case "EnumStringMember":
		case "EnumSymbolBody":
		case "ExistsTypeAnnotation":
		case "ExportAllDeclaration":
		case "ExportDefaultDeclaration":
		case "ExportDefaultSpecifier":
		case "ExportNamedDeclaration":
		case "ExportNamespaceSpecifier":
		case "ExportSpecifier":
		case "ExpressionStatement":
		case "File":
		case "ForInStatement":
		case "ForOfStatement":
		case "ForStatement":
		case "FunctionDeclaration":
		case "FunctionExpression":
		case "FunctionTypeAnnotation":
		case "FunctionTypeParam":
		case "GenericTypeAnnotation":
		case "Identifier":
		case "IfStatement":
		case "Import":
		case "ImportAttribute":
		case "ImportDeclaration":
		case "ImportDefaultSpecifier":
		case "ImportExpression":
		case "ImportNamespaceSpecifier":
		case "ImportSpecifier":
		case "IndexedAccessType":
		case "InferredPredicate":
		case "InterfaceDeclaration":
		case "InterfaceExtends":
		case "InterfaceTypeAnnotation":
		case "InterpreterDirective":
		case "IntersectionTypeAnnotation":
		case "JSXAttribute":
		case "JSXClosingElement":
		case "JSXClosingFragment":
		case "JSXElement":
		case "JSXEmptyExpression":
		case "JSXExpressionContainer":
		case "JSXFragment":
		case "JSXIdentifier":
		case "JSXMemberExpression":
		case "JSXNamespacedName":
		case "JSXOpeningElement":
		case "JSXOpeningFragment":
		case "JSXSpreadAttribute":
		case "JSXSpreadChild":
		case "JSXText":
		case "LabeledStatement":
		case "LogicalExpression":
		case "MemberExpression":
		case "MetaProperty":
		case "MixedTypeAnnotation":
		case "ModuleExpression":
		case "NewExpression":
		case "Noop":
		case "NullLiteral":
		case "NullLiteralTypeAnnotation":
		case "NullableTypeAnnotation":
		case "NumberLiteral":
		case "NumberLiteralTypeAnnotation":
		case "NumberTypeAnnotation":
		case "NumericLiteral":
		case "ObjectExpression":
		case "ObjectMethod":
		case "ObjectPattern":
		case "ObjectProperty":
		case "ObjectTypeAnnotation":
		case "ObjectTypeCallProperty":
		case "ObjectTypeIndexer":
		case "ObjectTypeInternalSlot":
		case "ObjectTypeProperty":
		case "ObjectTypeSpreadProperty":
		case "OpaqueType":
		case "OptionalCallExpression":
		case "OptionalIndexedAccessType":
		case "OptionalMemberExpression":
		case "PipelineBareFunction":
		case "PipelinePrimaryTopicReference":
		case "PipelineTopicExpression":
		case "Placeholder":
		case "PrivateName":
		case "Program":
		case "QualifiedTypeIdentifier":
		case "RecordExpression":
		case "RegExpLiteral":
		case "RegexLiteral":
		case "RestElement":
		case "RestProperty":
		case "ReturnStatement":
		case "SequenceExpression":
		case "SpreadElement":
		case "SpreadProperty":
		case "StaticBlock":
		case "StringLiteral":
		case "StringLiteralTypeAnnotation":
		case "StringTypeAnnotation":
		case "Super":
		case "SwitchCase":
		case "SwitchStatement":
		case "SymbolTypeAnnotation":
		case "TSAnyKeyword":
		case "TSArrayType":
		case "TSBigIntKeyword":
		case "TSBooleanKeyword":
		case "TSCallSignatureDeclaration":
		case "TSConditionalType":
		case "TSConstructSignatureDeclaration":
		case "TSConstructorType":
		case "TSDeclareFunction":
		case "TSDeclareMethod":
		case "TSEnumBody":
		case "TSEnumDeclaration":
		case "TSEnumMember":
		case "TSExportAssignment":
		case "TSExpressionWithTypeArguments":
		case "TSExternalModuleReference":
		case "TSFunctionType":
		case "TSImportEqualsDeclaration":
		case "TSImportType":
		case "TSIndexSignature":
		case "TSIndexedAccessType":
		case "TSInferType":
		case "TSInterfaceBody":
		case "TSInterfaceDeclaration":
		case "TSIntersectionType":
		case "TSIntrinsicKeyword":
		case "TSLiteralType":
		case "TSMappedType":
		case "TSMethodSignature":
		case "TSModuleBlock":
		case "TSModuleDeclaration":
		case "TSNamedTupleMember":
		case "TSNamespaceExportDeclaration":
		case "TSNeverKeyword":
		case "TSNullKeyword":
		case "TSNumberKeyword":
		case "TSObjectKeyword":
		case "TSOptionalType":
		case "TSParameterProperty":
		case "TSParenthesizedType":
		case "TSPropertySignature":
		case "TSQualifiedName":
		case "TSRestType":
		case "TSStringKeyword":
		case "TSSymbolKeyword":
		case "TSTemplateLiteralType":
		case "TSThisType":
		case "TSTupleType":
		case "TSTypeAliasDeclaration":
		case "TSTypeAnnotation":
		case "TSTypeLiteral":
		case "TSTypeOperator":
		case "TSTypeParameter":
		case "TSTypeParameterDeclaration":
		case "TSTypeParameterInstantiation":
		case "TSTypePredicate":
		case "TSTypeQuery":
		case "TSTypeReference":
		case "TSUndefinedKeyword":
		case "TSUnionType":
		case "TSUnknownKeyword":
		case "TSVoidKeyword":
		case "TaggedTemplateExpression":
		case "TemplateElement":
		case "TemplateLiteral":
		case "ThisExpression":
		case "ThisTypeAnnotation":
		case "ThrowStatement":
		case "TopicReference":
		case "TryStatement":
		case "TupleExpression":
		case "TupleTypeAnnotation":
		case "TypeAlias":
		case "TypeAnnotation":
		case "TypeParameter":
		case "TypeParameterDeclaration":
		case "TypeParameterInstantiation":
		case "TypeofTypeAnnotation":
		case "UnaryExpression":
		case "UnionTypeAnnotation":
		case "UpdateExpression":
		case "V8IntrinsicIdentifier":
		case "VariableDeclaration":
		case "VariableDeclarator":
		case "Variance":
		case "VoidPattern":
		case "VoidTypeAnnotation":
		case "WhileStatement":
		case "WithStatement":
		case "YieldExpression":
		default:
			return false;
	}
}

/**
 * Unwrap nested TypeScript/JSX nodes until the predicate matches or the chain ends.
 * @template {(value: babel.types.Node) => boolean} K
 * @param {babel.types.Node} node
 * @param {K} key
 * @returns {TypeCheck<K> | undefined}
 */
export function unwrap_node(node, key) {
	if (key(node)) {
		return /** @type {TypeCheck<K>} */ (node);
	}
	if (is_nested_expression(node)) {
		return unwrap_node(node.expression, key);
	}
	return undefined;
}

/**
 * Unwrap nested paths until a valid NodePath for the given filter is found.
 *
 * @template {babel.types.Node} V
 * @param {unknown} path
 * @param {TypeFilter<V>} key
 * @returns {babel.NodePath | undefined}
 */
export function unwrap_path(path, key) {
	if (is_path_valid(path, key)) {
		return path;
	}
	if (is_path_valid(path, is_nested_expression)) {
		return unwrap_path(path.get("expression"), key);
	}
	return undefined;
}
