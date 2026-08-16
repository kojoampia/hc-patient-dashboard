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
  styles: [
    `
      /* A custom element is inline until told otherwise, and a vertical margin on an inline element
         does nothing at all. Four templates put \`hc-mt-16\` on this component and got no gap for it —
         visible on the allergies screen, where the conditions panel sat flush against the card above
         it and the two read as one block. Everywhere else a grid supplies the spacing, which is why
         it went unnoticed for so long. */
      :host {
        display: block;
      }
    `,
  ],
})
export class PanelComponent {
  @Input({ required: true }) titleKey!: string;
  @Input() icon?: IconName;

  /** Panels that hold prose or a form need padding; panels that hold full-bleed rows do not. */
  @Input() padded = false;
}
