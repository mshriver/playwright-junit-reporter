import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      '.yarn/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.vscode/**',
      '.pnp.*',
      '*.json',
      '*.jsonc',
    ],
  },

  // JavaScript files
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
    languageOptions: {
      globals: globals.node,
    },
  },

  // TypeScript files
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      ...config.languageOptions,
      globals: globals.node,
    },
  })),
];
