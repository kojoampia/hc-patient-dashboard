module.exports = {
  I18N_HASH: 'generated_hash',
  SERVER_API_URL: '',
  DEV_SERVER_API_URL: 'http://localhost:5505/',
  TEST_SERVER_API_URL: 'https://patient-dashboard.jojoaddison.net/',
  PROD_SERVER_API_URL: 'https://patient-dashboard.abofonsa.com/',
  __VERSION__: process.env.hasOwnProperty('APP_VERSION') ? process.env.APP_VERSION : 'DEV',
  __DEBUG_INFO_ENABLED__: true,

  // --- Browser telemetry ------------------------------------------------------------------------
  //
  // The default is OFF, and webpack.custom.js turns it on for anything that is not a development
  // build. It has to be declared here and not only there because jest.conf.js spreads this file
  // into its `globals` — Jest does not run DefinePlugin, so a constant defined only in the webpack
  // config is simply undefined under test, and every suite that transitively imports
  // app.constants.ts dies with a ReferenceError.
  __OTEL_ENABLED__: false,
  //
  // Spans are posted to this SAME-ORIGIN path, which nginx forwards to the shared OpenTelemetry
  // collector (deploy/docker/web-nginx.conf). It is not the collector's address: that lives on an
  // internal Docker network and must not be in a bundle the browser downloads.
  //
  // Left as a relative path on purpose, so the same build works behind patient.abofonsa.com and in
  // local compose without a per-environment bundle.
  __OTEL_TRACES_ENDPOINT__: '/v1/traces',

  // 10% of user sessions. The tuning constraint is not the browser, it is the shared monitoring
  // stack: Tempo and Mimir write to this host's local disk, and the stack's own most severe alert
  // is about that disk filling. Raise it while investigating something specific, then put it back.
  __OTEL_SAMPLE_RATIO__: 0.1,
};
