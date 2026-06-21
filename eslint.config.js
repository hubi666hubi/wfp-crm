import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tsPlugin.configs.recommended,
      reactHooks.configs?.flat?.recommended || 'plugin:react-hooks/recommended',
      reactRefresh.configs?.vite || 'plugin:react-refresh/recommended',
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'prefer-const': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'preserve-caught-error': 'off',
      '@firebase/security-rules/preserve-caught-error': 'off'
    }
  },
  firebaseRulesPlugin.configs['flat/recommended']
])
