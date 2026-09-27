import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'build'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // FFmpeg WASM API (v0.10.x) and browser vendor detection lean on `any`
      // in several utils (ffmpegUtils.ts, downloadUtils.ts) — see CLAUDE.md.
      '@typescript-eslint/no-explicit-any': 'warn',
      // console logging is used deliberately for FFmpeg progress/debug (createFFmpeg({ log: true })).
      'no-console': 'off',
      // Codebase convention: `_`-prefixed catch/args bindings mark deliberately
      // ignored errors/params (e.g. `catch (_) { /* file may not exist */ }`).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // react-hooks v7 recommended-latest adds these React Compiler-oriented rules.
      // Several effects here deliberately set state synchronously (initial browser/
      // media-query checks, tab-visibility sync) and reading Date.now()/Math.random()
      // during render is used for one-off IDs/elapsed-time calc. Real occurrences are
      // few (see docs/CHANGELOG.md) and refactoring effect timing risks behavior
      // changes in FFmpeg-loading flows (CLAUDE.md: DO NOT MODIFY without understanding
      // why) — downgraded to warn rather than force-refactoring under a lint fix task.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
)
