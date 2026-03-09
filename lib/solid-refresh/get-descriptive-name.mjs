/**
 * Try to derive a human-readable name from the surrounding AST context.
 *
 * @param {babel.NodePath} path
 * @param {string} default_name
 * @returns {string}
 */
export function get_descriptive_name(path, default_name) {
	/** @type {babel.NodePath | null} */
	let current = path;
	while (current) {
		switch (current.node.type) {
			case "FunctionDeclaration":
			case "FunctionExpression": {
				if (current.node.id) {
					return current.node.id.name;
				}
				break;
			}
			case "VariableDeclarator": {
				if (current.node.id.type === "Identifier") {
					return current.node.id.name;
				}
				break;
			}
			case "ClassPrivateMethod":
			case "ClassMethod":
			case "ObjectMethod": {
				switch (current.node.key.type) {
					case "Identifier":
						return current.node.key.name;
					case "PrivateName":
						return current.node.key.id.name;

					case "ArrayExpression":
					case "ArrowFunctionExpression":
					case "AssignmentExpression":
					case "AwaitExpression":
					case "BigIntLiteral":
					case "BinaryExpression":
					case "BindExpression":
					case "BooleanLiteral":
					case "CallExpression":
					case "ClassExpression":
					case "ConditionalExpression":
					case "DecimalLiteral":
					case "DoExpression":
					case "FunctionExpression":
					case "Import":
					case "ImportExpression":
					case "JSXElement":
					case "JSXFragment":
					case "LogicalExpression":
					case "MemberExpression":
					case "MetaProperty":
					case "ModuleExpression":
					case "NewExpression":
					case "NullLiteral":
					case "NumericLiteral":
					case "ObjectExpression":
					case "OptionalCallExpression":
					case "OptionalMemberExpression":
					case "ParenthesizedExpression":
					case "PipelineBareFunction":
					case "PipelinePrimaryTopicReference":
					case "PipelineTopicExpression":
					case "RecordExpression":
					case "RegExpLiteral":
					case "SequenceExpression":
					case "StringLiteral":
					case "Super":
					case "TSAsExpression":
					case "TSInstantiationExpression":
					case "TSNonNullExpression":
					case "TSSatisfiesExpression":
					case "TSTypeAssertion":
					case "TaggedTemplateExpression":
					case "TemplateLiteral":
					case "ThisExpression":
					case "TopicReference":
					case "TupleExpression":
					case "TypeCastExpression":
					case "UnaryExpression":
					case "UpdateExpression":
					case "YieldExpression":
					default:
						break;
				}

				break;
			}

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
			case "ParenthesizedExpression":
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
			case "TSAsExpression":
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
			case "TSInstantiationExpression":
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
			case "TSNonNullExpression":
			case "TSNullKeyword":
			case "TSNumberKeyword":
			case "TSObjectKeyword":
			case "TSOptionalType":
			case "TSParameterProperty":
			case "TSParenthesizedType":
			case "TSPropertySignature":
			case "TSQualifiedName":
			case "TSRestType":
			case "TSSatisfiesExpression":
			case "TSStringKeyword":
			case "TSSymbolKeyword":
			case "TSTemplateLiteralType":
			case "TSThisType":
			case "TSTupleType":
			case "TSTypeAliasDeclaration":
			case "TSTypeAnnotation":
			case "TSTypeAssertion":
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
			case "TypeCastExpression":
			case "TypeParameter":
			case "TypeParameterDeclaration":
			case "TypeParameterInstantiation":
			case "TypeofTypeAnnotation":
			case "UnaryExpression":
			case "UnionTypeAnnotation":
			case "UpdateExpression":
			case "V8IntrinsicIdentifier":
			case "VariableDeclaration":
			case "Variance":
			case "VoidPattern":
			case "VoidTypeAnnotation":
			case "WhileStatement":
			case "WithStatement":
			case "YieldExpression":
			default:
				break;
		}

		current = current.parentPath;
	}
	return default_name;
}
