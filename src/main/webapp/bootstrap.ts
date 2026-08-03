import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import AppComponent from './app/app.component';

import { DEBUG_INFO_ENABLED } from './app/app.constants';
import { initTelemetry } from './app/core/telemetry/telemetry';

// disable debug data on prod profile to improve performance
if (!DEBUG_INFO_ENABLED) {
  enableProdMode();
}

// Before bootstrapApplication, not in an APP_INITIALIZER: the document-load instrumentation reads
// the browser's navigation timings for the initial page, and registering it after Angular has
// started means those timings are already gone. A no-op unless the build enabled telemetry.
initTelemetry();

bootstrapApplication(AppComponent, appConfig)
  // eslint-disable-next-line no-console
  .then(() => console.log('Application started'))
  .catch(err => console.error(err));
