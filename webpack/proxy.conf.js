/**
 * Where `npm start` sends API traffic.
 *
 * The dev server serves the app and proxies these paths onward, so the browser only ever talks to
 * one origin — the same shape production has, where the web container's nginx does the fan-out.
 * That is the point: the bundle builds relative URLs (`api/profiles`), so nothing here needs CORS,
 * and the gateway can keep it disabled as production requires.
 *
 * It has not always worked that way. The dev bundle used to be built with an absolute
 * `SERVER_API_URL` of `http://localhost:5505/`, which sent the browser straight past this proxy and
 * cross-origin to the gateway — where the disabled CORS answered the preflight with 403 and the
 * request with 503. The proxy was configured correctly the whole time and simply never used, so
 * `npm start` could not reach a gateway at all.
 *
 * ## Pointing it somewhere else
 *
 * `HC_GATEWAY_URL` overrides the target, which is how you develop against a gateway that is not on
 * this machine — the quality stack, say, whose ports bind loopback on jacserver:
 *
 *     ssh -N -L 5505:127.0.0.1:15505 jacserver &
 *     npm start                                   # the default target already points at :5505
 *
 * or, without a tunnel, straight at any reachable gateway:
 *
 *     HC_GATEWAY_URL=http://gateway.example:5505 npm start
 *
 * Either way the browser stays same-origin and CORS never enters into it.
 */
function setupProxy({ tls }) {
  const serverResources = ['/api', '/services', '/management', '/v3/api-docs', '/h2-console', '/auth', '/health'];
  const target = process.env.HC_GATEWAY_URL || `http${tls ? 's' : ''}://localhost:5505`;
  const conf = [
    {
      context: serverResources,
      target,
      secure: false,
      // Rewrite the Host header when the target is not the local gateway: a remote one may route by
      // it, and `localhost:4200` means nothing there.
      changeOrigin: tls || Boolean(process.env.HC_GATEWAY_URL),
    },
  ];
  return conf;
}

module.exports = setupProxy;
