/** @type {import('jest').Config} */
module.exports = {
  // preset: 'ts-jest',

  modulePaths: ['<rootDir>/'],
  // moduleDirectories: ['node_modules', 'src'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/lib/'],
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
