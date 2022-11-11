const confusingBrowserGlobals = require('confusing-browser-globals');

module.exports = {
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks', 'import'],
  env: { browser: true },
  rules: {
    'no-console': 'warn',
    'react-hooks/rules-of-hooks': 'error', // Checks rules of Hooks
    'react-hooks/exhaustive-deps': 'warn', // Checks effect dependencies
    'no-use-before-define': ['error', { classes: false }],
    'no-restricted-globals': ['error']
      .concat(confusingBrowserGlobals)
      .concat(['origin']),
    'import/order': 'error',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['plugin:@typescript-eslint/recommended'],
      parserOptions: {
        project: './tsconfig.json',
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off', // to be able to require resources, e.g. .png, .jpg
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-unused-vars': 'off', // checked by TypeScript's 'noUnusedLocals'
        'no-unused-vars': 'off', // checked by TypeScript's 'noUnusedLocals'
        'react/prop-types': 'off', // Use TypeScript types and interfaces instead
      },
    },
    {
      files: [
        '.eslintrc.js',
        '.prettierrc.js',
        'babel.config.js',
        'postcss.config.js',
        'jest.config.js',
        '*.node.js',
        'webpack.config.js',
      ],
      env: { node: true },
      rules: {
        'import/no-commonjs': 'off',
        'import/no-nodejs-modules': 'off',
      },
    },
  ],
};
