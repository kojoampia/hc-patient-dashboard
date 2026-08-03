import { context, trace, Span } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { WebTracerProvider, BatchSpanProcessor, ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';

import { OTEL_ENABLED, OTEL_SAMPLE_RATIO, OTEL_TRACES_ENDPOINT, VERSION } from 'app/app.constants';

/**
 * Browser telemetry for the patient dashboard.
 *
 * The two backends are instrumented by the OpenTelemetry Java agent and push OTLP to the shared
 * collector, which gives a trace that starts at the gateway. That misses everything the user
 * actually experiences: how long the bundle took to load, whether a request was slow in the network
 * or slow in the server, and the errors that never reach a server log at all. This closes that gap
 * — and because the browser sends W3C `traceparent` on same-origin requests, a click ends up in the
 * same Tempo trace as the gateway, the microservice and the MongoDB query it caused.
 *
 * Off unless the build enables it (see webpack/environment.js). Under `ng serve` there is no
 * collector to send to, so it stays off there by design.
 */

/**
 * Query strings never leave the browser.
 *
 * This is a patient application. A URL like `/api/profiles?email=…` or a search containing a
 * person's name would otherwise be written verbatim into a span attribute and stored in Tempo,
 * which is shared with every other application on the host and is not a system anyone has assessed
 * for holding patient data. Paths are kept because they are what makes a trace useful; everything
 * after `?` is dropped.
 *
 * Note the limit of this: a path can itself carry an identifier (`/api/profiles/6501f…`). Those are
 * opaque database ids rather than personal data, which is why they are kept — but if an endpoint is
 * ever added that puts something identifying in the path, it has to be scrubbed here too.
 */
const scrubUrl = (rawUrl: string): string => {
  try {
    // Second argument matters: request URLs in this app are relative ('api/profiles'), and the
    // one-argument URL constructor throws on those rather than resolving them.
    const parsed = new URL(rawUrl, window.location.origin);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    // Never let telemetry break a request. An unparseable URL is reported as nothing rather than
    // risking the raw value — which is the one string we are trying not to store.
    return '[unparseable]';
  }
};

const applyScrubbedUrl = (span: Span, rawUrl: string | undefined): void => {
  if (!rawUrl) {
    return;
  }
  const scrubbed = scrubUrl(rawUrl);
  // Both names are set: the instrumentations still emit the old `http.url`, while the current
  // semantic conventions use `url.full`. Overwriting only one leaves the query string in the other.
  span.setAttribute('http.url', scrubbed);
  span.setAttribute('url.full', scrubbed);
};

export const initTelemetry = (): void => {
  if (!OTEL_ENABLED) {
    return;
  }

  const provider = new WebTracerProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'hc-patient-web',
      [ATTR_SERVICE_VERSION]: VERSION,
    }),
    // The browser is always the root of its trace, so the root sampler is the one that decides.
    // Sampling here rather than at the collector is deliberate: an unsampled span costs no request
    // and no bytes, and the thing being protected is a shared monitoring stack whose documented
    // worst failure is filling this host's disk.
    sampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(OTEL_SAMPLE_RATIO),
    }),
    spanProcessors: [
      new BatchSpanProcessor(new OTLPTraceExporter({ url: OTEL_TRACES_ENDPOINT }), {
        // Deliberately less chatty than the SDK defaults. A dashboard tab left open all day should
        // not be a steady stream of requests, and losing a span on a closed tab costs nothing.
        scheduledDelayMillis: 10_000,
        maxQueueSize: 256,
        maxExportBatchSize: 64,
      }),
    ],
  });

  // Zone.js, not the default context manager. Angular runs change detection and every HttpClient
  // callback inside zones, and with the default manager the active span is lost across them — the
  // symptom is spans that all appear as unrelated roots instead of forming a trace.
  provider.register({ contextManager: new ZoneContextManager() });

  // The exporter's own POST must never be traced. It is made with fetch/XHR like any other request,
  // so tracing it produces a span, which schedules an export, which produces a span: the loop is
  // slow but unbounded, and it is the classic way to take a collector down with one browser tab.
  const ignoreUrls = [new RegExp(`${OTEL_TRACES_ENDPOINT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)];

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new DocumentLoadInstrumentation(),
      // Angular's HttpClient uses XMLHttpRequest, so this is the one that matters for API calls.
      new XMLHttpRequestInstrumentation({
        ignoreUrls,
        applyCustomAttributesOnSpan(span, xhr) {
          applyScrubbedUrl(span, (xhr as XMLHttpRequest & { responseURL?: string }).responseURL);
        },
      }),
      // Nothing in the app calls fetch directly today, but the i18n loader and any future code
      // might, and an untraced hole is worse than a redundant instrumentation.
      new FetchInstrumentation({
        ignoreUrls,
        applyCustomAttributesOnSpan(span, request) {
          applyScrubbedUrl(span, (request as Request).url);
        },
      }),
    ],
  });
};

/**
 * Records an unhandled error against the current span, so a browser exception is visible in the
 * same trace as the request that caused it rather than only in a console nobody is watching.
 *
 * Wired from the global error handler rather than from components: the point is to catch what
 * nothing else caught.
 */
export const recordTelemetryError = (error: unknown): void => {
  if (!OTEL_ENABLED) {
    return;
  }
  const span = trace.getSpan(context.active());
  if (!span) {
    return;
  }
  span.recordException(error instanceof Error ? error : new Error(String(error)));
};
