module.exports = {
  root: true,
  extends: 'universe/native',
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    // React Native event callbacks intentionally discard their returned Promise.
    'no-void': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: ['node_modules', 'dist', '.expo', '.eslintrc.js'],
}
