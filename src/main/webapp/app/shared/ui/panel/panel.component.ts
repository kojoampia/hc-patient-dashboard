import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { IconName } from 'app/shared/ui/icon/icon.constants';

/**
 * A titled panel: cream header strip, body, optional footer.
 *
 *   <hpd-panel titleKey="patientPortal.record.vitals" icon="heart">
 *     …body…
 *     <ng-container hpdPanelActions><button …></ng-container>
 *     <ng-container hpdPanelFoot>…</ng-container>
 *   </hpd-panel>
 */
@Component({
  selector: 'hpd-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SharedModule, IconComponent],
  template: `
    <section class="hc-panel">
      <header class="hc-panel__head">
        @if (icon) {
          <hpd-icon [name]="icon" [size]="15" />
        }
        <h4 [hpdTranslate]="titleKey"></h4>
        <ng-content select="[hpdPanelActions]" />
      </header>

      <div class="hc-panel__body" [class.hc-panel__body--pad]="padded">
        <ng-content />
      </div>

      <ng-content select="[hpdPanelFoot]" />
    </section>
  `,
})
export class PanelComponent {
  @Input({ required: true }) titleKey!: string;
  @Input() icon?: IconName;

  /** Panels that hold prose or a form need padding; panels that hold full-bleed rows do not. */
  @Input() padded = false;
}
