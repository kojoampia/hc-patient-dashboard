import { ErrorHandler, Injectable } from '@angular/core';

import { recordTelemetryError } from 'app/core/telemetry/telemetry';

/**
 * Reports uncaught client-side errors to the active trace, then hands off to Angular's default
 * handling.
 *
 * This is the only signal in the whole stack for a failure that never reaches a server: a template
 * expression throwing, a null dereference in a widget, an RxJS error nothing subscribed to. The
 * backend logs stay silent for all of them, so without this the first report is a user saying "the
 * page went blank".
 *
 * `ErrorHandlerInterceptor` in core/interceptor is a different thing and both are wanted: that one
 * sees failed HTTP responses, which are already visible as spans and server-side errors. This one
 * sees the errors that produce no request at all.
 */
@Injectable()
export class TelemetryErrorHandler extends ErrorHandler {
  override handleError(error: unknown): void {
    // Reporting must never be what breaks the page. If the SDK throws — a detached context, an
    // exporter mid-shutdown — swallow it and let Angular's handler still run.
    try {
      recordTelemetryError(error);
    } catch {
      // Deliberately ignored; see above.
    }
    super.handleError(error);
  }
}
