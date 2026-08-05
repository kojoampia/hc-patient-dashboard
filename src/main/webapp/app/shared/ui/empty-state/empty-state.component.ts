import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { IconName } from 'app/shared/ui/icon/icon.constants';

/**
 * What a list shows when it has nothing in it.
 *
 * Every portal list uses this rather than rendering nothing, because a blank panel and a panel
 * that failed to load look identical, and the patient cannot tell "you have no allergies on
 * file" from "we could not reach the server".
 */
@Component({
    selector: 'hpd-empty-state',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SharedModule, IconComponent],
    template: `
    <div class="hc-empty">
      <hpd-icon [name]="icon" [size]="42" [strokeWidth]="1.6" />
      <b [hpdTranslate]="titleKey"></b>
      @if (messageKey) {
        <span [hpdTranslate]="messageKey"></span>
      }
      <ng-content />
    </div>
  `
})
export class EmptyStateComponent {
  @Input({ required: true }) titleKey!: string;
  @Input() messageKey?: string;
  @Input() icon: IconName = 'inbox';
}
