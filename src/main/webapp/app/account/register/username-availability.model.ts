/**
 * The gateway's answer to a username look-ahead.
 *
 * `suggestions` is empty whenever `available` is true — the gateway does not spend queries looking
 * for alternatives to a name the user can already have.
 */
export interface UsernameAvailability {
  available: boolean;
  suggestions: string[];
}
