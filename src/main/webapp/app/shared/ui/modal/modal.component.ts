import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { IconName } from 'app/shared/ui/icon/icon.constants';

/** Elements that can hold focus, in document order — what the focus trap cycles through. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The portal's dialog: a scrim, a card, and a title with a close button.
 *
 *   @if (showing()) {
 *     <hpd-modal titleKey="patientPortal.medications.detail" icon="pill" (closed)="showing.set(false)">
 *       …body…
 *     </hpd-modal>
 *   }
 *
 * Written rather than taken from ng-bootstrap, which the app carries for the account, admin and
 * entity screens. Those screens are Bootstrap's; the portal is not, and `.modal` is a Bootstrap
 * class — opening an `NgbModal` inside an `hc-` screen means styling around `.modal-dialog`,
 * `.modal-content` and their z-index rather than with them, for markup this is 40 lines of.
 *
 * What it does have to get right is the part a dialog is easy to get wrong: focus moves into the
 * dialog on open and is trapped while it is up, Escape closes it, the scrim closes it but a click
 * inside does not, and focus returns to whatever opened it. A row that opens a detail view and
 * leaves the reader's focus behind it on the page is worse than no detail view.
 */
@Component({
  selector: 'hpd-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SharedModule, IconComponent],
  template: `
    <div class="hc-modal" (click)="onScrim($event)">
      <div #box class="hc-modal__box" [class.hc-modal__box--wide]="wide" role="dialog" aria-modal="true" [attr.aria-label]="heading">
        <header class="hc-modal__head">
          @if (icon) {
            <span class="hc-modal__ic" [class]="tone ? 'hc-modal__ic--' + tone : ''">
              <hpd-icon [name]="icon" [size]="18" [strokeWidth]="2" />
            </span>
          }
          <h3>{{ heading }}</h3>
          <button type="button" class="hc-icon-btn" (click)="closed.emit()" [attr.aria-label]="'patientPortal.action.close' | translate">
            <hpd-icon name="x" [size]="18" />
          </button>
        </header>

        <ng-content />
      </div>
    </div>
  `,
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);

  /** Whatever had focus when the dialog opened, so it can be given back. */
  private readonly opener = this.document.activeElement as HTMLElement | null;

  /**
   * The dialog's title as a plain string — a record's own name, which is data rather than an
   * i18n key. Takes precedence over {@link titleKey}; one of the two must be given.
   */
  @Input() title?: string;

  /** The dialog's title as an i18n key, for a dialog whose heading is fixed wording. */
  @Input() titleKey?: string;

  @Input() icon?: IconName;

  /** `danger` or `gold` tints the icon disc — an alert reads differently from a lab report. */
  @Input() tone?: 'danger' | 'gold';

  /** Wider box, for a detail view that carries a table or a long note. */
  @Input() wide = false;

  @Output() readonly closed = new EventEmitter<void>();

  @ViewChild('box', { static: true }) box!: ElementRef<HTMLElement>;

  /** What the header shows and the dialog is announced as. */
  get heading(): string {
    return this.title ?? (this.titleKey ? (this.translate.instant(this.titleKey) as string) : '');
  }

  ngAfterViewInit(): void {
    this.focusables()[0]?.focus();
  }

  ngOnDestroy(): void {
    // Back where it came from: the row that opened this, so the reader keeps their place.
    this.opener?.focus();
  }

  /** A click on the scrim closes; a click that started inside the box does not. */
  onScrim(event: MouseEvent): void {
    if (!this.box.nativeElement.contains(event.target as Node)) {
      this.closed.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  /**
   * Tab and Shift+Tab wrap inside the dialog.
   *
   * Without this, tabbing past the last control walks into the page behind the scrim, where the
   * reader can operate things they cannot see.
   */
  @HostListener('document:keydown.tab', ['$event'])
  @HostListener('document:keydown.shift.tab', ['$event'])
  onTab(event: KeyboardEvent): void {
    const focusable = this.focusables();
    if (!focusable.length) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;

    if (event.shiftKey && (active === first || !this.box.nativeElement.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusables(): HTMLElement[] {
    return Array.from(this.box.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(element => element.offsetParent !== null);
  }
}
