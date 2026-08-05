const { pathsToModuleNameMapper } = require('ts-jest');

const {
  compilerOptions: { paths = {}, baseUrl = './' },
} = require('./tsconfig.json');
const environment = require('./webpack/environment');

module.exports = {
  // d3 v7 and its transitive deps (internmap, delaunator, robust-predicates) publish ESM in plain .js files, so
  // they have to go through the transform or every suite that reaches a d3-based widget fails to parse.
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|dayjs/esm|d3(-[a-z0-9-]+)?/|internmap/|delaunator/|robust-predicates/)'],
  // d3 v7 publishes ESM in plain .js files with "type": "module", and ts-jest does not transform
  // anything under node_modules regardless of transformIgnorePatterns or allowJs — so those imports
  // reach the runtime as raw ESM and every suite touching a d3-based widget dies on
  // "Unexpected token 'export'". Each of these packages also ships a UMD build under exports.umd,
  // which is plain CJS; point Jest at that instead. Nothing else in the app resolves d3 this way —
  // the browser build uses the ESM entry as before, so this is a test-only redirection.
  //
  // Surfaced by the Angular 17 -> 20 upgrade (2026-08-05), when @swimlane/ngx-charts 20 -> 25 began
  // importing d3 as an external rather than bundling it.
  moduleNameMapper: {
    '^d3$': '<rootDir>/node_modules/d3/dist/d3.min.js',
    '^(d3-[a-z0-9-]+)$': '<rootDir>/node_modules/$1/dist/$1.min.js',
    '^internmap$': '<rootDir>/node_modules/internmap/dist/internmap.min.js',
    // tsconfig path aliases. Currently a no-op — tsconfig.json declares no `paths`, and bare
    // 'app/...' imports resolve through `modulePaths` below instead. Kept so that adding an alias
    // later works without anyone having to rediscover this file.
    ...pathsToModuleNameMapper(paths, { prefix: `<rootDir>/${baseUrl}/` }),
  },
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
