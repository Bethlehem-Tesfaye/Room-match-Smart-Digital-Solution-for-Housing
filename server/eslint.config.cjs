/* eslint-disable no-unused-vars */

const path = require("node:path");
const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
  {
    ignores: ["node_modules", "build", "dist"]
  },
  ...compat.extends("airbnb-base", "plugin:prettier/recommended"),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          js: "always",
          jsx: "never",
          ts: "always",
          tsx: "never"
        }
      ],
      "no-nested-ternary": "off",
      "import/prefer-default-export": "off",
      "no-await-in-loop": "off",
      "no-restricted-syntax": "off",
      "no-inner-declarations": "off",
      "import/no-unresolved": "off",
      "no-underscore-dangle": [
        "error",
        { allow: ["_id", "_sum", "_count", "_avg", "_min", "_max"] }
      ]
    }
  },
  {
    files: ["eslint.config.cjs"],
    rules: {
      "import/no-extraneous-dependencies": "off"
    }
  }
];
