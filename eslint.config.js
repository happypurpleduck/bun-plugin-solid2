// @ts-check

import antfu from "@antfu/eslint-config";

export default antfu({
	stylistic: {
		indent: "tab",
		quotes: "double",
		semi: true,
	},

	ignores: [
		".sisyphus",
	],

	typescript: {
		filesTypeAware: ["{lib,example}/**/*.{mjs,ts,tsx}"],
		tsconfigPath: "./tsconfig.json",
		overridesTypeAware: {
			"ts/naming-convention": [
				"error",
				{
					selector: "variableLike",
					format: ["snake_case", "UPPER_CASE"],
					leadingUnderscore: "allow",
				},
				{
					selector: "function",
					format: ["snake_case", "UPPER_CASE", "PascalCase"],
				},
			],
		},
	},

	rules: {
		"curly": [
			"error",
			"all",
		],
		"style/brace-style": [
			"error",
			"stroustrup",
			{
				allowSingleLine: false,
			},
		],

		"jsdoc/require-description": "off",
		"jsdoc/require-property-description": "off",
		"jsdoc/require-returns-description": "off",
	},
});
