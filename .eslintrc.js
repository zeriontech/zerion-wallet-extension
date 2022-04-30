module.exports = {
  extends: 'eslint:recommended',
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint/eslint-plugin'],
  parserOptions: {
    project: './tsconfig.json',
  },
  env: { browser: true },
  rules: {},
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
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
        './webpack-config/*.js',
      ],
      env: { node: true },
      rules: {
        'import/no-commonjs': 'off',
        'import/no-nodejs-modules': 'off',
      },
    },
  ],
};

