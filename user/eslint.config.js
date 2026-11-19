import eslint from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    { ignores: ['build/**', 'dist/**', '.react-router/**', 'node_modules/**'] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
            parserOptions: { ecmaFeatures: { jsx: true } },
        },
        plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
        rules: {
            ...reactHooks.configs.flat.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-empty': 'warn',
            'no-irregular-whitespace': 'warn',
            'prefer-const': 'warn',
            'react-hooks/immutability': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
        },
    },
)
