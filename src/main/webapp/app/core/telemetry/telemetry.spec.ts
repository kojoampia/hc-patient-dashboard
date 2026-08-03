import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

import { OTEL_TRACES_ENDPOINT } from 'app/app.constants';
import { initTelemetry, resolveExporterUrl } from './telemetry';

describe('telemetry', () => {
  describe('resolveExporterUrl', () => {
    // THE REGRESSION THIS FILE EXISTS FOR.
    //
    // OTLPTraceExporter validates its `url` with the URL constructor, which throws on a bare path.
    // Passing the configured '/v1/traces' straight through therefore threw during module evaluation
    // of the bootstrap chunk — before bootstrapApplication — so Angular never started and
    // patient.abofonsa.com served JHipster's static error page for about twelve minutes on
    // 2026-08-03. The build was green and the whole unit suite passed, because telemetry is
    // compiled out under Jest and nothing ever constructed the exporter.
    it('produces a URL the OTLP exporter accepts', async () => {
      const url = resolveExporterUrl(OTEL_TRACES_ENDPOINT, 'https://patient.abofonsa.com');

      // Constructing it is the assertion: this is the exact call that used to throw.
      let exporter: OTLPTraceExporter | undefined;
      expect(() => (exporter = new OTLPTraceExporter({ url }))).not.toThrow();
      expect(url).toBe('https://patient.abofonsa.com/v1/traces');

      // Shut it down, or its internal timers keep the Jest worker alive and the run ends with
      // "a worker process has failed to exit gracefully".
      await exporter?.shutdown();
    });

    it('keeps the export same-origin, so no CORS preflight is involved', () => {
      expect(resolveExporterUrl('/v1/traces', 'https://example.test')).toBe('https://example.test/v1/traces');
    });

    it('rejects nothing silently — a bad endpoint surfaces as a throw the caller can catch', () => {
      expect(() => resolveExporterUrl('://not a url', 'not-an-origin')).toThrow();
    });
  });

  describe('initTelemetry', () => {
    // The second half of the same lesson: the fix above stops this particular exception, and this
    // guarantees that the next one of its kind costs telemetry rather than the application.
    it('never throws, whatever the SDK does', () => {
      expect(() => initTelemetry()).not.toThrow();
    });
  });
});
