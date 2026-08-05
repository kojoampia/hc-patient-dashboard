import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { isSafeResourceUrl } from 'app/core/util/safe-resource-url';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'hpd-file-viewer',
  standalone: true,
  templateUrl: './file-viewer.component.html',
  styleUrls: ['./file-viewer.component.scss'],
})
export class FileViewerComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject<boolean>();
  url?: string;
  title?: string;
  safeUrl?: SafeHtml;

  constructor(
    private sanitizer: DomSanitizer,
    private modal: NgbActiveModal,
  ) {}

  ngOnInit(): void {
    if (this.url) {
            // Only trust http(s). The bypass is a promise that this value is safe to use as a frame source, and
      // until 2026-08-05 it was made about an @Input() with no trusted source — a `javascript:` URL there
      // runs in this origin, where the JWT lives in localStorage. An untrusted URL renders nothing.
      this.safeUrl = isSafeResourceUrl(this.url) ? this.sanitizer.bypassSecurityTrustResourceUrl(this.url) : undefined;
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  close(): void {
    this.modal.close();
  }
}
