export default [{
  ignores: ['node_modules/**', 'prisma/migrations/**']
}, {
  files: ['**/*.js'],
  languageOptions: {
    globals: {
      AbortController: 'readonly',
      clearTimeout: 'readonly',
      console: 'readonly',
      fetch: 'readonly',
      performance: 'readonly',
      process: 'readonly',
      setTimeout: 'readonly'
    }
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-undef': 'error'
  }
}];
