import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';

import SharedModule from 'app/shared/shared.module';

/** How many numbered buttons are shown before the list starts sliding. */
const WINDOW = 10;

/**
 * Numbered pagination for the portal's client-side lists.
 *
 * Renders nothing at all when there is only one page — a lone disabled "1" is noise.
 */
@Component({
    selector: 'hpd-pager',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule],
    template: `
    @if (total() > 1) {
      <nav class="hc-pager" [attr.aria-label]="'patientPortal.pager.aria' | translate">
        <button type="button" class="hc-pager__edge" [disabled]="page() <= 1" (click)="go(page() - 1)">
          &laquo; <span hpdTranslate="patientPortal.pager.prev">Prev</span>
        </button>

        @for (n of numbers(); track n) {
          <button type="button" [class.is-active]="n === page()" [attr.aria-current]="n === page() ? 'page' : null" (click)="go(n)">
            {{ n }}
          </button>
        }

        <button type="button" class="hc-pager__edge" [disabled]="page() >= total()" (click)="go(page() + 1)">
          <span hpdTranslate="patientPortal.pager.next">Next</span> &raquo;
        </button>
      </nav>
    }
  `
})
export class PagerComponent {
  readonly page = signal(1);
  readonly total = signal(1);

  @Output() readonly pageChange = new EventEmitter<number>();

  @Input({ required: true })
  set totalPages(value: number) {
    this.total.set(Math.max(1, value));
  }

  @Input({ required: true })
  set currentPage(value: number) {
    this.page.set(value);
  }

  /** The sliding window of page numbers, kept centred on the current page where it can be. */
  readonly numbers = computed<number[]>(() => {
    const total = this.total();
    if (total <= WINDOW) {
      return range(1, total);
    }
    const from = Math.max(1, Math.min(this.page() - 4, total - WINDOW + 1));
    return range(from, Math.min(total, from + WINDOW - 1));
  });

  go(next: number): void {
    const clamped = Math.min(Math.max(1, next), this.total());
    if (clamped !== this.page()) {
      this.pageChange.emit(clamped);
    }
  }
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
