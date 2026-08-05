/**
 * Scheme allowlist for URLs that get handed to `DomSanitizer.bypassSecurityTrustResourceUrl`.
 *
 * A resource URL ends up as the `src` of an iframe, object or embed. Angular refuses to interpolate one without an
 * explicit bypass precisely because the sanitizer cannot tell a safe document from a hostile one — so the bypass is
 * a promise by the caller that the value is trustworthy, and two widgets here were making that promise about an
 * `@Input()` with no trusted source (2026-08-05 audit, finding 10).
 *
 * What this stops: `javascript:` executes in the page's origin the moment the element is attached, which with the JWT
 * in localStorage is a full account takeover across all three Health Connect products. `data:text/html` gets a
 * same-origin-ish document in some browsers and is a phishing surface in all of them. `blob:` and `filesystem:` are
 * the same story by a different route.
 *
 * What this does not stop: an http(s) URL pointing somewhere hostile. Framing an attacker's page is a far smaller
 * problem than running their script, but if these widgets ever render URLs a user can supply, this needs to become a
 * host allowlist rather than a scheme one.
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export function isSafeResourceUrl(raw: string | null | undefined): boolean {
  if (!raw) {
    return false;
  }
  try {
    // Resolved against the current origin so relative URLs — which is what this app actually uses — are accepted
    // rather than throwing. The one-argument URL constructor rejects them.
    const parsed = new URL(raw, window.location.origin);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    // Unparseable is untrusted. Never fall through to trusting the raw value.
    return false;
  }
}
