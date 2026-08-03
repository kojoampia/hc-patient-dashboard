// These constants are injected via webpack DefinePlugin variables.
// You can add more variables in webpack.common.js or in profile specific webpack.<dev|prod>.js files.
// If you change the values in the webpack config files, you need to re run webpack to update the application

declare const __DEBUG_INFO_ENABLED__: boolean;
declare const __VERSION__: string;
declare const __OTEL_ENABLED__: boolean;
declare const __OTEL_TRACES_ENDPOINT__: string;
declare const __OTEL_SAMPLE_RATIO__: number;

export const VERSION = __VERSION__;
export const DEBUG_INFO_ENABLED = __DEBUG_INFO_ENABLED__;

// Browser telemetry. Off in development, where there is no collector to send to.
export const OTEL_ENABLED = __OTEL_ENABLED__;
// Same-origin path. The browser must never be given the collector's real address: it sits on an
// internal Docker network, and the only reason this works is that nginx forwards this one path.
export const OTEL_TRACES_ENDPOINT = __OTEL_TRACES_ENDPOINT__;
export const OTEL_SAMPLE_RATIO = __OTEL_SAMPLE_RATIO__;
