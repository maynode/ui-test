const tsPlugin = require(`@typescript-eslint/eslint-plugin`);
const tsParser = require(`@typescript-eslint/parser`);

const nodeGlobals = {
  Buffer: `readonly`,
  __dirname: `readonly`,
  __filename: `readonly`,
  clearInterval: `readonly`,
  clearTimeout: `readonly`,
  console: `readonly`,
  exports: `readonly`,
  module: `readonly`,
  process: `readonly`,
  require: `readonly`,
  setInterval: `readonly`,
  setTimeout: `readonly`,
};

module.exports = [
  {
    ignores: [
      `allure-results/**`,
      `html-report/**`,
      `logs/**`,
      `node_modules/**`,
      `playwright-report/**`,
      `test-results/**`,
    ],
  },
  {
    files: [`**/*.{js,ts}`],
    languageOptions: {
      ecmaVersion: 2022,
      globals: nodeGlobals,
      sourceType: `module`,
    },
  },
  {
    files: [`**/*.ts`],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: `module`,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': `off`,
      '@typescript-eslint/no-require-imports': `off`,
      '@typescript-eslint/no-unused-vars': `off`,
      '@typescript-eslint/no-wrapper-object-types': `off`,
    },
  },
];
