import { Signal, signal } from '@angular/core';

import { IAddress } from 'app/entities/patientMS/address/address.model';

/**
 * The line under the patient's name in the sidebar — "Patient · Accra, GH".
 *
 * <p>Kept as a focused spec rather than a full ShellComponent render, following `shell-rail.spec.ts`:
 * the component pulls in the router, the account service, the portal data layer and the delegation
 * lookup, none of which this behaviour touches.</p>
 *
 * <p><b>The rule that matters is the suppression, not the formatting.</b> This footer names the
 * SIGNED-IN account — `displayName()` reads `account`, not the open record — so while a care angel is
 * acting for somebody, appending the open record's town would put one person's name directly above
 * another person's location. In the one component whose job is to keep those two straight, a few
 * pixels under the acting-as banner that says they are different.</p>
 */

/** The component's computation, in the form the component holds it. Kept in step deliberately. */
function placeOf(actingForSomeoneElse: Signal<boolean>, address: Signal<IAddress | null | undefined>): string {
  if (actingForSomeoneElse()) {
    return '';
  }
  const value = address();
  if (!value) {
    return '';
  }
  return [value.town, value.region]
    .map(part => part?.trim())
    .filter((part): part is string => !!part)
    .join(', ');
}

describe('the sidebar place line', () => {
  const accra = { town: 'Accra', region: 'GH' } as IAddress;

  it('reads "town, region" for your own record', () => {
    expect(placeOf(signal(false), signal(accra))).toBe('Accra, GH');
  });

  it('says nothing at all while acting for somebody else', () => {
    // The whole reason this is a spec. The name above it is the angel's; the address would be the
    // patient's. Silence is the only honest answer, and the template falls back to a plain "Patient".
    expect(placeOf(signal(true), signal(accra))).toBe('');
  });

  it('says nothing when there is no address, rather than rendering a dangling separator', () => {
    expect(placeOf(signal(false), signal(null))).toBe('');
    expect(placeOf(signal(false), signal(undefined))).toBe('');
    expect(placeOf(signal(false), signal({} as IAddress))).toBe('');
  });

  it('drops a blank half rather than emitting "Accra, "', () => {
    expect(placeOf(signal(false), signal({ town: 'Accra', region: '  ' } as IAddress))).toBe('Accra');
    expect(placeOf(signal(false), signal({ town: null, region: 'GH' } as IAddress))).toBe('GH');
  });

  it('never carries the street, which a sidebar is not', () => {
    // Visible on every page, including one somebody is showing to a clinician across a desk. Town and
    // region place a person; a street address identifies where they sleep.
    const full = { streetAddress: '5 Ankobra River Street', town: 'Accra', region: 'GH' } as IAddress;

    expect(placeOf(signal(false), signal(full))).toBe('Accra, GH');
    expect(placeOf(signal(false), signal(full))).not.toContain('Ankobra');
  });
});
