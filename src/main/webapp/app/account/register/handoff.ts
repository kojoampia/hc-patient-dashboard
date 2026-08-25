/**
 * The surfaces allowed to claim they sent somebody here.
 *
 * <p>`web.abofonsa.com` appends `?src=` to its handoff link so the funnel can be joined from this end — the sending
 * site has no analytics by design, so registrations carrying a source are the first stage anybody can count.</p>
 *
 * <h2>Why this is an allowlist and not a passthrough</h2>
 *
 * <p>The value is a query parameter, which means it is whatever the caller typed, and it ends up on a user record a
 * human reads and a report counts. An open field would let anyone attribute registrations to a campaign that did not
 * send them, or write a string that breaks whatever renders it — and it would do so quietly, polluting the exact
 * number the parameter exists to produce.</p>
 *
 * <p><strong>The cost is that a new surface needs a line here.</strong> The contract says the site may add surfaces
 * without telling us, and an unlisted one loses its attribution silently rather than loudly. That is the deliberate
 * trade, and the sending side has been told: it is cheaper to add a line than to un-poison a metric.</p>
 */
const KNOWN_SOURCES: readonly string[] = ['web-home'];

/**
 * @param src the raw `src` query parameter, or null when absent.
 * @returns the source when it is one we recognise, otherwise null — never the caller's own text.
 */
export function handoffSource(src: string | null): string | null {
  return src !== null && KNOWN_SOURCES.includes(src) ? src : null;
}
