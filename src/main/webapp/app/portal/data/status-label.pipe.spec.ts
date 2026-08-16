import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { StatusLabelPipe } from './status-label.pipe';

/**
 * The vocabulary drift these cover: the portal rendered every status by sentence-casing the enum,
 * so an emergency read "High" where the patient was meant to read "Urgent".
 */
describe('StatusLabelPipe', () => {
  const LABELS: Record<string, string> = {
    'patientPortal.status.HIGH': 'Urgent',
    'patientPortal.status.TREATMENT': 'In treatment',
    'patientPortal.status.OK': 'In range',
  };

  let pipe: StatusLabelPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StatusLabelPipe,
        {
          provide: TranslateService,
          // ngx-translate returns the key itself when it has no translation for it.
          useValue: { instant: (key: string) => (key in LABELS ? LABELS[key] : key) },
        },
      ],
    });
    pipe = TestBed.inject(StatusLabelPipe);
  });

  it('gives an emergency the word a person reads, not the grading', () => {
    expect(pipe.transform('HIGH')).toBe('Urgent');
  });

  it('keeps the demo’s wording for a case and a reading', () => {
    expect(pipe.transform('TREATMENT')).toBe('In treatment');
    expect(pipe.transform('OK')).toBe('In range');
  });

  it('falls back to sentence case for a status nobody has translated yet', () => {
    // A backend that adds ESCALATED tomorrow must not render "patientPortal.status.ESCALATED".
    expect(pipe.transform('ESCALATED')).toBe('Escalated');
    expect(pipe.transform('AWAITING_REVIEW')).toBe('Awaiting review');
  });

  it.each([null, undefined, ''])('renders an em dash for %p', value => {
    expect(pipe.transform(value)).toBe('—');
  });
});
