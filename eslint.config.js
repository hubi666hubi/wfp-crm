import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactDom from 'eslint-plugin-react-dom'
import tseslint from 'typescript-eslint'
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules'

export default tseslint.config(
  { ignores: ['dist', 'wfp-crm-dashboard', 'eslint.config.js', '*.cjs', '.agents', 'functions', 'scripts'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactDom.configs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json', './tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'prefer-const': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'preserve-caught-error': 'off',
      '@firebase/security-rules/preserve-caught-error': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-compiler/react-compiler': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
      'no-useless-assignment': 'off'
    },
  },
  firebaseRulesPlugin.configs['flat/recommended']
)
