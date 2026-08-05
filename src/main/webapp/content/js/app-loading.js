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

// NOTE: `var global = window;` used to sit here for sockjs-client. It went with the chatbot widget on
// 2026-08-05. If some other CommonJS-shaped dependency ever needs it, put it back deliberately with a
// comment naming that dependency — it is the kind of shim that gets re-added on a hunch and then
// nobody can tell whether anything still depends on it.

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
