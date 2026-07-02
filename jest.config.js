// Pure-logic tests (crypto/signing/parsing, no React Native APIs) run under plain
// ts-jest + Node, so `import ... from 'crypto'` resolves to Node's real builtin -
// no native module involved, unlike the app bundle where Metro/babel redirects
// 'crypto' to react-native-quick-crypto. RN component tests, if added later,
// should live in a separate jest "project" using the jest-expo preset instead.
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
};
