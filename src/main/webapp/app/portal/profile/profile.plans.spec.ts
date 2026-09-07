import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { IProfile } from 'app/entities/patientMS/profile/profile.model';
import { MembershipService } from 'app/entities/patientMS/membership/service/membership.service';

import { PatientContextService } from '../data/patient-context.service';
import { PortalDataService } from '../data/portal-data.service';
import { CareDelegationService } from '../data/care-delegation.service';
import { MembershipPlan, MembershipPlanService } from '../data/membership-plan.service';

import ProfileComponent from './profile.component';

/**
 * The plan chooser on the Membership tab.
 *
 * <p>Pinned because the screen renders another product's payload and had been dropping most of it: until 2026-09-07
 * the three tiers were laid out as {@code .hc-kv} rows — a one-line label/value component — and the currency, the
 * feature list, the featured flag and the display order were all discarded. None of that fails a build, and the only
 * signal was somebody opening the tab.</p>
 */
describe('ProfileComponent — the plan chooser', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  /** What the content API answers with. Set by `render`, read lazily by the stubbed service. */
  let available: readonly MembershipPlan[] = [];

  const plan = (over: Partial<MembershipPlan>): MembershipPlan =>
    ({ id: 'plan-1', code: 'PEAR', name: 'PEAR Plan', ...over }) as MembershipPlan;

  const pear = plan({
    id: 'plan-pear',
    code: 'PEAR',
    name: 'PEAR Plan',
    priceAmount: '3,000',
    priceCurrency: 'GHS',
    priceNote: "Minimum three-month term · 30 days' notice",
    forWho: 'A dependable weekday routine.',
    featured: false,
    displayOrder: 1,
    features: [
      { label: '5 weekly visits', included: true },
      { label: 'Doctor review included', included: false },
    ],
  });

  const pawpaw = plan({
    id: 'plan-pawpaw',
    code: 'PAWPAW',
    name: 'PAWPAW Plan',
    priceAmount: '5,000',
    priceCurrency: 'GHS',
    featured: true,
    displayOrder: 2,
  });

  const melon = plan({ id: 'plan-melon', code: 'MELON', name: 'MELON Plan', priceAmount: '8,000', priceCurrency: 'GHS', displayOrder: 3 });

  /** Renders the component with the Membership tab open, which is where the chooser lives. */
  const render = (plans: readonly MembershipPlan[]): void => {
    available = plans;
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.componentInstance.activeTab.set('membership');
    fixture.detectChanges();
  };

  const cards = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('.hc-plan'));
  const text = (element: Element | null): string => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

  beforeEach(() => {
    available = [];
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), RouterTestingModule, ProfileComponent],
      providers: [
        {
          provide: PatientContextService,
          useValue: {
            profile$: of({ id: 'p1', patientId: 'patient-1', firstName: 'Kojo', lastName: 'Ampia-Addison' } as IProfile),
            careTeam$: of([]),
            reload: jest.fn(),
          },
        },
        { provide: PortalDataService, useValue: { memberships$: of([]), reload: jest.fn() } },
        { provide: CareDelegationService, useValue: { forCurrentPatient: () => of([]), revoke: jest.fn() } },
        { provide: MembershipPlanService, useValue: { plans: () => of(available) } },
        { provide: MembershipService, useValue: { create: jest.fn().mockReturnValue(of({})) } },
      ],
    });
  });

  it('renders one card per tier, with the name as a heading', () => {
    render([pear, pawpaw, melon]);

    expect(cards()).toHaveLength(3);
    expect(cards().map(card => text(card.querySelector('h4.hc-plan__name')))).toEqual(['PEAR Plan', 'PAWPAW Plan', 'MELON Plan']);
  });

  // The regression this whole entry is about. `.hc-kv__k` is a 76px grey field label, so the plan's
  // own name was being rendered as though it named a field rather than a product.
  it('does not lay the chooser out as key/value rows', () => {
    render([pear, pawpaw, melon]);

    expect(cards().every(card => card.querySelector('.hc-kv') === null)).toBe(true);
    // Nor as a two-column grid: three tiers in two columns leave the third alone on a second row.
    expect(fixture.nativeElement.querySelector('.hc-plan')?.closest('.hc-grid--2')).toBeFalsy();
  });

  it('shows the currency beside the amount, both exactly as they arrived', () => {
    render([pear]);

    const price = cards()[0].querySelector('.hc-plan__price');
    expect(text(price?.querySelector('.hc-plan__currency') ?? null)).toBe('GHS');
    expect(text(price?.querySelector('.hc-plan__amount') ?? null)).toBe('3,000');
    // No thousands separator moved, no symbol substituted, no decimals invented — and a real space
    // between the two, so the price reads and copies as one thing rather than as "GHS3,000".
    expect(price?.textContent).toBe('GHS 3,000');
  });

  it('renders the amount alone when the tier carries no currency', () => {
    render([plan({ id: 'x', priceAmount: '3,000', priceCurrency: null })]);

    expect(cards()[0].querySelector('.hc-plan__currency')).toBeNull();
    expect(text(cards()[0].querySelector('.hc-plan__price'))).toBe('3,000');
  });

  it('lists every feature and marks the ones the tier excludes', () => {
    render([pear]);

    const features = Array.from(cards()[0].querySelectorAll<HTMLElement>('.hc-plan__feature'));
    expect(features.map(item => text(item))).toEqual(['5 weekly visits', 'Doctor review included']);
    // An excluded feature is shown, not hidden — it is what distinguishes one tier from the next.
    expect(features.map(item => item.classList.contains('is-excluded'))).toEqual([false, true]);
  });

  it('marks the featured tier, and only it', () => {
    render([pear, pawpaw, melon]);

    expect(cards().map(card => card.classList.contains('hc-plan--featured'))).toEqual([false, true, false]);
  });

  it('orders by displayOrder rather than by the order the response happened to arrive in', () => {
    render([melon, pear, pawpaw]);

    expect(fixture.componentInstance.orderedPlans().map(item => item.code)).toEqual(['PEAR', 'PAWPAW', 'MELON']);
  });

  it('sorts a tier with no displayOrder last, so an addition appends rather than taking the top', () => {
    const unordered = plan({ id: 'plan-new', code: 'NEW', name: 'NEW Plan', displayOrder: undefined });
    render([unordered, melon, pear]);

    expect(fixture.componentInstance.orderedPlans().map(item => item.code)).toEqual(['PEAR', 'MELON', 'NEW']);
  });

  it('names the tier in each Choose button, so three of them are told apart', () => {
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { patientPortal: { profile: { plan: { selectFor: 'Choose the {{name}}' } } } });
    translate.use('en');

    render([pear, pawpaw, melon]);

    const labels = cards().map(card => card.querySelector('.hc-plan__choose')?.getAttribute('aria-label'));
    expect(labels).toEqual(['Choose the PEAR Plan', 'Choose the PAWPAW Plan', 'Choose the MELON Plan']);
  });

  it('says nothing is available rather than showing an empty grid', () => {
    render([]);

    expect(cards()).toHaveLength(0);
    expect(text(fixture.nativeElement.querySelector('[role="tabpanel"] p.hc-prose'))).toContain('patientPortal.profile.plan.unavailable');
  });
});
