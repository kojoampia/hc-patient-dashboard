import { Component, Input } from '@angular/core';
import SharedModule from 'app/shared/shared.module';

/**
 * Renders a block of HTML content.
 *
 * The content is bound straight to `[innerHTML]`, which means Angular's DomSanitizer runs over it and strips
 * scripts, event handlers and `javascript:` URLs. That is the whole point: this component used to call
 * `bypassSecurityTrustHtml` on an `@Input()` with no trusted source, behind a file-level `eslint-disable` that
 * suppressed the rules which would have flagged it. Nothing renders this component yet, so nothing was exploitable —
 * but whoever wires it up would have had no way to see the hole from the call site.
 *
 * If a future caller genuinely needs markup the sanitizer strips, sanitize at that boundary and justify it there, in
 * the style of `shared/ui/icon/icon.component.ts` — do not reinstate a blanket bypass here.
 */
@Component({
  selector: 'hpd-page-display',
  standalone: true,
  templateUrl: './page-display.component.html',
  styleUrls: ['./page-display.component.scss'],
  imports: [SharedModule],
})
export class PageDisplayComponent {
  @Input() title?: string;
  @Input() content?: string;
}
