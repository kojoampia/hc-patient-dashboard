import { ApplicationConfig, ErrorHandler, LOCALE_ID, importProvidersFrom } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterFeatures, TitleStrategy, provideRouter, withComponentInputBinding, withDebugTracing } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { NgbDateAdapter } from '@ng-bootstrap/ng-bootstrap';

import { DEBUG_INFO_ENABLED } from 'app/app.constants';
import './config/dayjs';
import { TranslationModule } from 'app/shared/language/translation.module';
import { httpInterceptorProviders } from 'app/core/interceptor/index';
import routes from './app.routes';
// jhipster-needle-angular-add-module-import JHipster will add new module here
import { NgbDateDayjsAdapter } from './config/datepicker-adapter';
import { AppPageTitleStrategy } from './app-page-title-strategy';
import { TelemetryErrorHandler } from 'app/core/telemetry/telemetry-error-handler';

const routerFeatures: Array<RouterFeatures> = [withComponentInputBinding()];
if (DEBUG_INFO_ENABLED) {
  routerFeatures.push(withDebugTracing());
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, ...routerFeatures),
    importProvidersFrom(BrowserModule),
    importProvidersFrom(BrowserAnimationsModule),
    // No service worker. Removed 2026-08-31 rather than left registered-but-disabled: the production
    // build was emitting ngsw-worker.js and ngsw.json into target/classes/static and shipping them to
    // every patient, while this line guaranteed nothing ever registered them. Half a PWA costs the
    // bundle and buys nothing.
    //
    // Turning it ON is a decision nobody has made, and not a small one: a service worker caches a
    // medical record on whatever browser it runs in, which on a shared or borrowed machine is a
    // data-at-rest question rather than a performance one. The offline story for this product is the
    // Capacitor app (hc-patient-app), where the record already sits behind a device lock and a
    // biometric prompt.
    importProvidersFrom(TranslationModule),
    // HttpClientModule was removed in Angular 20. withInterceptorsFromDi() is not optional here:
    // this app registers its auth, error and notification interceptors through the HTTP_INTERCEPTORS
    // DI token (core/interceptor/index.ts), and without it provideHttpClient silently ignores them —
    // which would strip the Authorization header from every request while everything still compiles.
    provideHttpClient(withInterceptorsFromDi()),
    Title,
    { provide: LOCALE_ID, useValue: 'en' },
    { provide: NgbDateAdapter, useClass: NgbDateDayjsAdapter },
    httpInterceptorProviders,
    { provide: TitleStrategy, useClass: AppPageTitleStrategy },
    // Records uncaught errors against the current span before Angular's default handling. A no-op
    // when telemetry is compiled out, so development behaviour is unchanged.
    { provide: ErrorHandler, useClass: TelemetryErrorHandler },
    // jhipster-needle-angular-add-module JHipster will add new module here
  ],
};
