const { pathsToModuleNameMapper } = require('ts-jest');

const {
  compilerOptions: { paths = {}, baseUrl = './' },
} = require('./tsconfig.json');
const environment = require('./webpack/environment');

module.exports = {
  // d3 v7 and its transitive deps (internmap, delaunator, robust-predicates) publish ESM in plain .js files, so
  // they have to go through the transform or every suite that reaches a d3-based widget fails to parse.
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|dayjs/esm|d3(-[a-z0-9-]+)?/|internmap/|delaunator/|robust-predicates/)'],
  resolver: 'jest-preset-angular/build/resolvers/ng-jest-resolver.js',
  globals: {
    ...environment,
  },
  roots: ['<rootDir>', `<rootDir>/${baseUrl}`],
  modulePaths: [`<rootDir>/${baseUrl}`],
  // jest.setup.js polyfills TextEncoder/TextDecoder, which jsdom lacks and the OpenTelemetry
  // browser packages read at module scope — without it those imports throw before any test runs.
  setupFiles: ['jest-date-mock', '<rootDir>/jest.setup.js'],
  cacheDirectory: '<rootDir>/target/jest-cache',
  coverageDirectory: '<rootDir>/target/test-results/',
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: `<rootDir>/${baseUrl}/` }),
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: '<rootDir>/target/test-results/', outputName: 'TESTS-results-jest.xml' }],
    ['jest-sonar', { outputDirectory: './target/test-results/jest', outputName: 'TESTS-results-sonar.xml' }],
  ],
  testMatch: ['<rootDir>/src/main/webapp/app/**/@(*.)@(spec.ts)'],
  testEnvironmentOptions: {
    url: 'https://jhipster.tech',
  },
};
