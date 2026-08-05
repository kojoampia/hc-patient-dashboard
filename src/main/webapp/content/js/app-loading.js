/*
 * Bootstrap shims that have to run before the Angular bundle.
 *
 * This lived as an inline <script> in index.html until 2026-08-05. It moved into a file so the
 * Content-Security-Policy can say script-src 'self' and mean it: an inline block would force
 * 'unsafe-inline', which permits every injected <script> on the page and gives up most of what a CSP
 * is for — particularly here, where the JWT sits in localStorage and is valid across all three
 * Health Connect products.
 *
 * A hash or a nonce would also have worked. A file is better: the hash has to be recomputed by hand
 * whenever this changes (and a stale one fails silently, taking the loading-error message with it),
 * and a nonce needs the server to rewrite index.html per response, which the static nginx container
 * that serves this bundle does not do.
 *
 * Loaded as a classic script from the same position in <body>, so it still runs before the module
 * bundles, which are deferred.
 */

// sockjs-client expects a CommonJS-style `global`. Only the chatbot uses it, and no backend
// implements /websocket, so this is inert today — but removing it belongs with removing that
// feature, not with a CSP change.
var global = window;

/*
 * Shows the "failed to load" panel if the bundle has not taken over within four seconds. Without it
 * a broken deploy is a blank white page, which is exactly what the telemetry outage of 2026-08-03
 * looked like to everyone watching.
 */
function showError() {
  var errorElm = document.getElementById('jhipster-error');
  if (errorElm && errorElm.style) {
    errorElm.style.display = 'block';
  }
}

window.onload = function () {
  setTimeout(showError, 4000);
};
