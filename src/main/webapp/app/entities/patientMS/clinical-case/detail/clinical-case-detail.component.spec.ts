import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ClinicalCaseDetailComponent } from './clinical-case-detail.component';

describe('ClinicalCase Management Detail Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicalCaseDetailComponent, RouterTestingModule.withRoutes([], { bindToComponentInputs: true })],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              component: ClinicalCaseDetailComponent,
              resolve: { clinicalCase: () => of({ id: 'ABC' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(ClinicalCaseDetailComponent, '')
      .compileComponents();
  });

  describe('OnInit', () => {
    it('Should load clinicalCase on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', ClinicalCaseDetailComponent);

      // THEN
      expect(instance.clinicalCase).toEqual(expect.objectContaining({ id: 'ABC' }));
    });
  });
});
