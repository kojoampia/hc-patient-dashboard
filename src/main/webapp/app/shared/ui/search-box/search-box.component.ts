import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';

/**
 * The rounded search field used above every portal list.
 *
 * Emits on each keystroke: the lists it filters are already in memory, so debouncing would only
 * add lag. If a list ever moves to a server-side query, debounce there, not here.
 */
@Component({
    selector: 'hpd-search-box',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, IconComponent],
    template: `
    <div class="hc-search">
      <hpd-icon name="search" [size]="16" />
      <input
        type="search"
        autocomplete="off"
        [id]="inputId"
        [value]="value"
        [placeholder]="placeholderKey | translate"
        [attr.aria-label]="placeholderKey | translate"
        (input)="queryChange.emit($any($event.target).value)"
      />
    </div>
  `
})
export class SearchBoxComponent {
  @Input({ required: true }) inputId!: string;
  @Input({ required: true }) placeholderKey!: string;
  @Input() value = '';

  @Output() readonly queryChange = new EventEmitter<string>();
}
