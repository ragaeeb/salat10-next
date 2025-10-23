import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
    {
        ignores: ['node_modules', '.next', 'public', 'eslint.config.mjs', '**/*.config.*'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: process.cwd(),
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
];
