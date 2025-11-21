module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
    '@typescript-eslint/no-var-requires': 'off',

    // General rules
    'no-console': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',
    'object-shorthand': 'warn',
    'prefer-template': 'warn',
    'no-case-declarations': 'off',
    'no-empty': 'warn',
    'no-extra-semi': 'warn',
    'no-constant-condition': 'warn',
    'no-empty-pattern': 'warn',
  },
  overrides: [
    // Next.js specific configuration
    {
      files: ['packages/monitor-despesas-next/**/*.{ts,tsx}'],
      env: {
        browser: true,
        es2022: true,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        // React/Next.js specific rules
        'react/no-unescaped-entities': 'warn',
        'react-hooks/exhaustive-deps': 'warn',
        '@next/next/no-img-element': 'warn',
        'import/no-anonymous-default-export': 'warn',
        'react/display-name': 'warn',
        'react/prop-types': 'off', // Using TypeScript for prop validation
        'react/react-in-jsx-scope': 'off', // Not needed in Next.js
      },
    },
    // Backend specific configuration
    {
      files: ['packages/api/**/*.{ts,js}'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        'no-console': 'off', // Allow console in backend
      },
    },
    // ETL Python package (for any JS/TS files)
    {
      files: ['packages/etlpython/**/*.{ts,js}'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        'no-console': 'off', // Allow console in ETL scripts
      },
    },
  ],
}