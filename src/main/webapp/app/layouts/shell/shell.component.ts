import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, Signal, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { LoginService } from 'app/login/login.service';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { PortalDataService } from 'app/portal/data/portal-data.service';
import { SHELL_NAV, SHELL_TABS, ShellNavItem, navOwnerOf } from './shell-nav';
import { DEFAULT_PAGE_TITLE, PAGE_TITLES } from './shell-titles';

/** A sidebar group heading, emitted when the group changes down the nav list. */
interface NavGroup {
  readonly labelKey: string;
  readonly items: readonly ShellNavItem[];
}

/**
 * The portal's frame: navy sidebar, sticky topbar, and — below the shell breakpoint — a drawer
 * plus a bottom tab bar. Every portal screen renders into its outlet.
 */
@Component({
    selector: 'hpd-shell',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, RouterOutlet, RouterLink, IconComponent],
    templateUrl: './shell.component.html',
    styleUrl: './shell.component.scss'
})
export default class ShellComponent {
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly loginService = inject(LoginService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly data = inject(PortalDataService);

  /** Current portal path, e.g. `cases/12` — drives both the active nav item and the title. */
  private readonly activePath = signal(this.portalPathOf(this.router.url));

  /**
   * How many alerts are on the record, for the badge against Emergencies.
   *
   * The count belongs in the frame rather than on the Emergencies screen: its job is to be visible
   * from the screens that are *not* it. The fetch is shared by PortalDataService, so the screens
   * that show alerts anyway — the overview, emergencies itself — cost nothing extra, and the ones
   * that do not pay for a single collection to keep one number honest everywhere.
   */
  private readonly emergencies = toSignal(this.data.emergencies$, { initialValue: [] });

  /**
   * Counts per nav path, for the paths that have one. A signal each, so the sidebar tracks the data
   * rather than a snapshot; `Partial` because most destinations carry no number, and saying so is
   * what lets the lookup below be a real check rather than one TypeScript reads as always true.
   */
  private readonly badges: Partial<Record<string, Signal<number>>> = {
    emergencies: computed(() => this.emergencies().length),
  };

  /** The nav with its live counts attached — the config declares the destinations, this supplies
   * the numbers, which is why `badge` is a signal the nav file itself never sets. */
  private readonly nav: readonly ShellNavItem[] = SHELL_NAV.map(item => {
    const badge = this.badges[item.path];
    return badge ? { ...item, badge } : item;
  });

  readonly account = toSignal(this.accountService.getAuthenticationState(), { initialValue: null });

  /** Drawer state, only meaningful below the shell breakpoint. */
  readonly navOpen = signal(false);

  readonly tabs = this.nav.filter(item => SHELL_TABS.includes(item.path));

  /** The nav, pre-grouped so the template does not need a "did the group change" check. */
  readonly groups: readonly NavGroup[] = this.nav.reduce<NavGroup[]>((acc, item) => {
    const last = acc.at(-1);
    if (last?.labelKey === item.groupKey) {
      (last.items as ShellNavItem[]).push(item);
    } else {
      acc.push({ labelKey: item.groupKey, items: [item] });
    }
    return acc;
  }, []);

  /** Which sidebar entry reads as selected. A case detail keeps "Cases" lit. */
  readonly activeOwner = computed(() => navOwnerOf(this.activePath()));

  readonly title = computed(() => PAGE_TITLES[this.activeOwnerOrExact()] ?? DEFAULT_PAGE_TITLE);

  readonly displayName = computed(() => {
    const account = this.account();
    if (!account) {
      return '';
    }
    const full = [account.firstName, account.lastName].filter(Boolean).join(' ').trim();
    return full || account.login;
  });

  readonly initials = computed(() => {
    const account = this.account();
    if (!account) {
      return '';
    }
    const letters = [account.firstName, account.lastName]
      .filter((part): part is string => !!part)
      .map(part => part.trim()[0])
      .join('');
    return (letters || account.login.slice(0, 2)).toUpperCase();
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map(event => this.portalPathOf(event.urlAfterRedirects)),
        startWith(this.portalPathOf(this.router.url)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(path => {
        this.activePath.set(path);
        // A route change on mobile has to dismiss the drawer, or the new screen opens behind it.
        this.navOpen.set(false);
      });
  }

  openNav(): void {
    this.navOpen.set(true);
  }

  closeNav(): void {
    this.navOpen.set(false);
  }

  /** The drawer traps the screen behind a scrim; Escape has to get out of it. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeNav();
  }

  print(): void {
    window.print();
  }

  logout(): void {
    this.loginService.logout();
    void this.router.navigate(['/login']);
  }

  /**
   * The exact path when it has its own title (`visitations`), otherwise the owning nav entry.
   * Keeps "Activity trail" from being titled "My record".
   */
  private activeOwnerOrExact(): string {
    const [head] = this.activePath().split('/').filter(Boolean);
    return head && head in PAGE_TITLES ? head : this.activeOwner();
  }

  /** Strips the origin, query and fragment, leaving the portal-relative path. */
  private portalPathOf(url: string): string {
    return url.split(/[?#]/)[0].replace(/^\/+/, '');
  }
}
