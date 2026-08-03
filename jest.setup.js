// Runs before the test framework and before any test module is imported (jest.conf.js `setupFiles`).
//
// jsdom does not provide TextEncoder/TextDecoder, which Node has had globally since v11. Several
// OpenTelemetry browser packages read TextEncoder at module scope, so importing them under jsdom
// fails with "ReferenceError: TextEncoder is not defined" before a single test runs — the failure
// is in the import, which is why it cannot be fixed inside the spec file.
const { TextEncoder, TextDecoder } = require('util');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
